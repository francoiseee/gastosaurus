-- Phase 5 — Notifications
--
-- One row per message per user. The API writes them in the SAME transaction
-- as the event that caused them (expense added, payment recorded, invite
-- sent…), so a notification never exists for something that was rolled back.
--
--   type      → how the app labels it
--     'welcome'  first login
--     'invite'   you were invited to a group            (ACTION REQUIRED)
--     'group'    someone joined / you were removed     (GROUP UPDATE)
--     'expense'  a bill you're part of was added/changed (NEW EXPENSE)
--     'payment'  a payment to/from you was recorded/confirmed (PAYMENT)
--     'reminder' a groupmate nudged you to settle up    (ACTION REQUIRED)
--   data      → ids the app needs to open the right screen ({ groupId, expenseId, … })

create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  type        text not null check (type in ('welcome', 'invite', 'group', 'expense', 'payment', 'reminder')),
  title       varchar(200) not null,
  body        varchar(400),
  group_id    uuid references public.groups (id) on delete cascade,
  actor_id    uuid references public.profiles (id) on delete set null,
  data        jsonb not null default '{}'::jsonb,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index notifications_user_created_idx on public.notifications (user_id, created_at desc);
create index notifications_user_unread_idx on public.notifications (user_id) where read_at is null;
create index notifications_group_id_idx on public.notifications (group_id);
create index notifications_actor_id_idx on public.notifications (actor_id);
-- Used by the reminder cooldown ("one nudge per person per group every 12 hours")
create index notifications_reminder_idx on public.notifications (user_id, group_id, created_at desc) where type = 'reminder';

-- RLS: you can read your own notifications (this is also what lets the app
-- subscribe to them live with Supabase Realtime). Writes go through the API.
alter table public.notifications enable row level security;

create policy "Users can view their own notifications"
  on public.notifications for select to authenticated
  using ((select auth.uid()) = user_id);

-- Live updates: add the table to Supabase Realtime when that publication exists
-- (it always does on Supabase; it doesn't in the local test database).
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.notifications;
  end if;
end;
$$;

-- Welcome message on sign-up: same trigger as Phase 1, plus one notification.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  display_name varchar(60);
begin
  display_name := left(
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Budget Dino'
    ),
    60
  );

  insert into public.profiles (id, name) values (new.id, display_name);

  insert into public.notifications (user_id, type, title, body)
  values (
    new.id,
    'welcome',
    'Welcome to Gastosaurus, ' || display_name || '! 🦖',
    'Create a group, add your barkada, and let the dino do the math.'
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
