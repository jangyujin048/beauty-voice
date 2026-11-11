-- 기존 글/사진/권한 정책을 유지하는 추가 컬럼. SQL Editor에서 전체 실행.
begin;
alter table public.bc_insights add column if not exists store_id text;
alter table public.bc_insights add column if not exists image_urls text[] not null default '{}';
-- 최초 컬럼 추가 후 기존 대표 사진을 배열로 보존. 반복 실행도 안전.
update public.bc_insights set image_urls=array[image_url]
 where cardinality(image_urls)=0 and nullif(btrim(image_url),'') is not null;
alter table public.bc_insights drop constraint if exists bc_insights_store_allowed;
alter table public.bc_insights add constraint bc_insights_store_allowed
 check(store_id is null or store_id in ('seongsu','beauty_mansion','gangnam'));
alter table public.bc_insights drop constraint if exists bc_insights_images_max_three;
alter table public.bc_insights add constraint bc_insights_images_max_three
 check(cardinality(image_urls) <= 3 and array_position(image_urls,null) is null
 and array_position(image_urls,'') is null and (cardinality(image_urls)=0 or array_ndims(image_urls)=1));
-- 기존 미분류 글은 store_id=null로 보존. 새 글은 매장 지정 필수.
create or replace function public.beauty_voice_guard_insight_gallery()
returns trigger language plpgsql set search_path='' as $$
begin
 if tg_op='INSERT' and new.store_id is null then
  raise exception '인사이트 매장을 선택해주세요.' using errcode='23514';
 end if;
 -- 대표 이미지도 배열 첫 사진으로 맞춰 이전 화면과 호환.
 new.image_url := coalesce(new.image_urls[1],'');
 return new;
end $$;
revoke all on function public.beauty_voice_guard_insight_gallery() from public,anon,authenticated;
drop trigger if exists beauty_voice_guard_insight_gallery on public.bc_insights;
create trigger beauty_voice_guard_insight_gallery before insert or update on public.bc_insights
 for each row execute function public.beauty_voice_guard_insight_gallery();
notify pgrst, 'reload schema';
commit;
