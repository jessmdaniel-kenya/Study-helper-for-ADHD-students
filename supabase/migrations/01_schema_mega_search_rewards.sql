-- Mega search vector index
alter table materials add column search tsvector generated always as (
setweight(to_tsvector('simple', coalesce(title,'')), 'A') ||
setweight(to_tsvector('simple', coalesce(full_text,'')), 'B')
) stored;
create index materials_search_idx on materials using gin (search);

-- Mega Search Query Example
-- select id, title,
-- ts_headline('simple', full_text, q, 'MaxFragments = 2, MaxWords = 25') as snippet,
-- ts_rank(search, q) as rank
-- from materials, websearch_to_tsquery('simple', term) q
-- where search @@ q and (visibility = 'public' or owner_id = auth.uid())
-- order by rank desc limit 20;

-- Reward draw function
create function record_completion(p_kind text, p_ref uuid)
returns jsonb language plpgsql security definer set search_path = public as
$$
declare n int; r rewards%rowtype;
begin
insert into completions (user_id, kind, ref_id) values (auth.uid(), p_kind,
p_ref);
select count(*) into n from completions where user_id = auth.uid();
if n % 4 = 0 then
select * into r from rewards order by random() limit 1;
insert into user_rewards (user_id, reward_id, qty) values (auth.uid(),
r.id, 1)
on conflict (user_id, reward_id) do update set qty = user_rewards.qty +
1;
return jsonb_build_object('count', n, 'to_next', 4, 'reward',
to_jsonb(r));
end if;
return jsonb_build_object('count', n, 'to_next', 4 - (n % 4));
end $$;