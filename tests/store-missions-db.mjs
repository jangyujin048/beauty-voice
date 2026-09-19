// Isolated PostgreSQL engine. No connection or writes to production Supabase.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite');
const db = new PGlite();
const admin='00000000-0000-0000-0000-000000000001';
const a='00000000-0000-0000-0000-000000000002';
const b='00000000-0000-0000-0000-000000000003';
const unknown='00000000-0000-0000-0000-000000000004';
const q = async (sql,params=[]) => (await db.query(sql,params)).rows;
const val=async(sql,params=[])=>Object.values((await q(sql,params))[0]||{})[0];
const fail=async(sql,code='42501')=>assert.rejects(db.exec(sql),error=>error.code===code);
async function login(id,email,role='authenticated') {
 await db.exec(`reset role; set request.jwt.claim.sub='${id}'; set request.jwt.claim.email='${email}'; set role ${role};`);
}
await db.exec(`
 create role authenticated; create role anon; create schema auth;
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create function auth.jwt() returns jsonb language sql stable as $$select jsonb_build_object('email',current_setting('request.jwt.claim.email',true))$$;
 create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
 insert into auth.users values('${admin}','admin@test.example',now()),('${a}','a@test.example',now()),('${b}','b@test.example',now()),('${unknown}','unknown@test.example',now());
 create table public.admin_users(id uuid primary key default gen_random_uuid(),email text not null,created_at timestamptz not null default now());
 insert into admin_users(email) values('admin@test.example');
 create function public.is_admin() returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.admin_users where lower(trim(email))=lower(trim(auth.jwt()->>'email')))$$;
 create table weekly_challenges(id uuid primary key default gen_random_uuid(), title text not null,description text not null,prompt text,start_date date not null,end_date date not null,status text not null default 'active' check(status in ('active','closed')),created_by uuid references auth.users,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
 create table weekly_challenge_comments(id uuid primary key default gen_random_uuid(),challenge_id uuid not null references weekly_challenges on delete cascade,user_id uuid references auth.users on delete set null,content text not null,writer text not null default '익명 BC',created_at timestamptz not null default now(),updated_at timestamptz not null default now());
 grant usage on schema auth,public to authenticated,anon;
 grant all on weekly_challenges,weekly_challenge_comments to authenticated,anon;
 alter table weekly_challenges enable row level security;
 alter table weekly_challenge_comments enable row level security;
 create policy "Admins can create weekly challenges" on weekly_challenges for insert to authenticated with check ((select is_admin()));
 create policy "Admins can update weekly challenges" on weekly_challenges for update to authenticated using((select is_admin())) with check((select is_admin()));
 create policy "Admins can delete weekly challenges" on weekly_challenges for delete to authenticated using((select is_admin()));
 create policy "Authenticated users can read challenges" on weekly_challenges for select to authenticated using(true);
 create policy "Authenticated users can create challenge comments" on weekly_challenge_comments for insert to authenticated with check(auth.uid()=user_id);
 create policy "Authenticated users can read challenge comments" on weekly_challenge_comments for select to authenticated using(true);
 create policy "Users can update own challenge comments" on weekly_challenge_comments for update to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
 create policy "Users can delete own challenge comments" on weekly_challenge_comments for delete to authenticated using(auth.uid()=user_id);
 insert into weekly_challenges(title,description,start_date,end_date) values('existing','preserved','2026-09-19','2026-09-30');
`);
const previous=await readFile(new URL('../supabase/migrations/20260919_official_replies.sql',import.meta.url),'utf8');
const helper=previous.match(/create or replace function public\.beauty_voice_can_reply_official\(\)[\s\S]*?grant execute on function public\.beauty_voice_can_reply_official\(\) to authenticated;/)[0];
await db.exec(helper);
const migration=await readFile(new URL('../supabase/migrations/20260919_store_members_and_missions.sql',import.meta.url),'utf8');
await db.exec(migration);await db.exec(migration);
let n=0;
async function test(name,fn){await fn();console.log(`PASS ${++n}: ${name}`);}
let seongsuMission,multiMission,gangnamMission,commentId,oldVersion;
await test('migration reruns; old missions are preserved with all-store audience',async()=>{
 assert.equal(await val("select count(*)::int from weekly_challenges where title='existing' and target_store_ids='{}'"),1);
 assert.equal(await val("select count(*)::int from pg_policies where tablename in ('weekly_challenges','weekly_challenge_comments') and permissive='PERMISSIVE'"),8);
});
await test('admin registers pending members; email normalized; duplicate and unknown store rejected',async()=>{
 await login(admin,'admin@test.example');
 await db.exec("insert into beauty_voice_members(email,store_id) values(' A@TEST.EXAMPLE ','seongsu'),('b@test.example','gangnam'),('future@test.example','beauty_mansion')");
 assert.equal(await val("select created_by::text from beauty_voice_members where email='a@test.example'"),admin);
 await fail("insert into beauty_voice_members(email,store_id) values('a@test.example','gangnam')",'23505');
 await fail("insert into beauty_voice_members(email,store_id) values('z@test.example','fake')",'23503');
 await fail("insert into beauty_voice_members(email,store_id) values('bad email','seongsu')",'23514');
});
await test('admin can run multiple active missions without auto-closing any',async()=>{
 seongsuMission=await val("insert into weekly_challenges(title,description,start_date,end_date,target_store_ids) values('seongsu','description','2026-09-19','2026-09-30',array['seongsu']) returning id");
 gangnamMission=await val("insert into weekly_challenges(title,description,start_date,end_date,target_store_ids) values('gangnam','description','2026-09-19','2026-09-30',array['gangnam']) returning id");
 multiMission=await val("insert into weekly_challenges(title,description,start_date,end_date,target_store_ids) values('multi','description','2026-09-19','2026-09-30',array['gangnam','seongsu','gangnam']) returning id");
 assert.equal(await val("select count(*)::int from weekly_challenges where status='active'"),4);
 assert.deepEqual(await val("select target_store_ids from weekly_challenges where title='multi'"),['gangnam','seongsu']);
 await fail("update weekly_challenges set target_store_ids=array['fake'] where title='multi'",'23514');
 await fail("update weekly_challenges set target_store_ids=array[null]::text[] where title='multi'",'23514');
});
await test('BC sees own/all/shared missions only; membership list and mutations stay private',async()=>{
 await login(a,'a@test.example');
 assert.deepEqual((await q('select title from weekly_challenges order by title')).map(x=>x.title),['existing','multi','seongsu']);
 assert.equal(await val('select count(*)::int from beauty_voice_members'),0);
 assert.equal(await val('select store_id from beauty_voice_my_membership()'),'seongsu');
 await fail("insert into beauty_voice_members(email,store_id) values('rogue@test.example','seongsu')");
 assert.equal((await q("update beauty_voice_members set store_id='gangnam' returning id")).length,0);
 await fail('delete from beauty_voice_members');
 await fail("insert into weekly_challenges(title,description,start_date,end_date) values('fake','fake','2026-09-19','2026-09-30')");
});
await test('direct URL/ID and forged author cannot bypass mission participation permissions',async()=>{
 assert.equal((await q('select * from weekly_challenges where id=$1',[gangnamMission])).length,0);
 await fail(`insert into weekly_challenge_comments(challenge_id,user_id,content) values('${gangnamMission}','${a}','forged')`);
 await fail(`insert into weekly_challenge_comments(challenge_id,user_id,content) values('${seongsuMission}','${b}','forged')`);
 commentId=await val(`insert into weekly_challenge_comments(challenge_id,user_id,content,writer) values('${seongsuMission}','${a}','participate','닉네임') returning id`);
 await db.exec(`update weekly_challenge_comments set content='edited' where id='${commentId}'`);
 assert.equal(await val(`select content from weekly_challenge_comments where id='${commentId}'`),'edited');
 await fail(`update weekly_challenge_comments set challenge_id='${multiMission}' where id='${commentId}'`);
});
await test('other store cannot read comments or count hidden participation',async()=>{
 await login(b,'b@test.example');
 assert.equal(await val(`select count(*)::int from weekly_challenge_comments where challenge_id='${seongsuMission}'`),0);
 assert.equal((await q(`update weekly_challenge_comments set content='attack' where id='${commentId}' returning id`)).length,0);
});
await test('member move takes effect on next request with same JWT',async()=>{
 await login(admin,'admin@test.example');
 oldVersion=await val("select updated_at::text from beauty_voice_members where email='a@test.example'");
 await db.exec("update beauty_voice_members set store_id='gangnam' where email='a@test.example'");
 assert.equal((await q("update beauty_voice_members set store_id='beauty_mansion' where email='a@test.example' and updated_at=$1 returning id",[oldVersion])).length,0);
 await login(a,'a@test.example');
 assert.deepEqual((await q('select title from weekly_challenges order by title')).map(x=>x.title),['existing','gangnam','multi']);
 assert.equal(await val(`select count(*)::int from weekly_challenge_comments where id='${commentId}'`),0);
});
await test('pause blocks all mission reads and writes, keeps history, resume restores',async()=>{
 await login(admin,'admin@test.example');
 await db.exec("update beauty_voice_members set is_active=false where email='a@test.example'");
 await login(a,'a@test.example');
 assert.equal(await val('select is_active from beauty_voice_my_membership()'),false);
 assert.equal(await val('select count(*)::int from weekly_challenges'),0);
 await fail(`insert into weekly_challenge_comments(challenge_id,user_id,content) values('${gangnamMission}','${a}','blocked')`);
 await login(admin,'admin@test.example');
 assert.equal(await val(`select count(*)::int from weekly_challenge_comments where id='${commentId}'`),1);
 await db.exec("update beauty_voice_members set is_active=true,store_id='seongsu' where email='a@test.example'");
 await login(a,'a@test.example');
 assert.equal(await val(`select count(*)::int from weekly_challenge_comments where id='${commentId}'`),1);
});
await test('unregistered and logged-out users cannot view any missions',async()=>{
 await login(unknown,'unknown@test.example');
 assert.equal(await val('select count(*)::int from weekly_challenges'),0);
 assert.equal((await q('select * from beauty_voice_my_membership()')).length,0);
 await login('','','anon');
 assert.equal(await val('select count(*)::int from weekly_challenges'),0);
 await fail('select * from beauty_voice_members');
});
await test('edited JWT email and unverified auth email cannot impersonate membership',async()=>{
 await login(unknown,'a@test.example');
 assert.equal(await val('select count(*)::int from weekly_challenges'),0);
 await db.exec(`reset role; update auth.users set email_confirmed_at=null where id='${a}'`);
 await login(a,'a@test.example');
 assert.equal(await val('select count(*)::int from weekly_challenges'),0);
 await db.exec(`reset role; update auth.users set email_confirmed_at=now() where id='${a}'`);
});
await test('admin access is independent of member activation; member edits cannot grant admin',async()=>{
 await login(admin,'admin@test.example');
 await db.exec("insert into beauty_voice_members(email,store_id,is_active) values('admin@test.example','seongsu',false)");
 assert.equal(await val('select count(*)::int from weekly_challenges'),4);
 await fail("update beauty_voice_members set email='replacement@test.example' where email='a@test.example'");
 await fail('delete from beauty_voice_members');
 await login(a,'a@test.example');
 assert.equal(await val('select beauty_voice_can_reply_official()'),false);
});
await test('revoked admin cannot use old UI or old JWT to manage members/missions',async()=>{
 await db.exec('reset role; delete from admin_users;');
 await login(admin,'admin@test.example');
 await fail("insert into beauty_voice_members(email,store_id) values('attacker@test.example','seongsu')");
 assert.equal((await q("update weekly_challenges set title='attack' returning id")).length,0);
 await db.exec("reset role; insert into admin_users(email) values('admin@test.example')");
});
await test('existing auth-user deletion keeps orphaned participation through ON DELETE SET NULL',async()=>{
 await db.exec(`reset role; delete from auth.users where id='${a}'`);
 assert.equal(await val(`select count(*)::int from weekly_challenge_comments where id='${commentId}' and user_id is null`),1);
});
await test('mission cascade delete remains available to authorized admin only',async()=>{
 await login(admin,'admin@test.example');
 await db.exec(`delete from weekly_challenges where id='${seongsuMission}'`);
 assert.equal(await val(`select count(*)::int from weekly_challenge_comments where id='${commentId}'`),0);
});
await db.close();console.log(`${n} store/member security scenarios passed.`);
