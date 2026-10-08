-- =============================================================================
-- MindLoop Lab — Phase 1: profiles table, Row Level Security, signup trigger
-- Run this once in: Supabase Dashboard → SQL Editor (or `supabase db push`).
-- =============================================================================

-- 1. Table -------------------------------------------------------------------
create table if not exists public.profiles (
  id                   uuid        primary key default gen_random_uuid(),
  -- One profile per auth user. UNIQUE also creates the index used by every
  -- "WHERE user_id = ..." lookup and by the RLS policies below.
  user_id              uuid        not null unique references auth.users (id) on delete cascade,
  full_name            text,
  avatar_url           text,
  onboarding_completed boolean     not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint profiles_full_name_length check (full_name is null or char_length(full_name) <= 100)
);

comment on table public.profiles is 'One row per user. Owned by auth.users; deleted automatically with the user.';

-- 2. Keep updated_at fresh ---------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- 3. Row Level Security ------------------------------------------------------
alter table public.profiles enable row level security;

-- Table privileges (RLS still decides which rows). No DELETE: profiles are removed
-- only when the auth user is deleted. Anonymous visitors get nothing.
revoke all on public.profiles from anon;
grant select, insert, update on public.profiles to authenticated;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own profile" on public.profiles;
create policy "Users can create their own profile"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- WITH CHECK stops a user from re-assigning their row to someone else.
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- 4. Create a profile automatically at signup --------------------------------
-- SECURITY DEFINER lets the trigger insert even though the new user has no
-- session yet (e.g. while email confirmation is pending).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, full_name, avatar_url)
  values (
    new.id,
    nullif(left(trim(new.raw_user_meta_data ->> 'full_name'), 100), ''),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

-- The function is only meant to be fired by the trigger, never called via the API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5. Backfill: profiles for users who signed up before this migration ---------
insert into public.profiles (user_id, full_name)
select u.id, nullif(left(trim(u.raw_user_meta_data ->> 'full_name'), 100), '')
from auth.users u
on conflict (user_id) do nothing;
