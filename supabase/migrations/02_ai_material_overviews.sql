alter table public.materials
  add column if not exists overview jsonb;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'study-materials',
  'study-materials',
  false,
  26214400,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
    'image/png',
    'image/jpeg',
    'image/webp',
    'application/octet-stream'
  ]
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists own_study_material_files on storage.objects;
create policy own_study_material_files on storage.objects for all to authenticated
  using (
    bucket_id = 'study-materials' and
    (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'study-materials' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

create table if not exists public.ai_usage_daily (
  user_id uuid not null references auth.users on delete cascade,
  usage_date date not null default (timezone('utc', now())::date),
  kind text not null check (kind in ('questions', 'grades', 'summaries')),
  units integer not null default 0 check (units >= 0),
  primary key (user_id, usage_date, kind)
);

alter table public.ai_usage_daily enable row level security;
revoke all on public.ai_usage_daily from anon, authenticated;

create or replace function public.consume_ai_usage(p_kind text, p_units integer)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  daily_limit integer;
  resulting_units integer;
begin
  if current_user_id is null or p_units is null or p_units < 1 or p_units > 100 then
    return false;
  end if;

  if p_kind = 'questions' then
    daily_limit := 150;
  elsif p_kind = 'grades' then
    daily_limit := 200;
  elsif p_kind = 'summaries' then
    daily_limit := 10;
  else
    return false;
  end if;

  insert into public.ai_usage_daily (user_id, usage_date, kind, units)
  values (current_user_id, timezone('utc', now())::date, p_kind, p_units)
  on conflict (user_id, usage_date, kind) do update
    set units = public.ai_usage_daily.units + excluded.units
    where public.ai_usage_daily.units + excluded.units <= daily_limit
  returning units into resulting_units;

  return found;
end;
$$;

revoke all on function public.consume_ai_usage(text, integer) from public, anon;
grant execute on function public.consume_ai_usage(text, integer) to authenticated;
