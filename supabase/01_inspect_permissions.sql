-- Supabase SQL Editor에서 실행하는 읽기 전용 구조 확인 쿼리입니다.
-- 행 데이터, 이메일, 비밀 키는 조회하지 않습니다.
select jsonb_build_object(
  'columns', (select jsonb_agg(to_jsonb(c)) from (
    select table_name, column_name, data_type, is_nullable, column_default
    from information_schema.columns
    where table_schema = 'public' and table_name in ('beauty_voice_comments', 'beauty_voice_posts', 'voices')
  ) c),
  'rls', (select jsonb_agg(to_jsonb(c)) from (
    select relname, relrowsecurity, relforcerowsecurity
    from pg_class where oid in (to_regclass('public.beauty_voice_comments'), to_regclass('public.beauty_voice_posts'), to_regclass('public.voices'))
  ) c),
  'policies', (select jsonb_agg(to_jsonb(p)) from (
    select tablename, policyname, permissive, roles, cmd, qual, with_check
    from pg_policies where schemaname = 'public'
    and tablename in ('beauty_voice_comments', 'beauty_voice_posts', 'voices')
  ) p),
  'triggers', (select jsonb_agg(pg_get_triggerdef(t.oid)) from pg_trigger t
    where not t.tgisinternal and t.tgrelid in (to_regclass('public.beauty_voice_comments'), to_regclass('public.beauty_voice_posts'))),
  'admin_function', (select jsonb_agg(pg_get_functiondef(p.oid)) from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'is_admin')
) as permissions_snapshot;
