-- Phase 2 (core) — Expenses, splitting, balances and settlements
--
-- How the money is stored:
--   expenses               one row per bill: total, who paid, how it was split
--   expense_items          the receipt lines of an itemized bill (kind = 'item'),
--                          plus charges/discounts such as service charge (kind = 'charge')
--   expense_item_assignees who had each item
--   expense_shares         THE SOURCE OF TRUTH: what each member owes for this bill.
--                          Every split type ends up here, and the shares always
--                          add up to the total (checked by a trigger at commit).
--   settlements            payments between members (cash, GCash, Maya, bank)
--   group_balances         a VIEW: each member's live net balance
--
-- All money is numeric(12,2) — never float.

-- Lets the tables below require "this member belongs to THIS group".
alter table public.group_members add constraint group_members_group_id_id_key unique (group_id, id);

create table public.expenses (
  id            uuid primary key default gen_random_uuid(),
  group_id      uuid not null references public.groups (id) on delete cascade,
  description   varchar(120) not null check (length(trim(description)) > 0),
  total_amount  numeric(12,2) not null check (total_amount > 0),
  paid_by       uuid not null,
  split_type    text not null check (split_type in ('equal', 'itemized', 'custom')),
  spent_on      date not null default current_date,
  note          varchar(280),
  created_by    uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  foreign key (group_id, paid_by) references public.group_members (group_id, id)
);

create index expenses_group_spent_idx on public.expenses (group_id, spent_on desc, created_at desc);
create index expenses_paid_by_idx on public.expenses (group_id, paid_by);
create index expenses_created_by_idx on public.expenses (created_by);

create trigger expenses_set_updated_at
  before update on public.expenses
  for each row execute function public.set_updated_at();

create table public.expense_items (
  id          uuid primary key default gen_random_uuid(),
  expense_id  uuid not null references public.expenses (id) on delete cascade,
  kind        text not null default 'item' check (kind in ('item', 'charge')),
  name        varchar(80) not null,
  price       numeric(12,2) not null,                  -- a charge may be negative (discount)
  position    smallint not null default 0,
  check (kind = 'charge' or price >= 0)
);

create index expense_items_expense_id_idx on public.expense_items (expense_id, position);

create table public.expense_item_assignees (
  item_id    uuid not null references public.expense_items (id) on delete cascade,
  member_id  uuid not null references public.group_members (id) on delete cascade,
  primary key (item_id, member_id)
);

create index expense_item_assignees_member_idx on public.expense_item_assignees (member_id);

create table public.expense_shares (
  expense_id  uuid not null references public.expenses (id) on delete cascade,
  member_id   uuid not null references public.group_members (id) on delete cascade,
  amount      numeric(12,2) not null check (amount >= 0),
  primary key (expense_id, member_id)
);

create index expense_shares_member_idx on public.expense_shares (member_id);

-- Safety net: at COMMIT, an expense's shares must add up to its total exactly.
-- (The API already guarantees this; the database refuses anything else.)
create function private.check_expense_shares_total()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  target uuid;
  expected numeric;
  actual numeric;
begin
  if tg_table_name = 'expenses' then
    target := new.id;
  elsif tg_op = 'DELETE' then
    target := old.expense_id;
  else
    target := new.expense_id;
  end if;

  select total_amount into expected from public.expenses where id = target;
  if not found then
    return null; -- expense was deleted; its shares went with it
  end if;

  select coalesce(sum(amount), 0) into actual from public.expense_shares where expense_id = target;
  if actual <> expected then
    raise exception 'Shares for expense % add up to %, but the total is %', target, actual, expected
      using errcode = 'check_violation';
  end if;
  return null;
end;
$$;

create constraint trigger expense_shares_add_up
  after insert or update or delete on public.expense_shares
  deferrable initially deferred
  for each row execute function private.check_expense_shares_total();

create constraint trigger expense_total_matches_shares
  after insert or update of total_amount on public.expenses
  deferrable initially deferred
  for each row execute function private.check_expense_shares_total();

create table public.settlements (
  id            uuid primary key default gen_random_uuid(),
  group_id      uuid not null references public.groups (id) on delete cascade,
  from_member   uuid not null,                                   -- who paid
  to_member     uuid not null,                                   -- who received
  amount        numeric(12,2) not null check (amount > 0),
  method        text not null default 'cash' check (method in ('cash', 'gcash', 'maya', 'bank')),
  status        text not null default 'pending' check (status in ('pending', 'completed')),
  note          varchar(280),
  created_by    uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  completed_at  timestamptz,
  check (from_member <> to_member),
  check ((status = 'completed') = (completed_at is not null)),
  foreign key (group_id, from_member) references public.group_members (group_id, id),
  foreign key (group_id, to_member)   references public.group_members (group_id, id)
);

create index settlements_group_idx on public.settlements (group_id, created_at desc);
create index settlements_from_idx on public.settlements (group_id, from_member);
create index settlements_to_idx on public.settlements (group_id, to_member);
create index settlements_created_by_idx on public.settlements (created_by);

-- ─── Live balances ──────────────────────────────────────────────────────────
--   net = paid for the group − own shares + payments sent − payments received
--   net > 0 → is owed money,  net < 0 → owes money,  0 → settled
-- Only COMPLETED settlements count. security_invoker makes the view obey the
-- caller's RLS (so it never leaks other groups through the REST API).
create view public.group_balances
with (security_invoker = true)
as
select
  m.group_id,
  m.id as member_id,
  coalesce(paid.total, 0)
    - coalesce(owed.total, 0)
    + coalesce(sent.total, 0)
    - coalesce(received.total, 0) as net,
  coalesce(paid.total, 0) as total_paid,
  coalesce(owed.total, 0) as total_share
from public.group_members m
left join (
  select paid_by as member_id, sum(total_amount) as total from public.expenses group by paid_by
) paid on paid.member_id = m.id
left join (
  select member_id, sum(amount) as total from public.expense_shares group by member_id
) owed on owed.member_id = m.id
left join (
  select from_member as member_id, sum(amount) as total
  from public.settlements where status = 'completed' group by from_member
) sent on sent.member_id = m.id
left join (
  select to_member as member_id, sum(amount) as total
  from public.settlements where status = 'completed' group by to_member
) received on received.member_id = m.id;

revoke all on public.group_balances from anon;

-- ─── Row Level Security (read-only for members; writes go through the API) ─
alter table public.expenses               enable row level security;
alter table public.expense_items          enable row level security;
alter table public.expense_item_assignees enable row level security;
alter table public.expense_shares         enable row level security;
alter table public.settlements            enable row level security;

create policy "Members can view their groups' expenses"
  on public.expenses for select to authenticated
  using (private.is_group_member(group_id));

create policy "Members can view their groups' expense items"
  on public.expense_items for select to authenticated
  using (exists (select 1 from public.expenses e where e.id = expense_id and private.is_group_member(e.group_id)));

create policy "Members can view who had each item"
  on public.expense_item_assignees for select to authenticated
  using (exists (
    select 1 from public.expense_items i join public.expenses e on e.id = i.expense_id
    where i.id = item_id and private.is_group_member(e.group_id)
  ));

create policy "Members can view their groups' shares"
  on public.expense_shares for select to authenticated
  using (exists (select 1 from public.expenses e where e.id = expense_id and private.is_group_member(e.group_id)));

create policy "Members can view their groups' settlements"
  on public.settlements for select to authenticated
  using (private.is_group_member(group_id));
