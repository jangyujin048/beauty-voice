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

await db.exec(`
 create schema storage;
 create table storage.buckets(id text primary key, public boolean);
 insert into storage.buckets values('voice-images',true);
 create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
 alter table storage.objects enable row level security;
 grant usage on schema storage to anon,authenticated;
 grant all on storage.objects to anon,authenticated;
 create policy old_public_upload on storage.objects for insert to anon with check(bucket_id='voice-images');
 create policy old_public_read on storage.objects for select to anon using(bucket_id='voice-images');
 insert into storage.objects(bucket_id,name) values('voice-images','notices/test.png');
 create table public.thanks(id text primary key,likes integer default 0,created_by uuid);
 create table public.thanks_likes(thanks_id text,user_id uuid,primary key(thanks_id,user_id));
 create table public.beauty_voice_posts(id bigint primary key,likes integer default 0,user_id uuid,admin_only boolean default false);
 create table public.beauty_voice_post_likes(post_id bigint,user_id uuid,primary key(post_id,user_id));
 insert into thanks(id) values('t'); insert into beauty_voice_posts(id) values(1);
`);
const extra=['voices','user_profiles','bc_insights','beauty_lab_reservations','beauty_voice_comments','notices','faqs','admins'];
for(const table of extra) await db.exec(`create table public.${table}(id int primary key,user_id uuid); insert into public.${table}(id) values(1);`);
const tables=[...extra,'thanks','thanks_likes','beauty_voice_posts','beauty_voice_post_likes'];
for(const table of tables) {
 await db.exec(`grant all on public.${table} to anon,authenticated;`);
 if(!['voices','bc_insights','notices','faqs','admins'].includes(table)) {
  await db.exec(`alter table public.${table} enable row level security; create policy old_allow on public.${table} for all to public using(true) with check(true);`);
 }
}
const siteMigration=await readFile(new URL('../supabase/migrations/20260924_members_only_site.sql',import.meta.url),'utf8');
await db.exec(siteMigration);
let n=0;
async function test(name,fn){await fn();console.log(`PASS ${++n}: ${name}`);}
await test('existing admin bootstrapped, site access active, all missions visible',async()=>{
 await login(admin,'admin@test.example');
 assert.equal(await val('select status from beauty_voice_site_access()'),'active');
 assert.equal(await val('select beauty_voice_can_reply_official()'),true);
 assert.equal(await val("select store_id from beauty_voice_members where email='admin@test.example'"),'operations');
 assert.equal(await val('select count(*)::int from weekly_challenges'),1);
 await db.exec("insert into beauty_voice_members(email,store_id) values('a@test.example','seongsu'),('b@test.example','gangnam')");
});
await test('operations affiliation cannot grant admin and self-pause denied',async()=>{
 await fail("update beauty_voice_members set store_id='operations' where email='a@test.example'",'23514');
 await fail("update beauty_voice_members set is_active=false where email='admin@test.example'",'23514');
 await login(a,'a@test.example');
 assert.equal(await val('select beauty_voice_can_reply_official()'),false);
});
await test('active BC reads content, reserves, likes, downloads image; cannot edit notices',async()=>{
 for(const table of ['voices','notices','faqs','bc_insights','beauty_lab_reservations']) assert.equal(await val(`select count(*)::int from ${table}`),1);
 await db.exec(`insert into beauty_lab_reservations(id) values(2)`);
 assert.equal((await val("select toggle_thanks_like('t')")).liked,true);
 assert.equal((await val('select toggle_beauty_voice_post_like(1)')).liked,true);
 assert.equal(await val('select count(*)::int from storage.objects'),1);
 await fail("insert into notices(id) values(2)");
 await fail("insert into storage.objects(bucket_id,name) values('voice-images','notices/fake.png')");
});
await test('unregistered blocks every table and bypass RPC, even with spoofed email',async()=>{
 await login(unknown,'admin@test.example');
 assert.equal(await val('select status from beauty_voice_site_access()'),'unregistered');
 for(const table of tables.filter(x=>x!=='admins')) assert.equal(await val(`select count(*)::int from ${table}`),0);
 await fail('select * from admins');
 await fail("select toggle_thanks_like('t')");
 await fail('select toggle_beauty_voice_post_like(1)');
 await fail('insert into beauty_lab_reservations(id) values(3)');
 assert.equal(await val('select count(*)::int from storage.objects'),0);
});
await test('paused BC loses reads/writes and RPC immediately with existing session',async()=>{
 await login(admin,'admin@test.example');
 await db.exec("update beauty_voice_members set is_active=false where email='a@test.example'");
 await login(a,'a@test.example');
 assert.equal(await val('select status from beauty_voice_site_access()'),'paused');
 assert.equal(await val('select count(*)::int from thanks'),0);
 await fail("select toggle_thanks_like('t')");
 await fail("insert into storage.objects(bucket_id,name) values('voice-images','voices/new.png')");
});
await test('paused admin denied, migration rerun does not reactivate',async()=>{
 await db.exec("reset role; alter table beauty_voice_members disable trigger beauty_voice_guard_member; update beauty_voice_members set is_active=false where email='admin@test.example'; alter table beauty_voice_members enable trigger beauty_voice_guard_member;");
 await db.exec(siteMigration);
 await login(admin,'admin@test.example');
 assert.equal(await val('select beauty_voice_can_reply_official()'),false);
 assert.equal(await val('select is_admin()'),false);
 assert.equal(await val('select count(*)::int from weekly_challenges'),0);
 await fail("insert into beauty_voice_members(email,store_id) values('new@test.example','seongsu')");
});
await test('anon cannot read site or images; bucket private; records preserved',async()=>{
 await login('','','anon');
 for(const table of tables.filter(x=>x!=='admins')) assert.equal(await val(`select count(*)::int from ${table}`),0);
 assert.equal(await val('select count(*)::int from storage.objects'),0);
 await fail("insert into storage.objects(bucket_id,name) values('voice-images','attack.png')");
 await fail('select * from beauty_voice_site_access()');
 await db.exec('reset role');
 assert.equal(await val("select public from storage.buckets where id='voice-images'"),false);
 assert.equal(await val('select count(*)::int from beauty_lab_reservations'),2);
 assert.equal(await val('select count(*)::int from thanks_likes'),1);
});
await db.close();console.log(`${n} site access security scenarios passed.`);
