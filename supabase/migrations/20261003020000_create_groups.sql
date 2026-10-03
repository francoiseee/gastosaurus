-- Phase 2 — Groups, members and invites
--
-- A group member is its own row, NOT just a link to an account. That lets
-- people add barkada by name ("Miguel", "Bea") before those friends have a
-- Gastosaurus account. Such a "guest" member has user_id = null. When the
-- friend signs up and accepts an email invite, the invite can point at their
-- guest row (member_id) and they claim it — keeping its whole history.
--
-- Expenses, shares and settlements (next migration) reference group_members.id.
--
-- Writes happen only through the Express API (which checks membership in the
-- service layer). RLS below lets logged-in users READ their own groups through
-- the Supabase REST API and nothing else; there are no insert/update/delete
-- policies, so the public key can't change anything here.

create table public.groups (
  id          uuid primary key default gen_random_uuid(),
  name        varchar(60)  not null check (length(trim(name)) > 0),
  note        varchar(280),
  category    varchar(40)  not null default 'Other',
  icon_id     varchar(20)  not null default 'set1_2_3',
  icon_bg     varchar(9)   not null default '#FFEBEF',
  icon_color  varchar(9)   not null default '#D94668',
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz  not null default now(),
  updated_at  timestamptz  not null default now()
);

create table public.group_members (
  id            uuid primary key default gen_random_uuid(),
  group_id      uuid not null references public.groups (id) on delete cascade,
  user_id       uuid references public.profiles (id) on delete set null,  -- null = guest
  display_name  varchar(60) not null check (length(trim(display_name)) > 0),
  role          text not null default 'member' check (role in ('admin', 'member')),
  joined_at     timestamptz not null default now(),
  left_at       timestamptz,                                                -- null = active
  seq           bigint generated always as identity,                        -- stable order ("first people listed")
  constraint guests_are_not_admins check (role = 'member' or user_id is not null)
);

-- One row per account per group (a returning member gets their old row back).
create unique index group_members_one_per_user on public.group_members (group_id, user_id) where user_id is not null;
create index group_members_user_id_idx on public.group_members (user_id);

create table public.group_invites (
  id            uuid primary key default gen_random_uuid(),
  group_id      uuid not null references public.groups (id) on delete cascade,
  email         varchar(254) not null check (email = lower(email)),
  member_id     uuid references public.group_members (id) on delete set null,  -- guest row to claim, optional
  invited_by    uuid references public.profiles (id) on delete set null,
  status        text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  created_at    timestamptz not null default now(),
  responded_at  timestamptz
);

create unique index group_invites_one_pending on public.group_invites (group_id, email) where status = 'pending';
create index group_invites_email_idx on public.group_invites (email) where status = 'pending';
create index group_invites_member_id_idx on public.group_invites (member_id);
create index group_invites_invited_by_idx on public.group_invites (invited_by);
create index groups_created_by_idx on public.groups (created_by);

create trigger groups_set_updated_at
  before update on public.groups
  for each row execute function public.set_updated_at();

-- ─── Row Level Security ─────────────────────────────────────────────────────
-- Helper lives in a schema the REST API doesn't expose. It is security definer
-- so the group_members policy can look at group_members without recursing.
create schema if not exists private;
grant usage on schema private to authenticated;

create function private.is_group_member(target_group uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.group_members
    where group_id = target_group
      and user_id = (select auth.uid())
      and left_at is null
  );
$$;

revoke execute on function private.is_group_member(uuid) from public, anon;
grant execute on function private.is_group_member(uuid) to authenticated;

alter table public.groups        enable row level security;
alter table public.group_members enable row level security;
alter table public.group_invites enable row level security;

create policy "Members can view their groups"
  on public.groups for select to authenticated
  using (private.is_group_member(id));

create policy "Members can view who is in their groups"
  on public.group_members for select to authenticated
  using (private.is_group_member(group_id));

create policy "Members can view their groups' invites"
  on public.group_invites for select to authenticated
  using (private.is_group_member(group_id));
