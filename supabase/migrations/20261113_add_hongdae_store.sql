-- 신규 매장 추가: 기존 구성원·미션·글·권한은 유지합니다.
begin;
insert into public.beauty_voice_stores(id,name,sort_order)
values ('hongdae','컬러 그라운드 홍대',4)
on conflict(id) do update set name=excluded.name,sort_order=excluded.sort_order;

alter table public.bc_insights drop constraint if exists bc_insights_store_allowed;
alter table public.bc_insights add constraint bc_insights_store_allowed
check(store_id is null or store_id in ('seongsu','beauty_mansion','gangnam','hongdae'));
notify pgrst, 'reload schema';
commit;
