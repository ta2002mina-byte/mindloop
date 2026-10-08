-- Phase 5: adds a simple notification preference used by the Settings > Preferences section.
-- No other product behavior depends on this column yet; it only records the user's choice.

alter table public.profiles
  add column if not exists notifications_enabled boolean not null default true;
