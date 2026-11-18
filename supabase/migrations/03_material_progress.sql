-- Persist Study Desk completion state and session history.
alter table public.materials
  add column if not exists marked boolean not null default false,
  add column if not exists progress jsonb not null default '[]'::jsonb;
