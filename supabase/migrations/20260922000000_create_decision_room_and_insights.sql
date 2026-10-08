-- =============================================================================
-- MindLoop Lab — Phase 4: Decision Room + Insights reflections
-- Tables: decision_rooms, decision_options, reflections
-- Run AFTER 20260921000000_create_signature_features.sql (needs
-- public.set_updated_at() from Phase 1). Safe to re-run: every statement is guarded.
-- =============================================================================

-- 1. decision_rooms ----------------------------------------------------------
create table if not exists public.decision_rooms (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users (id) on delete cascade,
  title       text        not null,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint decision_rooms_title_length       check (char_length(btrim(title)) between 3 and 160),
  constraint decision_rooms_description_length check (description is null or char_length(description) <= 1000)
);

comment on table public.decision_rooms is
  'One decision the user is weighing up. The app organises the options and never picks one.';

create index if not exists decision_rooms_user_idx on public.decision_rooms (user_id, updated_at desc);

-- 2. decision_options --------------------------------------------------------
-- The six sections are text[] rather than child tables: they are short unordered
-- lists that are always read and written together with their option.
create table if not exists public.decision_options (
  id                 uuid        primary key default gen_random_uuid(),
  decision_room_id   uuid        not null references public.decision_rooms (id) on delete cascade,
  name               text        not null,
  benefits           text[]      not null default '{}',
  concerns           text[]      not null default '{}',
  known_facts        text[]      not null default '{}',
  unknowns           text[]      not null default '{}',
  controllable_items text[]      not null default '{}',
  first_step         text,
  -- Keeps the columns in the order the user arranged them.
  position           smallint    not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  constraint decision_options_name_length  check (char_length(btrim(name)) between 1 and 80),
  constraint decision_options_first_step_length check (first_step is null or char_length(first_step) <= 300),
  -- Caps the lists in the database too, so the limit does not live only in the UI.
  constraint decision_options_benefits_size    check (array_length(benefits, 1) is null or array_length(benefits, 1) <= 12),
  constraint decision_options_concerns_size    check (array_length(concerns, 1) is null or array_length(concerns, 1) <= 12),
  constraint decision_options_facts_size       check (array_length(known_facts, 1) is null or array_length(known_facts, 1) <= 12),
  constraint decision_options_unknowns_size    check (array_length(unknowns, 1) is null or array_length(unknowns, 1) <= 12),
  constraint decision_options_control_size     check (array_length(controllable_items, 1) is null or array_length(controllable_items, 1) <= 12)
);

create index if not exists decision_options_room_idx on public.decision_options (decision_room_id, position);

-- 3. reflections -------------------------------------------------------------
-- "What did you learn about your thinking this week?" One row per user per week.
create table if not exists public.reflections (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users (id) on delete cascade,
  -- The Monday (UTC) of the week the reflection belongs to.
  week_start date        not null,
  content    text        not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint reflections_content_length check (char_length(btrim(content)) between 1 and 2000),
  constraint reflections_unique_week unique (user_id, week_start)
);

comment on table public.reflections is
  'The user''s own words about their week. Never generated for them.';

create index if not exists reflections_user_week_idx on public.reflections (user_id, week_start desc);

-- 4. updated_at triggers -----------------------------------------------------
do $$
declare
  tbl text;
begin
  foreach tbl in array array['decision_rooms', 'decision_options', 'reflections']
  loop
    execute format('drop trigger if exists %1$s_set_updated_at on public.%1$s', tbl);
    execute format(
      'create trigger %1$s_set_updated_at before update on public.%1$s
         for each row execute function public.set_updated_at()', tbl);
  end loop;
end;
$$;

-- 5. Ownership helper for decision_options -----------------------------------
-- decision_options has no user_id, so its policies ask this one question.
-- SECURITY DEFINER for the same reason as public.owns_thought(): the body can
-- only ever compare against auth.uid().
create or replace function public.owns_decision_room(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.decision_rooms r
    where r.id = p_room_id
      and r.user_id = (select auth.uid())
  );
$$;

revoke execute on function public.owns_decision_room(uuid) from public, anon;
grant execute on function public.owns_decision_room(uuid) to authenticated;

-- 6. Row Level Security ------------------------------------------------------
alter table public.decision_rooms   enable row level security;
alter table public.decision_options enable row level security;
alter table public.reflections      enable row level security;

revoke all on public.decision_rooms, public.decision_options, public.reflections from anon;
grant select, insert, update, delete on
  public.decision_rooms, public.decision_options, public.reflections to authenticated;

-- Tables the user owns directly.
do $$
declare
  tbl text;
begin
  foreach tbl in array array['decision_rooms', 'reflections']
  loop
    execute format('drop policy if exists "Users can read their own %1$s" on public.%1$s', tbl);
    execute format(
      'create policy "Users can read their own %1$s" on public.%1$s for select to authenticated
         using ((select auth.uid()) = user_id)', tbl);

    execute format('drop policy if exists "Users can create their own %1$s" on public.%1$s', tbl);
    execute format(
      'create policy "Users can create their own %1$s" on public.%1$s for insert to authenticated
         with check ((select auth.uid()) = user_id)', tbl);

    execute format('drop policy if exists "Users can update their own %1$s" on public.%1$s', tbl);
    execute format(
      'create policy "Users can update their own %1$s" on public.%1$s for update to authenticated
         using ((select auth.uid()) = user_id)
         with check ((select auth.uid()) = user_id)', tbl);

    execute format('drop policy if exists "Users can delete their own %1$s" on public.%1$s', tbl);
    execute format(
      'create policy "Users can delete their own %1$s" on public.%1$s for delete to authenticated
         using ((select auth.uid()) = user_id)', tbl);
  end loop;
end;
$$;

-- decision_options inherits ownership from its room.
drop policy if exists "Users can read own decision_options" on public.decision_options;
create policy "Users can read own decision_options"
  on public.decision_options for select to authenticated
  using (public.owns_decision_room(decision_room_id));

drop policy if exists "Users can create own decision_options" on public.decision_options;
create policy "Users can create own decision_options"
  on public.decision_options for insert to authenticated
  with check (public.owns_decision_room(decision_room_id));

drop policy if exists "Users can update own decision_options" on public.decision_options;
create policy "Users can update own decision_options"
  on public.decision_options for update to authenticated
  using (public.owns_decision_room(decision_room_id))
  with check (public.owns_decision_room(decision_room_id));

drop policy if exists "Users can delete own decision_options" on public.decision_options;
create policy "Users can delete own decision_options"
  on public.decision_options for delete to authenticated
  using (public.owns_decision_room(decision_room_id));
