// PGLITE_MODULE may point to a temporary installation; never connects to a real database.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite');
const db = new PGlite();
const admin = '00000000-0000-0000-0000-000000000001';
const bc = '00000000-0000-0000-0000-000000000002';
const other = '00000000-0000-0000-0000-000000000003';
await db.exec(`
create role anon; create role authenticated;
create schema auth;
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create function auth.jwt() returns jsonb language sql stable as $$ select jsonb_build_object('email', current_setting('request.jwt.claim.email', true)) $$;
create table auth.users(id uuid primary key, email text, email_confirmed_at timestamptz);
insert into auth.users values ('${admin}', 'ADMIN@example.test', now()), ('${bc}', 'bc@example.test', now()), ('${other}', 'other@example.test', now());
create table public.admin_users(email text);
insert into public.admin_users values (' admin@example.test ');
create function public.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
select exists(select 1 from public.admin_users where lower(trim(email)) = lower(trim(auth.jwt()->>'email'))) $$;
create table public.beauty_voice_posts(id bigint primary key, user_id uuid, admin_only boolean default false, status text default '접수');
create table public.beauty_voice_comments(id uuid primary key default gen_random_uuid(), post_id bigint not null references public.beauty_voice_posts on delete cascade, user_id uuid, content text, writer text, is_admin boolean default false, created_at timestamp);
create table public.voices(id bigint primary key, admin_reply text, replied_at timestamptz, reply_updated_at timestamptz, reply_seen boolean default false);
grant usage on schema public, auth to authenticated, anon;
grant all on all tables in schema public to authenticated, anon;
alter table beauty_voice_posts enable row level security;
alter table beauty_voice_comments enable row level security;
create policy posts_read on beauty_voice_posts for select to authenticated using (coalesce(admin_only,false)=false or user_id=auth.uid() or is_admin());
create policy posts_insert on beauty_voice_posts for insert to authenticated with check (user_id=auth.uid());
create policy posts_update on beauty_voice_posts for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy posts_delete on beauty_voice_posts for delete to authenticated using (user_id=auth.uid());
create policy comments_read on beauty_voice_comments for select to authenticated using (true);
create policy comments_insert on beauty_voice_comments for insert to authenticated with check (true);
create policy comments_update on beauty_voice_comments for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy comments_delete on beauty_voice_comments for delete to authenticated using (user_id=auth.uid());
insert into beauty_voice_posts values (1,'${bc}',false,'접수'), (2,'${other}',true,'접수'), (3,'${bc}',false,'접수');
insert into voices(id) values (1);
`);
const migration = await readFile(new URL('../supabase/migrations/20260919_official_replies.sql', import.meta.url), 'utf8');
await db.exec(migration);
await db.exec(migration); // rerun safely
let count = 0;
async function check(name, fn) { await fn(); console.log(`PASS ${++count}: ${name}`); }
async function login(id, email, role='authenticated') {
  await db.exec(`reset role; set request.jwt.claim.sub = '${id}'; set request.jwt.claim.email = '${email}'; set role ${role};`);
}
async function rejected(sql) { await assert.rejects(db.exec(sql), e => e.code === '42501'); }
async function scalar(sql) { const r = await db.query(sql); return Object.values(r.rows[0] || {})[0]; }
await check('regular BC cannot claim official permission or enumerate/register admin emails', async()=>{
 await login(bc,'bc@example.test');
 assert.equal(await scalar('select beauty_voice_can_reply_official()'),false);
 await rejected("select * from admin_users");
 await rejected("insert into admin_users values ('bc@example.test')");
});
await check('regular anonymous insert works; writer is canonical; status stays unchanged',async()=>{
 await db.exec(`insert into beauty_voice_comments(post_id,user_id,content,writer) values(1,'${bc}','anonymous','Private Google Name')`);
 assert.equal(await scalar('select writer from beauty_voice_comments'),'익명 BC');
 assert.equal(await scalar('select status from beauty_voice_posts where id=1'),'접수');
});
await check('forged official insert and another user ID are rejected',async()=>{
 await rejected(`insert into beauty_voice_comments(post_id,user_id,is_admin) values(1,'${bc}',true)`);
 await rejected(`insert into beauty_voice_comments(post_id,user_id) values(1,'${admin}')`);
});
await check('anonymous comment edit/delete preserved; type/author/post cannot be changed',async()=>{
 await db.exec("update beauty_voice_comments set content='edited'");
 assert.equal(await scalar('select content from beauty_voice_comments'),'edited');
 await rejected('update beauty_voice_comments set is_admin=true');
 await rejected('update beauty_voice_comments set post_id=3');
 await rejected(`update beauty_voice_comments set user_id='${admin}'`);
});
await check('hidden post replies cannot be read or inserted',async()=>{
 await rejected(`insert into beauty_voice_comments(post_id,user_id) values(2,'${bc}')`);
 await login(admin,'ADMIN@example.test');
 await db.exec(`insert into beauty_voice_comments(post_id,user_id,is_admin,content) values(2,'${admin}',true,'private reply')`);
 await login(bc,'bc@example.test');
 assert.equal(await scalar('select count(*)::int from beauty_voice_comments where post_id=2'),0);
});
await check('admin can post anonymously without status change',async()=>{
 await login(admin,'ADMIN@example.test');
 assert.equal(await scalar('select beauty_voice_can_reply_official()'),true);
 await db.exec(`insert into beauty_voice_comments(post_id,user_id,writer,is_admin) values(1,'${admin}','private@example.test',false)`);
 assert.equal(await scalar(`select writer from beauty_voice_comments where user_id='${admin}' and post_id=1`),'익명 BC');
 assert.equal(await scalar('select status from beauty_voice_posts where id=1'),'접수');
});
await check('admin official reply updates status atomically; anonymous cannot be promoted',async()=>{
 await rejected(`update beauty_voice_comments set is_admin=true where user_id='${admin}' and post_id=1`);
 await db.exec(`insert into beauty_voice_comments(post_id,user_id,writer,is_admin) values(1,'${admin}','private@example.test',true)`);
 assert.equal(await scalar('select status from beauty_voice_posts where id=1'),'답변완료');
 assert.equal(await scalar('select writer from beauty_voice_comments where post_id=1 and is_admin'),'운영진 · 조직문화팀');
 await rejected('update beauty_voice_comments set is_admin=false where post_id=1 and is_admin');
 await db.exec("update beauty_voice_comments set content='official edit' where post_id=1 and is_admin");
});
await check('non-owner cannot modify/delete official reply',async()=>{
 await login(bc,'bc@example.test');
 await db.exec("update beauty_voice_comments set content='forged' where is_admin; delete from beauty_voice_comments where is_admin;");
 assert.equal(await scalar('select content from beauty_voice_comments where post_id=1 and is_admin'),'official edit');
});
await check('revoked admin with old JWT cannot post/edit/delete official reply',async()=>{
 await db.exec("reset role; delete from admin_users;");
 await login(admin,'ADMIN@example.test');
 assert.equal(await scalar('select beauty_voice_can_reply_official()'),false);
 await rejected(`insert into beauty_voice_comments(post_id,user_id,is_admin) values(1,'${admin}',true)`);
 await db.exec("update beauty_voice_comments set content='forged' where is_admin; delete from beauty_voice_comments where is_admin;");
 assert.equal(await scalar('select content from beauty_voice_comments where post_id=1 and is_admin'),'official edit');
 await db.exec("reset role; insert into admin_users values ('admin@example.test');");
});
await check('changed/unverified auth email cannot use an old authorized JWT email',async()=>{
 await db.exec(`update auth.users set email='changed@example.test' where id='${admin}';`);
 await login(admin,'ADMIN@example.test');
 assert.equal(await scalar('select beauty_voice_can_reply_official()'),false);
 await db.exec(`reset role; update auth.users set email='admin@example.test',email_confirmed_at=null where id='${admin}';`);
 await login(admin,'ADMIN@example.test');
 assert.equal(await scalar('select beauty_voice_can_reply_official()'),false);
 await db.exec(`reset role; update auth.users set email_confirmed_at=now() where id='${admin}';`);
});
await check('legacy official fields protected while anonymous insert/read receipt still work',async()=>{
 await login('','','anon');
 await db.exec('insert into voices(id) values(2); update voices set reply_seen=true where id=1;');
 await rejected("update voices set admin_reply='forged' where id=1");
 await rejected("insert into voices(id,admin_reply) values(3,'forged')");
 await login(admin,'admin@example.test');
 await db.exec("update voices set admin_reply='official' where id=1");
});
await check('own anonymous delete and post cascade deletion still work',async()=>{
 await login(bc,'bc@example.test');
 await db.exec(`delete from beauty_voice_comments where user_id='${bc}'; delete from beauty_voice_posts where id=1;`);
 assert.equal(await scalar('select count(*)::int from beauty_voice_comments where post_id=1'),0);
});
await check('no permissive policies were replaced or broadened',async()=>{
 await db.exec('reset role');
 assert.equal(await scalar("select count(*)::int from pg_policies where tablename='beauty_voice_comments' and permissive='PERMISSIVE'"),4);
});
await db.close();
console.log(`${count} database security scenarios passed (isolated PostgreSQL engine).`);
