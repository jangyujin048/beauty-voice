-- Apply after existing member / insight migrations. No historical notifications are sent.
begin;
create table if not exists public.bv_push_subscriptions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 endpoint text not null unique,
 p256dh text not null, auth text not null,
 notices boolean not null default true, replies boolean not null default true,
 missions boolean not null default true, insights boolean not null default true,
 created_at timestamptz not null default now()
);
create table if not exists public.bv_push_deliveries (
 id bigint generated always as identity primary key,
 subscription_id uuid not null references public.bv_push_subscriptions(id) on delete cascade,
 kind text not null check(kind in ('notice','reply','mission','insight')),
 source_id text not null,
 state text not null default 'pending' check(state in ('pending','sending','sent','failed','cancelled')),
 attempts integer not null default 0,
 due_at timestamptz not null default now(), created_at timestamptz not null default now(),
 lease_until timestamptz, lease_token uuid, finished_at timestamptz,
 unique(subscription_id,kind,source_id)
);
create index if not exists bv_push_pending on public.bv_push_deliveries(state,due_at);
alter table public.bv_push_subscriptions enable row level security;
alter table public.bv_push_deliveries enable row level security;
revoke all on public.bv_push_subscriptions,public.bv_push_deliveries from public,anon,authenticated;
-- Browser operations use narrow RPCs; never return other users' device endpoints.
create or replace function public.bv_push_subscribe(p_endpoint text,p_p256dh text,p_auth text,
 p_notices boolean default true,p_replies boolean default true,p_missions boolean default true,p_insights boolean default true)
returns uuid language plpgsql security definer set search_path='' as $$
declare result uuid;
begin
 if not public.beauty_voice_can_use_site() then raise exception 'Active membership required' using errcode='42501'; end if;
 if length(p_endpoint)>2048 or p_endpoint !~ '^https://(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|[a-zA-Z0-9-]+\.push\.apple\.com)/[^[:space:]#]+$'
 or p_p256dh !~ '^[A-Za-z0-9_-]{87}$' or p_auth !~ '^[A-Za-z0-9_-]{22}$'
 or p_endpoint is null or p_p256dh is null or p_auth is null then
  raise exception 'Invalid push subscription' using errcode='22023'; end if;
 -- Endpoint cannot be reassigned to another account. Unsubscribe on account change first.
 insert into public.bv_push_subscriptions(user_id,endpoint,p256dh,auth,notices,replies,missions,insights)
 values(auth.uid(),p_endpoint,p_p256dh,p_auth,p_notices,p_replies,p_missions,p_insights)
 on conflict(endpoint) do update set p256dh=excluded.p256dh,auth=excluded.auth,
 notices=excluded.notices,replies=excluded.replies,missions=excluded.missions,insights=excluded.insights
 where public.bv_push_subscriptions.user_id=auth.uid() returning id into result;
 if result is null then raise exception 'Subscription must be renewed' using errcode='42501'; end if;
 return result;
end $$;
create or replace function public.bv_push_status(p_endpoint text)
returns table(notices boolean,replies boolean,missions boolean,insights boolean)
language sql stable security definer set search_path='' as $$
 select s.notices,s.replies,s.missions,s.insights from public.bv_push_subscriptions s
 where s.endpoint=p_endpoint and s.user_id=auth.uid() and public.beauty_voice_can_use_site();
$$;
create or replace function public.bv_push_unsubscribe(p_endpoint text)
returns void language sql security definer set search_path='' as $$
 delete from public.bv_push_subscriptions where endpoint=p_endpoint and user_id=auth.uid();
$$;
-- Private recipient check is repeated when sending: membership, preference, current source and store.
create or replace function public.bv_push_allowed(sid uuid,k text,source text)
returns boolean language plpgsql stable security definer set search_path='' as $$
declare s public.bv_push_subscriptions; store text; admin boolean; uid uuid;
begin
 select * into s from public.bv_push_subscriptions where id=sid;
 if not found then return false; end if;
 select m.store_id,u.id,exists(select 1 from public.admin_users a where lower(btrim(a.email))=m.email)
 into store,uid,admin from auth.users u join public.beauty_voice_members m on m.email=lower(btrim(u.email))
 where u.id=s.user_id and u.email_confirmed_at is not null and m.is_active;
 if not found then return false; end if;
 case k
 when 'notice' then return s.notices and exists(select 1 from public.notices n where n.id::text=source);
 when 'reply' then return s.replies and exists(select 1 from public.beauty_voice_comments c
  join public.beauty_voice_posts p on p.id=c.post_id where c.id::text=source and c.is_admin=true
  and p.user_id=uid and c.user_id is distinct from uid);
 when 'mission' then return s.missions and exists(select 1 from public.weekly_challenges c where c.id::text=source
  and c.status='active' and c.end_date >= (now() at time zone 'Asia/Seoul')::date
  and (admin or cardinality(c.target_store_ids)=0 or store=any(c.target_store_ids)));
 when 'insight' then return s.insights and exists(select 1 from public.bc_insights i where i.id::text=source
  and (admin or i.store_id is null or i.store_id=store));
 else return false;
 end case;
end $$;
create or replace function public.bv_push_enqueue()
returns trigger language plpgsql security definer set search_path='' as $$
declare k text; due timestamptz:=now();
begin
 case tg_table_name
 when 'notices' then k:='notice';
 when 'bc_insights' then k:='insight';
 when 'beauty_voice_comments' then
  if new.is_admin is distinct from true then return new; end if;
  k:='reply';
 when 'weekly_challenges' then
  k:='mission'; due:=greatest(now(),new.start_date::timestamp at time zone 'Asia/Seoul');
 else return new;
 end case;
 insert into public.bv_push_deliveries(subscription_id,kind,source_id,due_at)
 select s.id,k,new.id::text,due from public.bv_push_subscriptions s
 where public.bv_push_allowed(s.id,k,new.id::text) on conflict do nothing;
 return new;
end $$;
do $$ declare t text; begin
 foreach t in array array['notices','bc_insights','beauty_voice_comments','weekly_challenges'] loop
  execute format('drop trigger if exists bv_push_enqueue on public.%I',t);
  execute format('create trigger bv_push_enqueue after insert on public.%I for each row execute function public.bv_push_enqueue()',t);
 end loop;
end $$;
-- Bounded batch, lease-based retry. No HTTP requests from content-writing transactions.
create or replace function public.bv_push_claim()
returns table(id bigint,lease_token uuid) language plpgsql security definer set search_path='' as $$
begin
 update public.bv_push_deliveries d set due_at=greatest(d.created_at,c.start_date::timestamp at time zone 'Asia/Seoul')
 from public.weekly_challenges c where d.kind='mission' and d.source_id=c.id::text
 and d.state='pending' and d.attempts=0;
 update public.bv_push_deliveries d set state='cancelled',finished_at=now()
 where d.state in ('pending','sending') and (d.due_at < now()-interval '7 days' or d.attempts>=4)
 and (d.lease_until is null or d.lease_until<now());
 return query with candidates as (
 select d.id from public.bv_push_deliveries d where d.due_at<=now() and d.attempts<4
 and (d.state='pending' or (d.state='sending' and d.lease_until<now()))
 order by d.due_at,d.id limit 20 for update skip locked
 ) update public.bv_push_deliveries d set state='sending',attempts=d.attempts+1,
 lease_token=gen_random_uuid(),lease_until=now()+interval '2 minutes'
 from candidates c where c.id=d.id returning d.id,d.lease_token;
end $$;
create or replace function public.bv_push_payload(p_id bigint,p_token uuid)
returns table(endpoint text,p256dh text,auth text,kind text)
language sql stable security definer set search_path='' as $$
 select s.endpoint,s.p256dh,s.auth,d.kind from public.bv_push_deliveries d
 join public.bv_push_subscriptions s on s.id=d.subscription_id
 where d.id=p_id and d.lease_token=p_token and d.state='sending' and d.lease_until>now()
 and public.bv_push_allowed(s.id,d.kind,d.source_id)
 and (d.kind<>'mission' or exists(select 1 from public.weekly_challenges c
 where c.id::text=d.source_id and c.start_date <= (now() at time zone 'Asia/Seoul')::date));
$$;
create or replace function public.bv_push_finish(p_id bigint,p_token uuid,p_result text)
returns void language plpgsql security definer set search_path='' as $$
begin
 if p_result='gone' then
  delete from public.bv_push_subscriptions s using public.bv_push_deliveries d
  where d.id=p_id and d.lease_token=p_token and d.state='sending' and s.id=d.subscription_id;
 else
  update public.bv_push_deliveries d set
   state=case when p_result='sent' then 'sent' when p_result='retry' and d.attempts<4 then 'pending'
     when p_result='cancelled' then 'cancelled' else 'failed' end,
   due_at=case when p_result='retry' then now()+interval '1 minute'*power(2,d.attempts) else d.due_at end,
   finished_at=case when p_result='retry' and d.attempts<4 then null else now() end,
   lease_until=null,lease_token=null
  where d.id=p_id and d.lease_token=p_token and d.state='sending';
 end if;
end $$;
-- Remove terminal metadata after 30 days; no content, names or email ever stored in outbox.
create or replace function public.bv_push_cleanup() returns void
language sql security definer set search_path='' as $$
 delete from public.bv_push_deliveries where finished_at<now()-interval '30 days';
$$;
revoke all on function public.bv_push_subscribe(text,text,text,boolean,boolean,boolean,boolean),public.bv_push_status(text),public.bv_push_unsubscribe(text),public.bv_push_allowed(uuid,text,text),public.bv_push_enqueue(),public.bv_push_claim(),public.bv_push_payload(bigint,uuid),public.bv_push_finish(bigint,uuid,text),public.bv_push_cleanup() from public,anon,authenticated;
grant execute on function public.bv_push_subscribe(text,text,text,boolean,boolean,boolean,boolean),public.bv_push_status(text),public.bv_push_unsubscribe(text) to authenticated;
grant execute on function public.bv_push_claim(),public.bv_push_payload(bigint,uuid),public.bv_push_finish(bigint,uuid,text),public.bv_push_cleanup() to service_role;
notify pgrst,'reload schema';
commit;
