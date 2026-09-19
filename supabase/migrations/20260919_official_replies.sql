-- 01_inspect_permissions.sql로 확인한 기존 테이블/정책을 보존하는 추가 보안 계층.
-- Supabase SQL Editor의 postgres 역할로 전체 실행. 기존 이메일/댓글 데이터는 변경하지 않음.
begin;

-- 기존 등록 이메일 목록을 그대로 사용. 브라우저에서 명단 변경/조회 금지.
-- 기존 public.is_admin()은 다른 기능의 호환성을 위해 변경하지 않음.
alter table public.admin_users enable row level security;
revoke all on public.admin_users from anon, authenticated;
drop policy if exists beauty_voice_admin_directory_private on public.admin_users;
create policy beauty_voice_admin_directory_private on public.admin_users
  as restrictive for all to anon, authenticated using (false) with check (false);

-- 인자를 받지 않으며 현재 계정의 권한(boolean)만 반환.
-- auth.users의 검증된 현재 이메일을 사용해 JWT의 오래된 이메일/사용자 메타데이터를 신뢰하지 않음.
create or replace function public.beauty_voice_can_reply_official()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from auth.users u
    join public.admin_users a on lower(trim(a.email)) = lower(trim(u.email))
    where u.id = auth.uid() and u.email_confirmed_at is not null
  );
$$;
revoke all on function public.beauty_voice_can_reply_official() from public, anon;
grant execute on function public.beauty_voice_can_reply_official() to authenticated;

alter table public.beauty_voice_comments enable row level security;

-- SELECT/INSERT/UPDATE/DELETE 모두 원문을 볼 수 있는 사용자에게만 허용.
-- 하위 쿼리는 기존 beauty_voice_posts SELECT RLS(공개/본인/운영진)를 따름.
drop policy if exists beauty_voice_comment_visible_post on public.beauty_voice_comments;
create policy beauty_voice_comment_visible_post on public.beauty_voice_comments
  as restrictive for all to authenticated
  using (exists (select 1 from public.beauty_voice_posts p where p.id = post_id))
  with check (exists (select 1 from public.beauty_voice_posts p where p.id = post_id));

drop policy if exists beauty_voice_comment_insert_guard on public.beauty_voice_comments;
create policy beauty_voice_comment_insert_guard on public.beauty_voice_comments
  as restrictive for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (is_admin is not true or (select public.beauty_voice_can_reply_official()))
  );

drop policy if exists beauty_voice_comment_update_guard on public.beauty_voice_comments;
create policy beauty_voice_comment_update_guard on public.beauty_voice_comments
  as restrictive for update to authenticated
  using (user_id = (select auth.uid()) and (is_admin is not true or (select public.beauty_voice_can_reply_official())))
  with check (user_id = (select auth.uid()) and (is_admin is not true or (select public.beauty_voice_can_reply_official())));

drop policy if exists beauty_voice_comment_delete_guard on public.beauty_voice_comments;
create policy beauty_voice_comment_delete_guard on public.beauty_voice_comments
  as restrictive for delete to authenticated
  using (user_id = (select auth.uid()) and (is_admin is not true or (select public.beauty_voice_can_reply_official())));

-- UPDATE로 익명/공식 유형을 전환하거나 작성자/원문을 바꾸는 것도 금지.
create or replace function public.beauty_voice_guard_comment()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null or new.user_id is distinct from auth.uid() then
    raise exception 'Comment author must match the authenticated user' using errcode = '42501';
  end if;
  if tg_op = 'UPDATE' then
    if new.user_id is distinct from old.user_id
       or new.post_id is distinct from old.post_id
       or new.is_admin is distinct from old.is_admin then
      raise exception 'Comment identity and reply type cannot be changed' using errcode = '42501';
    end if;
  end if;
  if new.is_admin is true and not public.beauty_voice_can_reply_official() then
    raise exception 'Official reply permission required' using errcode = '42501';
  end if;
  new.writer := case when new.is_admin is true then '운영진 · 조직문화팀' else '익명 BC' end;
  return new;
end;
$$;
revoke all on function public.beauty_voice_guard_comment() from public, anon, authenticated;
drop trigger if exists beauty_voice_guard_comment on public.beauty_voice_comments;
create trigger beauty_voice_guard_comment before insert or update
  on public.beauty_voice_comments for each row execute function public.beauty_voice_guard_comment();

-- 기존 posts UPDATE는 작성자만 허용하므로 광범위한 운영진 UPDATE 권한을 추가하지 않음.
-- 검증된 공식 답변 INSERT와 상태 변경을 하나의 트랜잭션에서 처리.
create or replace function public.beauty_voice_mark_answered()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if new.is_admin is true then
    if not public.beauty_voice_can_reply_official() then
      raise exception 'Official reply permission required' using errcode = '42501';
    end if;
    update public.beauty_voice_posts set status = '답변완료' where id = new.post_id;
  end if;
  return new;
end;
$$;
revoke all on function public.beauty_voice_mark_answered() from public, anon, authenticated;
drop trigger if exists beauty_voice_mark_answered on public.beauty_voice_comments;
create trigger beauty_voice_mark_answered after insert on public.beauty_voice_comments
  for each row execute function public.beauty_voice_mark_answered();

-- 구형 voices 경로는 RLS가 꺼져 있어 공식 답변 필드에 별도 가드 추가.
-- 익명 의견 접수와 reply_seen 갱신은 기존대로 유지.
create or replace function public.beauty_voice_guard_legacy_reply()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare protected_change boolean;
begin
  if tg_op = 'INSERT' then
    protected_change := new.admin_reply is not null or new.replied_at is not null or new.reply_updated_at is not null;
  elsif tg_op = 'UPDATE' then
    protected_change := new.admin_reply is distinct from old.admin_reply
      or new.replied_at is distinct from old.replied_at
      or new.reply_updated_at is distinct from old.reply_updated_at;
  end if;
  if protected_change and not public.beauty_voice_can_reply_official() then
    raise exception 'Official reply permission required' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke all on function public.beauty_voice_guard_legacy_reply() from public, anon, authenticated;
drop trigger if exists beauty_voice_guard_legacy_reply on public.voices;
create trigger beauty_voice_guard_legacy_reply before insert or update on public.voices
  for each row execute function public.beauty_voice_guard_legacy_reply();

notify pgrst, 'reload schema';
commit;
