import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { insightImages, validateInsightImages } from '../src/components/insight/insightModel.js';
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite');
const db = new PGlite();
await db.exec(`create role anon; create role authenticated;
 create table bc_insights(id int generated always as identity primary key,title text,content text,month text,image_url text,created_at timestamptz default now(),updated_at timestamptz default now());
 insert into bc_insights(title,image_url) values('legacy','https://example.test/old.png');
 alter table bc_insights enable row level security;
 grant select,insert,update,delete on bc_insights to authenticated;
 grant usage on sequence bc_insights_id_seq to authenticated;
 create policy read_members on bc_insights for select to authenticated using(current_setting('test.active',true)='true');
 create policy write_admin on bc_insights for all to authenticated using(current_setting('test.admin',true)='true' and current_setting('test.active',true)='true') with check(current_setting('test.admin',true)='true' and current_setting('test.active',true)='true');`);
const sql = await readFile(new URL('../supabase/migrations/20261111_store_insight_gallery.sql',import.meta.url),'utf8');
await db.exec(sql); await db.exec(sql);
let n=0;
const test=async(name,fn)=>{await fn();console.log(`PASS ${++n}: ${name}`);};
const query=async sql=>(await db.query(sql)).rows;
await test('rerunnable migration preserves legacy photo and unassigned store',async()=>{
 const row=(await query('select * from bc_insights'))[0]; assert.equal(row.store_id,null); assert.deepEqual(row.image_urls,['https://example.test/old.png']);
});
await db.exec("set role authenticated; set test.active='true'; set test.admin='true';");
await test('admin can save three photos and body; cover follows first photo',async()=>{
 const rows=await query("insert into bc_insights(title,content,store_id,image_urls) values('new','body','seongsu',array['a','b','c']) returning *");
 assert.equal(rows[0].image_url,'a'); assert.equal(rows[0].content,'body');
});
await test('four photos, unknown store, missing store and null image rejected',async()=>{
 for(const values of ["'seongsu',array['a','b','c','d']","'fake',array['a']","null,array['a']","'seongsu',array[null]::text[]"])
 await assert.rejects(db.exec(`insert into bc_insights(store_id,image_urls) values(${values})`),e=>e.code==='23514');
});
await test('editing legacy retains picture and removing all clears legacy cover',async()=>{
 await db.exec("update bc_insights set store_id='beauty_mansion' where title='legacy'");
 assert.equal((await query("select image_url from bc_insights where title='legacy'"))[0].image_url,'https://example.test/old.png');
 await db.exec("update bc_insights set image_urls='{}' where title='new'");
 assert.equal((await query("select image_url from bc_insights where title='new'"))[0].image_url,'');
});
await test('BC can read but cannot insert or edit; inactive account cannot read',async()=>{
 await db.exec("set test.admin='false'");
 assert.equal((await query('select * from bc_insights')).length,2);
 await assert.rejects(db.exec("insert into bc_insights(store_id) values('seongsu')"),e=>e.code==='42501');
 assert.equal((await query("update bc_insights set title='attack' returning id")).length,0);
 await db.exec("set test.active='false'");assert.equal((await query('select * from bc_insights')).length,0);
});
await test('UI preserves old image and enforces combined photo count, type and size',()=>{
 assert.deepEqual(insightImages({image_url:'old'}),['old']);
 assert.deepEqual(insightImages({image_url:'old',image_urls:['new','second']}),['new','second']);
 const file={type:'image/png',size:100};
 assert.equal(validateInsightImages([{}],[file,file]),'');
 assert.ok(validateInsightImages([{},{}],[file,file]));
 assert.ok(validateInsightImages([],[{...file,type:'text/html'}]));
 assert.ok(validateInsightImages([],[{...file,size:11*1024*1024}]));
});
await db.close();
