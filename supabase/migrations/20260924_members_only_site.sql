-- 2026-09-24: 활성 구성원만 사이트 이용. SQL Editor에서 전체 실행.
-- 기존 운영진은 최초 실행에만 활성 구성원/운영진 소속으로 이관합니다.
begin;
lock table public.beauty_voice_members in share row exclusive mode;
alter table public.beauty_voice_members disable trigger beauty_voice_guard_member;
do $$
begin
 if not exists(select 1 from public.beauty_voice_stores where id='operations') then
  insert into public.beauty_voice_stores(id,name,sort_order) values('operations','운영진',0);
  insert into public.beauty_voice_members(email,store_id,is_active)
   select distinct lower(btrim(email)), 'operations', true from public.admin_users
   on conflict(email) do update set store_id='operations',is_active=true,updated_at=clock_timestamp();
 end if;
end $$;
alter table public.beauty_voice_members enable trigger beauty_voice_guard_member;

create or replace function public.beauty_voice_can_use_site()
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.beauty_voice_members m join auth.users u
  on m.email=lower(btrim(u.email)) where u.id=auth.uid() and u.email_confirmed_at is not null and m.is_active);
$$;
revoke all on function public.beauty_voice_can_use_site() from public;
grant execute on function public.beauty_voice_can_use_site() to anon,authenticated;

create or replace function public.beauty_voice_can_reply_official()
returns boolean language sql stable security definer set search_path='' as $$
 select public.beauty_voice_can_use_site() and exists(select 1 from auth.users u
 join public.admin_users a on lower(btrim(a.email))=lower(btrim(u.email))
 where u.id=auth.uid() and u.email_confirmed_at is not null);
$$;
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path='' as $$
 select public.beauty_voice_can_reply_official();
$$;
-- 기존 정책 호환: 비로그인 계정에는 false만 반환.
grant execute on function public.beauty_voice_can_reply_official() to anon,authenticated;
create or replace function public.beauty_voice_site_access()
returns table(status text,is_admin boolean)
language sql stable security definer set search_path='' as $$
 select case when u.id is null or u.email_confirmed_at is null or m.id is null then 'unregistered'
 when m.is_active then 'active' else 'paused' end, public.beauty_voice_can_reply_official()
 from (select auth.uid() id) me left join auth.users u on u.id=me.id
 left join public.beauty_voice_members m on m.email=lower(btrim(u.email));
$$;
revoke all on function public.beauty_voice_site_access() from public,anon;
grant execute on function public.beauty_voice_site_access() to authenticated;

CREATE OR REPLACE FUNCTION public.beauty_voice_guard_member()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not public.beauty_voice_can_reply_official() then
    raise exception 'Only registered administrators can manage members' using errcode='42501';
  end if;
  new.email := lower(btrim(new.email));
  if new.store_id='operations' and not exists(select 1 from public.admin_users a where lower(btrim(a.email))=new.email) then
    raise exception '운영진 소속은 기존 운영진 계정에만 지정할 수 있습니다.' using errcode='23514';
  end if;
  if tg_op='UPDATE' and not new.is_active and exists(select 1 from auth.users u where u.id=auth.uid() and lower(btrim(u.email))=old.email) then
    raise exception '본인 계정은 이용 중지할 수 없습니다. 다른 운영진에게 요청해주세요.' using errcode='23514';
  end if;
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
$function$
;
CREATE OR REPLACE FUNCTION public.beauty_voice_guard_mission()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not public.beauty_voice_can_reply_official() then
    raise exception 'Only registered administrators can manage missions' using errcode='42501';
  end if;
  if new.target_store_ids is null or exists (
    select 1 from unnest(new.target_store_ids) t(id)
    where t.id is null or t.id='operations' or not exists(select 1 from public.beauty_voice_stores s where s.id=t.id)
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
$function$
;

CREATE OR REPLACE FUNCTION public.toggle_thanks_like(p_thanks_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid;
  v_existing boolean;
  v_likes integer;
begin
  if not public.beauty_voice_can_use_site() then
    raise exception '활성 구성원만 이용할 수 있습니다.' using errcode='42501';
  end if;
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception '로그인이 필요합니다.';
  end if;

  if not exists (
    select 1
    from public.thanks t
    where t.id::text = p_thanks_id
  ) then
    raise exception 'Thanks를 찾을 수 없습니다.';
  end if;

  select exists (
    select 1
    from public.thanks_likes l
    where l.thanks_id = p_thanks_id
      and l.user_id = v_user_id
  )
  into v_existing;

  if v_existing then
    delete from public.thanks_likes
    where thanks_id = p_thanks_id
      and user_id = v_user_id;

    update public.thanks
    set likes = greatest(coalesce(likes, 0) - 1, 0)
    where id::text = p_thanks_id
    returning likes into v_likes;

    return jsonb_build_object(
      'liked', false,
      'likes', v_likes
    );
  else
    insert into public.thanks_likes (
      thanks_id,
      user_id
    )
    values (
      p_thanks_id,
      v_user_id
    )
    on conflict (thanks_id, user_id) do nothing;

    update public.thanks
    set likes = coalesce(likes, 0) + 1
    where id::text = p_thanks_id
    returning likes into v_likes;

    return jsonb_build_object(
      'liked', true,
      'likes', v_likes
    );
  end if;
end;
$function$
;
revoke all on function public.toggle_thanks_like(text) from public,anon;
grant execute on function public.toggle_thanks_like(text) to authenticated;

CREATE OR REPLACE FUNCTION public.toggle_beauty_voice_post_like(p_post_id bigint)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid;
  v_existing boolean;
  v_likes integer;
begin
  if not public.beauty_voice_can_use_site() then
    raise exception '활성 구성원만 이용할 수 있습니다.' using errcode='42501';
  end if;
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception '로그인이 필요합니다.';
  end if;

  -- 현재 사용자가 볼 수 있는 게시글인지 확인
  if not exists (
    select 1
    from public.beauty_voice_posts p
    where p.id = p_post_id
      and (
        coalesce(p.admin_only, false) = false
        or p.user_id = v_user_id
        or public.is_admin()
      )
  ) then
    raise exception '게시글을 확인할 수 없습니다.';
  end if;

  -- 이 사용자가 현재 공감 중인지 확인
  select exists (
    select 1
    from public.beauty_voice_post_likes l
    where l.post_id = p_post_id
      and l.user_id = v_user_id
  )
  into v_existing;

  if v_existing then

    -- 공감 취소
    delete from public.beauty_voice_post_likes
    where post_id = p_post_id
      and user_id = v_user_id;

    update public.beauty_voice_posts
    set likes = greatest(
      coalesce(likes, 0) - 1,
      0
    )
    where id = p_post_id
    returning likes into v_likes;

    return jsonb_build_object(
      'liked', false,
      'likes', v_likes
    );

  else

    -- 공감 추가
    insert into public.beauty_voice_post_likes (
      post_id,
      user_id
    )
    values (
      p_post_id,
      v_user_id
    )
    on conflict (post_id, user_id) do nothing;

    update public.beauty_voice_posts
    set likes = coalesce(likes, 0) + 1
    where id = p_post_id
    returning likes into v_likes;

    return jsonb_build_object(
      'liked', true,
      'likes', v_likes
    );

  end if;
end;
$function$
;
revoke all on function public.toggle_beauty_voice_post_like(bigint) from public,anon;
grant execute on function public.toggle_beauty_voice_post_like(bigint) to authenticated;

-- 기존 소유자/매장 정책을 유지하고 활성 구성원 조건을 AND로 추가.
do $$ declare t text; begin
 foreach t in array array['voices','user_profiles','bc_insights','thanks_likes','beauty_voice_posts','beauty_lab_reservations','beauty_voice_comments','beauty_voice_members','notices','weekly_challenges','beauty_voice_stores','thanks','weekly_challenge_comments','faqs','beauty_voice_post_likes'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('drop policy if exists beauty_voice_active_member on public.%I',t);
  execute format('create policy beauty_voice_active_member on public.%I as restrictive for all to public using ((select public.beauty_voice_can_use_site())) with check ((select public.beauty_voice_can_use_site()))',t);
 end loop;
 foreach t in array array['notices','bc_insights','faqs'] loop
  execute format('drop policy if exists beauty_voice_content_read on public.%I',t);
  execute format('create policy beauty_voice_content_read on public.%I for select to authenticated using (true)',t);
  execute format('drop policy if exists beauty_voice_content_manage on public.%I',t);
  execute format('create policy beauty_voice_content_manage on public.%I for all to authenticated using ((select public.beauty_voice_can_reply_official())) with check ((select public.beauty_voice_can_reply_official()))',t);
 end loop;
end $$;
-- 기존 Voice 기능을 활성 구성원 범위 안에서 유지.
drop policy if exists beauty_voice_legacy_member on public.voices;
create policy beauty_voice_legacy_member on public.voices for all to authenticated using(true) with check(true);
-- 사용하지 않는 기존 운영자 명단은 브라우저 접근 차단.
alter table public.admins enable row level security;
revoke all on public.admins from public,anon,authenticated;
drop policy if exists beauty_voice_private on public.admins;
create policy beauty_voice_private on public.admins as restrictive for all to public using(false) with check(false);

-- 공개 URL의 RLS 우회를 막기 위해 비공개화. 파일과 기존 DB URL은 보존.
update storage.buckets set public=false where id='voice-images';
drop policy if exists beauty_voice_images_member_guard on storage.objects;
create policy beauty_voice_images_member_guard on storage.objects as restrictive for all to public
 using(bucket_id <> 'voice-images' or (select public.beauty_voice_can_use_site()))
 with check(bucket_id <> 'voice-images' or (select public.beauty_voice_can_use_site()));
drop policy if exists beauty_voice_images_member_read on storage.objects;
create policy beauty_voice_images_member_read on storage.objects for select to authenticated
 using(bucket_id='voice-images' and (select public.beauty_voice_can_use_site()));
drop policy if exists beauty_voice_images_member_upload on storage.objects;
create policy beauty_voice_images_member_upload on storage.objects for insert to authenticated
 with check(bucket_id='voice-images' and (select public.beauty_voice_can_use_site())
 and (split_part(name,'/',1) not in ('notices','insights') or (select public.beauty_voice_can_reply_official())));
notify pgrst, 'reload schema';
commit;
