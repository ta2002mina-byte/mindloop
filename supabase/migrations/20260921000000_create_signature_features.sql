-- =============================================================================
-- MindLoop Lab — Phase 3: signature features
-- Tables: predictions, worry_capsules
-- Run AFTER 20260920000000_create_thought_lab.sql (needs public.thoughts and
-- public.owns_thought()). Safe to re-run: every statement is guarded.
-- =============================================================================

-- 1. predictions -------------------------------------------------------------
create table if not exists public.predictions (
  id              uuid        primary key default gen_random_uuid(),
  thought_id      uuid        not null references public.thoughts (id) on delete cascade,
  -- Denormalised owner so "all my predictions" needs no join and RLS stays cheap.
  user_id         uuid        not null references auth.users (id) on delete cascade,
  prediction_text text        not null,
  confidence      smallint    not null,
  expected_date   date        not null,
  -- outcome        = the user's own words about what actually happened
  -- outcome_rating = which of the four fixed answers they picked
  outcome         text,
  outcome_rating  text,
  reviewed_at     timestamptz,
  created_at      timestamptz not null default now(),

  constraint predictions_text_length check (char_length(btrim(prediction_text)) between 5 and 500),
  constraint predictions_confidence_range check (confidence between 0 and 100),
  constraint predictions_outcome_length check (outcome is null or char_length(outcome) <= 500),
  constraint predictions_rating_valid check (
    outcome_rating is null
    or outcome_rating in (
      'better_than_expected',
      'about_what_i_expected',
      'worse_than_expected',
      'completely_different'
    )
  ),
  -- A prediction is either still open, or fully reviewed. Never half of each.
  constraint predictions_review_consistent check (
    (reviewed_at is null and outcome_rating is null and outcome is null)
    or (reviewed_at is not null and outcome_rating is not null)
  )
);

comment on table public.predictions is
  'A forecast the user wrote down, later compared with what actually happened. Descriptive only: not a clinical measure.';

create index if not exists predictions_user_review_idx on public.predictions (user_id, reviewed_at, expected_date);
create index if not exists predictions_thought_idx     on public.predictions (thought_id);

-- 2. worry_capsules ----------------------------------------------------------
create table if not exists public.worry_capsules (
  id                uuid        primary key default gen_random_uuid(),
  user_id           uuid        not null references auth.users (id) on delete cascade,
  thought_id        uuid        not null references public.thoughts (id) on delete cascade,
  worry_intensity   smallint    not null,
  reopen_date       date        not null,
  reopened_at       timestamptz,
  current_intensity smallint,
  outcome           text,       -- "What happened?"
  what_changed      text,       -- "What changed?"
  created_at        timestamptz not null default now(),

  constraint worry_capsules_worry_range   check (worry_intensity between 1 and 10),
  constraint worry_capsules_current_range check (current_intensity is null or current_intensity between 1 and 10),
  constraint worry_capsules_outcome_length check (outcome is null or char_length(outcome) <= 1000),
  constraint worry_capsules_changed_length check (what_changed is null or char_length(what_changed) <= 1000),
  -- The lock has to be in the future when the capsule is sealed (UTC days).
  constraint worry_capsules_reopen_after_create check (reopen_date > (created_at at time zone 'utc')::date),
  -- Open capsules have no "now" answers; reopened capsules always have an intensity.
  constraint worry_capsules_reopen_consistent check (
    (reopened_at is null and current_intensity is null and outcome is null and what_changed is null)
    or (reopened_at is not null and current_intensity is not null)
  )
);

comment on table public.worry_capsules is
  'A worry sealed until reopen_date, then compared then-vs-now. The lock is enforced by the trigger below, not only by the UI.';

create index if not exists worry_capsules_user_idx    on public.worry_capsules (user_id, reopened_at, reopen_date);
create index if not exists worry_capsules_thought_idx on public.worry_capsules (thought_id);

-- 3. The lock itself ---------------------------------------------------------
-- RLS decides WHO can change a capsule; this trigger decides WHAT can change.
-- Without it, anyone holding their own session could call the API directly and
-- reopen a capsule early, or move its date, and the "lock" would be decoration.
create or replace function public.enforce_worry_capsule_lock()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.reopened_at is not null then
    raise exception 'A reopened capsule can no longer be changed.' using errcode = 'check_violation';
  end if;

  if new.user_id           is distinct from old.user_id
     or new.thought_id        is distinct from old.thought_id
     or new.worry_intensity   is distinct from old.worry_intensity
     or new.created_at        is distinct from old.created_at then
    raise exception 'The sealed part of a capsule cannot be changed.' using errcode = 'check_violation';
  end if;

  if new.reopen_date < old.reopen_date then
    raise exception 'A capsule cannot be moved to an earlier date.' using errcode = 'check_violation';
  end if;

  if new.reopened_at is not null and new.reopen_date > (now() at time zone 'utc')::date then
    raise exception 'This capsule is locked until %.', new.reopen_date using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists worry_capsules_enforce_lock on public.worry_capsules;
create trigger worry_capsules_enforce_lock
  before update on public.worry_capsules
  for each row execute function public.enforce_worry_capsule_lock();

-- 4. Row Level Security ------------------------------------------------------
alter table public.predictions    enable row level security;
alter table public.worry_capsules enable row level security;

revoke all on public.predictions, public.worry_capsules from anon;
grant select, insert, update, delete on public.predictions, public.worry_capsules to authenticated;

-- Both tables follow the same rule as public.actions: you own the row, and any
-- thought you attach it to must also be yours.
do $$
declare
  tbl text;
begin
  foreach tbl in array array['predictions', 'worry_capsules']
  loop
    execute format('drop policy if exists "Users can read their own %1$s" on public.%1$s', tbl);
    execute format(
      'create policy "Users can read their own %1$s" on public.%1$s for select to authenticated
         using ((select auth.uid()) = user_id)', tbl);

    execute format('drop policy if exists "Users can create their own %1$s" on public.%1$s', tbl);
    execute format(
      'create policy "Users can create their own %1$s" on public.%1$s for insert to authenticated
         with check ((select auth.uid()) = user_id and public.owns_thought(thought_id))', tbl);

    execute format('drop policy if exists "Users can update their own %1$s" on public.%1$s', tbl);
    execute format(
      'create policy "Users can update their own %1$s" on public.%1$s for update to authenticated
         using ((select auth.uid()) = user_id)
         with check ((select auth.uid()) = user_id and public.owns_thought(thought_id))', tbl);

    execute format('drop policy if exists "Users can delete their own %1$s" on public.%1$s', tbl);
    execute format(
      'create policy "Users can delete their own %1$s" on public.%1$s for delete to authenticated
         using ((select auth.uid()) = user_id)', tbl);
  end loop;
end;
$$;
