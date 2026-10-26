-- FlowState bare-bones schema. Run once in the Supabase SQL editor.
-- Turn on Authentication > Anonymous sign-ins first.

create table materials (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  title text not null,
  full_text text not null,
  created_at timestamptz not null default now(),
  search tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(full_text, '')), 'B')
  ) stored
);
create index materials_search_idx on materials using gin (search);

create table questions (  -- created now, used once questions are saved
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references materials on delete cascade,
  type text not null,
  prompt text not null,
  options jsonb,
  answer text not null,
  explanation text not null,
  source_quote text not null
);

create table completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  kind text not null,
  ref_id uuid not null,
  created_at timestamptz not null default now(),
  unique (user_id, kind, ref_id)  -- each item counts once
);

create table rewards (id serial primary key, name text not null, emoji text not null);

create table user_rewards (
  user_id uuid not null references auth.users on delete cascade,
  reward_id int not null references rewards,
  qty int not null default 1,
  primary key (user_id, reward_id)
);

-- Row-level security: people only see their own rows.
alter table materials enable row level security;
create policy own_materials on materials for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

alter table questions enable row level security;
create policy own_questions on questions for all
  using (exists (select 1 from materials m where m.id = material_id and m.owner_id = auth.uid()));

alter table completions enable row level security;
create policy own_completions on completions for select using (user_id = auth.uid());

alter table rewards enable row level security;
create policy read_rewards on rewards for select using (true);

alter table user_rewards enable row level security;
create policy own_rewards on user_rewards for select using (user_id = auth.uid());

-- Search any word inside your own notes.
create function search_materials(term text)
returns table (id uuid, title text, snippet text)
language sql stable as $$
  select m.id, m.title,
         ts_headline('simple', m.full_text, q, 'MaxFragments=2, MaxWords=25')
  from materials m, websearch_to_tsquery('simple', term) q
  where m.search @@ q and m.owner_id = auth.uid()
  order by ts_rank(m.search, q) desc
  limit 20
$$;

-- Count a completion; every 4th one draws a random reward. Runs in the database so it cannot be faked.
create function record_completion(p_kind text, p_ref uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare n int; r rewards%rowtype; inserted boolean;
begin
  insert into completions (user_id, kind, ref_id) values (auth.uid(), p_kind, p_ref)
    on conflict do nothing;
  inserted := found;
  select count(*) into n from completions where user_id = auth.uid();
  if inserted and n % 4 = 0 then
    select * into r from rewards order by random() limit 1;
    insert into user_rewards (user_id, reward_id, qty) values (auth.uid(), r.id, 1)
      on conflict (user_id, reward_id) do update set qty = user_rewards.qty + 1;
    return jsonb_build_object('count', n, 'to_next', 4, 'reward', to_jsonb(r));
  end if;
  return jsonb_build_object('count', n, 'to_next', 4 - (n % 4));
end $$;

-- Placeholder rewards. Swap in the team's own list.
insert into rewards (name, emoji) values
  ('Brass cog', '⚙️'), ('Pocket watch', '⌚'), ('Neon tube', '💡'), ('Tiny rocket', '🚀'),
  ('Little train', '🚂'), ('Paper map', '🗺️'), ('Telescope', '🔭'), ('Circuit chip', '🔌'),
  ('Star', '⭐'), ('Compass', '🧭');