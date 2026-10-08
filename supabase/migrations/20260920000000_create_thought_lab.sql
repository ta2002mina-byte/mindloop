-- =============================================================================
-- MindLoop Lab — Phase 2: Thought Lab
-- Tables: thoughts, thought_facts, thought_stories, emotions, control_items, actions
-- Run once in: Supabase Dashboard → SQL Editor (or `supabase db push`).
-- Safe to re-run: every statement is guarded.
-- =============================================================================

-- 1. Parent table ------------------------------------------------------------
create table if not exists public.thoughts (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users (id) on delete cascade,
  title         text        not null,
  raw_text      text        not null,
  category      text        not null default 'Other',
  -- "trigger" is a non-reserved keyword in Postgres, so it is a valid column
  -- name, but we quote it everywhere for readability.
  "trigger"     text,
  traffic_light text        not null,
  status        text        not null default 'active',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint thoughts_title_length    check (char_length(btrim(title)) between 1 and 120),
  constraint thoughts_raw_text_length check (char_length(btrim(raw_text)) between 1 and 5000),
  constraint thoughts_trigger_length  check ("trigger" is null or char_length("trigger") <= 200),
  constraint thoughts_category_valid  check (
    category in ('Work', 'Study', 'Relationships', 'Social', 'Decisions', 'Future', 'Family', 'Money', 'Other')
  ),
  constraint thoughts_status_valid        check (status in ('active', 'resolved', 'archived')),
  constraint thoughts_traffic_light_valid check (traffic_light in ('green', 'yellow', 'red'))
);

comment on table public.thoughts is
  'One row per analysed thought. Owned by auth.users; child rows cascade on delete.';

-- Text CHECK constraints are used instead of Postgres enums so that adding a
-- category later is a one-line ALTER instead of an enum migration.

-- 2. Child tables ------------------------------------------------------------
create table if not exists public.thought_facts (
  id         uuid        primary key default gen_random_uuid(),
  thought_id uuid        not null references public.thoughts (id) on delete cascade,
  content    text        not null,
  created_at timestamptz not null default now(),
  constraint thought_facts_content_length check (char_length(btrim(content)) between 1 and 500)
);

create table if not exists public.thought_stories (
  id         uuid        primary key default gen_random_uuid(),
  thought_id uuid        not null references public.thoughts (id) on delete cascade,
  content    text        not null,
  created_at timestamptz not null default now(),
  constraint thought_stories_content_length check (char_length(btrim(content)) between 1 and 500)
);

create table if not exists public.emotions (
  id         uuid        primary key default gen_random_uuid(),
  thought_id uuid        not null references public.thoughts (id) on delete cascade,
  emotion    text        not null,
  intensity  smallint    not null,
  created_at timestamptz not null default now(),
  constraint emotions_emotion_length check (char_length(btrim(emotion)) between 1 and 40),
  constraint emotions_intensity_range check (intensity between 1 and 10)
);

comment on table public.emotions is
  'Self-reported feeling words. Descriptive only: not a clinical measure of anything.';

create table if not exists public.control_items (
  id           uuid        primary key default gen_random_uuid(),
  thought_id   uuid        not null references public.thoughts (id) on delete cascade,
  content      text        not null,
  control_type text        not null,
  created_at   timestamptz not null default now(),
  constraint control_items_content_length check (char_length(btrim(content)) between 1 and 300),
  constraint control_items_type_valid     check (control_type in ('control', 'influence', 'cannot_control'))
);

create table if not exists public.actions (
  id           uuid        primary key default gen_random_uuid(),
  thought_id   uuid        not null references public.thoughts (id) on delete cascade,
  -- Denormalised owner so "all my open actions" needs no join and RLS stays cheap.
  user_id      uuid        not null references auth.users (id) on delete cascade,
  title        text        not null,
  due_date     date,
  priority     text        not null default 'medium',
  completed    boolean     not null default false,
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  constraint actions_title_length   check (char_length(btrim(title)) between 1 and 200),
  constraint actions_priority_valid check (priority in ('low', 'medium', 'high')),
  -- completed and completed_at can never disagree.
  constraint actions_completed_at_consistent check (
    (completed and completed_at is not null) or (not completed and completed_at is null)
  )
);

-- 3. Indexes -----------------------------------------------------------------
-- The list page always filters by user and sorts by newest first.
create index if not exists thoughts_user_created_idx  on public.thoughts (user_id, created_at desc);
create index if not exists thoughts_user_status_idx   on public.thoughts (user_id, status);
create index if not exists thoughts_user_category_idx on public.thoughts (user_id, category);

create index if not exists thought_facts_thought_idx   on public.thought_facts (thought_id);
create index if not exists thought_stories_thought_idx on public.thought_stories (thought_id);
create index if not exists emotions_thought_idx        on public.emotions (thought_id);
create index if not exists control_items_thought_idx   on public.control_items (thought_id);
create index if not exists actions_thought_idx         on public.actions (thought_id);
create index if not exists actions_user_open_idx       on public.actions (user_id, completed, due_date);

-- 4. updated_at trigger (public.set_updated_at() ships with Phase 1) ---------
drop trigger if exists thoughts_set_updated_at on public.thoughts;
create trigger thoughts_set_updated_at
  before update on public.thoughts
  for each row execute function public.set_updated_at();

-- 5. Ownership helper --------------------------------------------------------
-- Child tables have no user_id, so their policies ask this one question.
-- SECURITY DEFINER avoids needing a SELECT policy on thoughts to evaluate a
-- policy on a child table; the body can only ever compare against auth.uid().
create or replace function public.owns_thought(p_thought_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.thoughts t
    where t.id = p_thought_id
      and t.user_id = (select auth.uid())
  );
$$;

revoke execute on function public.owns_thought(uuid) from public, anon;
grant execute on function public.owns_thought(uuid) to authenticated;

-- 6. Row Level Security ------------------------------------------------------
alter table public.thoughts        enable row level security;
alter table public.thought_facts   enable row level security;
alter table public.thought_stories enable row level security;
alter table public.emotions        enable row level security;
alter table public.control_items   enable row level security;
alter table public.actions         enable row level security;

revoke all on public.thoughts,
              public.thought_facts,
              public.thought_stories,
              public.emotions,
              public.control_items,
              public.actions
  from anon;

grant select, insert, update, delete on
  public.thoughts,
  public.thought_facts,
  public.thought_stories,
  public.emotions,
  public.control_items,
  public.actions
  to authenticated;

-- thoughts: the user owns the row directly.
drop policy if exists "Users can read their own thoughts" on public.thoughts;
create policy "Users can read their own thoughts"
  on public.thoughts for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own thoughts" on public.thoughts;
create policy "Users can create their own thoughts"
  on public.thoughts for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own thoughts" on public.thoughts;
create policy "Users can update their own thoughts"
  on public.thoughts for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own thoughts" on public.thoughts;
create policy "Users can delete their own thoughts"
  on public.thoughts for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Child tables: ownership is inherited from the parent thought.
-- WITH CHECK on update stops a row being moved to somebody else's thought.
do $$
declare
  child text;
begin
  foreach child in array array['thought_facts', 'thought_stories', 'emotions', 'control_items']
  loop
    execute format('drop policy if exists "Users can read own %1$s" on public.%1$s', child);
    execute format(
      'create policy "Users can read own %1$s" on public.%1$s for select to authenticated
         using (public.owns_thought(thought_id))', child);

    execute format('drop policy if exists "Users can create own %1$s" on public.%1$s', child);
    execute format(
      'create policy "Users can create own %1$s" on public.%1$s for insert to authenticated
         with check (public.owns_thought(thought_id))', child);

    execute format('drop policy if exists "Users can update own %1$s" on public.%1$s', child);
    execute format(
      'create policy "Users can update own %1$s" on public.%1$s for update to authenticated
         using (public.owns_thought(thought_id))
         with check (public.owns_thought(thought_id))', child);

    execute format('drop policy if exists "Users can delete own %1$s" on public.%1$s', child);
    execute format(
      'create policy "Users can delete own %1$s" on public.%1$s for delete to authenticated
         using (public.owns_thought(thought_id))', child);
  end loop;
end;
$$;

-- actions: both checks, so a stray user_id can never point at another account.
drop policy if exists "Users can read their own actions" on public.actions;
create policy "Users can read their own actions"
  on public.actions for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own actions" on public.actions;
create policy "Users can create their own actions"
  on public.actions for insert to authenticated
  with check ((select auth.uid()) = user_id and public.owns_thought(thought_id));

drop policy if exists "Users can update their own actions" on public.actions;
create policy "Users can update their own actions"
  on public.actions for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and public.owns_thought(thought_id));

drop policy if exists "Users can delete their own actions" on public.actions;
create policy "Users can delete their own actions"
  on public.actions for delete to authenticated
  using ((select auth.uid()) = user_id);
