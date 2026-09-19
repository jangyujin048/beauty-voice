-- 선행 조건: 20260919_official_replies.sql 적용 완료.
-- 기존 미션/참여 기록을 삭제하지 않으며 기존 미션은 전체 매장 대상입니다.
-- 적용 직후 일반 계정은 '구성원 관리'에 등록되어야 미션을 조회/참여할 수 있습니다.
begin;

create table if not exists public.beauty_voice_stores (
  id text primary key,
  name text not null unique,
  sort_order integer not null default 0
);
insert into public.beauty_voice_stores(id,name,sort_order) values
  ('seongsu','올리브영N 성수',1),
  ('beauty_mansion','올리브영 뷰티 맨션 성수',2),
  ('gangnam','올리브영 센트럴 강남 타운',3)
on conflict(id) do nothing;
alter table public.beauty_voice_stores enable row level security;
revoke all on public.beauty_voice_stores from public, anon, authenticated;
grant select on public.beauty_voice_stores to authenticated;
drop policy if exists beauty_voice_stores_read on public.beauty_voice_stores;
create policy beauty_voice_stores_read on public.beauty_voice_stores for select to authenticated using (true);

create table if not exists public.beauty_voice_members (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (
    email = lower(btrim(email)) and length(email) <= 320
    and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  store_id text not null references public.beauty_voice_stores(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid
);
alter table public.beauty_voice_members enable row level security;
revoke all on public.beauty_voice_members from public, anon, authenticated;
grant select, insert, update on public.beauty_voice_members to authenticated;
drop policy if exists beauty_voice_members_admin on public.beauty_voice_members;
create policy beauty_voice_members_admin on public.beauty_voice_members
 for all to authenticated
 using ((select public.beauty_voice_can_reply_official()))
 with check ((select public.beauty_voice_can_reply_official()));
drop policy if exists beauty_voice_members_guard on public.beauty_voice_members;
create policy beauty_voice_members_guard on public.beauty_voice_members
 as restrictive for all to public
 using ((select public.beauty_voice_can_reply_official()))
 with check ((select public.beauty_voice_can_reply_official()));

create or replace function public.beauty_voice_guard_member()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not public.beauty_voice_can_reply_official() then
    raise exception 'Only registered administrators can manage members' using errcode='42501';
  end if;
  new.email := lower(btrim(new.email));
  if tg_op = 'UPDATE' then
    if new.id is distinct from old.id or new.email is distinct from old.email then
      raise exception 'Member identity cannot be changed; pause the old membership and register the new email' using errcode='42501';
    end if;
    new.created_by := old.created_by;
    new.created_at := old.created_at;
  else
    new.created_by := auth.uid();
    new.created_at := clock_timestamp();
  end if;
  new.updated_by := auth.uid();
  new.updated_at := clock_timestamp();
  return new;
end;
$$;
revoke all on function public.beauty_voice_guard_member() from public,anon,authenticated;
drop trigger if exists beauty_voice_guard_member on public.beauty_voice_members;
create trigger beauty_voice_guard_member before insert or update on public.beauty_voice_members
for each row execute function public.beauty_voice_guard_member();

-- 본인의 검증된 현재 이메일로 조회하며 이메일 목록은 반환하지 않습니다.
create or replace function public.beauty_voice_my_membership()
returns table(store_id text, store_name text, is_active boolean)
language sql stable security definer set search_path = '' as $$
  select m.store_id, s.name, m.is_active
  from public.beauty_voice_members m
  join public.beauty_voice_stores s on s.id = m.store_id
  join auth.users u on lower(btrim(u.email)) = m.email
  where u.id = auth.uid() and u.email_confirmed_at is not null;
$$;
revoke all on function public.beauty_voice_my_membership() from public,anon;
grant execute on function public.beauty_voice_my_membership() to authenticated;

create or replace function public.beauty_voice_can_view_mission(targets text[])
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and (
    public.beauty_voice_can_reply_official() or exists (
      select 1 from public.beauty_voice_members m
      join auth.users u on lower(btrim(u.email)) = m.email
      where u.id = auth.uid() and u.email_confirmed_at is not null and m.is_active
        and (cardinality(targets) = 0 or m.store_id = any(targets))
    )
  );
$$;
revoke all on function public.beauty_voice_can_view_mission(text[]) from public,anon;
grant execute on function public.beauty_voice_can_view_mission(text[]) to authenticated;

alter table public.weekly_challenges add column if not exists target_store_ids text[] not null default '{}';
alter table public.weekly_challenges enable row level security;
alter table public.weekly_challenge_comments enable row level security;

-- 기존 허용 정책을 유지하면서 공개 대상 조건을 AND로 추가합니다.
drop policy if exists beauty_voice_mission_visibility on public.weekly_challenges;
create policy beauty_voice_mission_visibility on public.weekly_challenges
 as restrictive for select to authenticated
 using (public.beauty_voice_can_view_mission(target_store_ids));
drop policy if exists beauty_voice_mission_insert_guard on public.weekly_challenges;
create policy beauty_voice_mission_insert_guard on public.weekly_challenges
 as restrictive for insert to authenticated with check ((select public.beauty_voice_can_reply_official()) and created_by = (select auth.uid()));
drop policy if exists beauty_voice_mission_update_guard on public.weekly_challenges;
create policy beauty_voice_mission_update_guard on public.weekly_challenges
 as restrictive for update to authenticated
 using ((select public.beauty_voice_can_reply_official())) with check ((select public.beauty_voice_can_reply_official()));
drop policy if exists beauty_voice_mission_delete_guard on public.weekly_challenges;
create policy beauty_voice_mission_delete_guard on public.weekly_challenges
 as restrictive for delete to authenticated using ((select public.beauty_voice_can_reply_official()));

-- 원문 RLS를 통해 미션 댓글/참여 수 직접 조회까지 같은 접근 권한을 적용합니다.
drop policy if exists beauty_voice_mission_comments_visibility on public.weekly_challenge_comments;
create policy beauty_voice_mission_comments_visibility on public.weekly_challenge_comments
 as restrictive for all to authenticated
 using (exists(select 1 from public.weekly_challenges c where c.id = challenge_id))
 with check (exists(select 1 from public.weekly_challenges c where c.id = challenge_id));
drop policy if exists beauty_voice_mission_comment_insert_guard on public.weekly_challenge_comments;
create policy beauty_voice_mission_comment_insert_guard on public.weekly_challenge_comments
 as restrictive for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists beauty_voice_mission_comment_update_guard on public.weekly_challenge_comments;
create policy beauty_voice_mission_comment_update_guard on public.weekly_challenge_comments
 as restrictive for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists beauty_voice_mission_comment_delete_guard on public.weekly_challenge_comments;
create policy beauty_voice_mission_comment_delete_guard on public.weekly_challenge_comments
 as restrictive for delete to authenticated using (user_id = (select auth.uid()));

create or replace function public.beauty_voice_guard_mission()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not public.beauty_voice_can_reply_official() then
    raise exception 'Only registered administrators can manage missions' using errcode='42501';
  end if;
  if new.target_store_ids is null or exists (
    select 1 from unnest(new.target_store_ids) t(id)
    where t.id is null or not exists(select 1 from public.beauty_voice_stores s where s.id=t.id)
  ) then
    raise exception 'Unknown mission target store' using errcode='23514';
  end if;
  new.target_store_ids := array(select distinct x from unnest(new.target_store_ids) x order by x);
  if tg_op = 'INSERT' then
    new.created_by := auth.uid();
  else
    if new.id is distinct from old.id or new.created_by is distinct from old.created_by then
      raise exception 'Mission identity cannot be changed' using errcode='42501';
    end if;
  end if;
  new.updated_at := clock_timestamp();
  return new;
end;
$$;
revoke all on function public.beauty_voice_guard_mission() from public,anon,authenticated;
drop trigger if exists beauty_voice_guard_mission on public.weekly_challenges;
create trigger beauty_voice_guard_mission before insert or update on public.weekly_challenges
for each row execute function public.beauty_voice_guard_mission();

-- 본인의 기존 댓글을 다른 미션으로 옮기거나 작성자를 바꾸는 우회도 차단합니다.
create or replace function public.beauty_voice_guard_mission_comment()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  -- auth.users 삭제 시 기존 ON DELETE SET NULL 동작을 보존합니다.
  if tg_op = 'UPDATE' and pg_trigger_depth() > 1
    and new.user_id is null and old.user_id is not null
    and new.id = old.id and new.challenge_id = old.challenge_id
    and not exists(select 1 from auth.users u where u.id=old.user_id) then
    return new;
  end if;
  if auth.uid() is null or new.user_id is distinct from auth.uid() then
    raise exception 'Comment author must match current user' using errcode='42501';
  end if;
  if tg_op = 'UPDATE' and (
    new.id is distinct from old.id or new.user_id is distinct from old.user_id or new.challenge_id is distinct from old.challenge_id
  ) then
    raise exception 'Comment identity cannot be changed' using errcode='42501';
  end if;
  if not exists(select 1 from public.weekly_challenges c where c.id=new.challenge_id
    and public.beauty_voice_can_view_mission(c.target_store_ids)) then
    raise exception 'Mission access denied' using errcode='42501';
  end if;
  new.updated_at := clock_timestamp();
  return new;
end;
$$;
revoke all on function public.beauty_voice_guard_mission_comment() from public,anon,authenticated;
drop trigger if exists beauty_voice_guard_mission_comment on public.weekly_challenge_comments;
create trigger beauty_voice_guard_mission_comment before insert or update on public.weekly_challenge_comments
for each row execute function public.beauty_voice_guard_mission_comment();

create index if not exists beauty_voice_mission_comments_challenge on public.weekly_challenge_comments(challenge_id);
notify pgrst, 'reload schema';
commit;
