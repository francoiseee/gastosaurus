-- Phase 1 — Accounts
-- Supabase Auth owns the login data (auth.users: email, password hash, Google
-- identity, sessions). Our app keeps its own per-user data in public.profiles,
-- one row per auth user, created automatically on sign-up.

create table public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  name           varchar(60)  not null,
  avatar_emoji   varchar(16)  not null default '🦖',
  monthly_budget numeric(12,2) check (monthly_budget >= 0),
  created_at     timestamptz  not null default now(),
  updated_at     timestamptz  not null default now()
);

comment on table public.profiles is 'Gastosaurus user profile (1:1 with auth.users).';

-- Row Level Security: even if someone calls the Supabase REST API directly with
-- the public key, they can only read/update their own profile.
alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Keep updated_at fresh on every UPDATE.
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- When Supabase Auth creates a user (email sign-up or Google), create their
-- profile. Name comes from signUp({ options: { data: { name } } }), or Google's
-- full_name, or the part of the email before the @.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    left(
      coalesce(
        nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
        nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
        nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
        'Budget Dino'
      ),
      60
    )
  );
  return new;
end;
$$;

-- Only the trigger should run this, never API callers.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
