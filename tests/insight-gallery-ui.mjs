// Local-only UI fixture, no production database or account.
import { createServer } from 'vite';
const mock=`
const picture=(color,label)=>'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="500" height="600"><rect width="500" height="600" fill="'+color+'"/><text x="40" y="100" fill="white" font-size="30">'+label+'</text></svg>');
let items=['seongsu','beauty_mansion','gangnam'].map((store,i)=>({id:String(i),store_id:store,month:'2026년 11월',title:'11월 고객 경험 인사이트',content:'매장에서 발견한 고객 경험을 함께 나눕니다.\\n다음 달에도 새로운 시도를 이어가요.',image_urls:[picture('#173f73','INSIGHT '+(i+1)),picture('#357788','PAGE 2'),picture('#6271a4','PAGE 3')],created_at:'2026-11-11T00:00:00Z'}));
items.push({id:'old',title:'이전 매장 미지정 글',month:'2026년 9월',content:'기존 글은 보존됩니다.',image_url:picture('#68809d','LEGACY'),created_at:'2026-09-01T00:00:00Z'});
const uploads=new Map();
const ok=data=>({data,error:null});
export default {
 storage:{from:()=>({getPublicUrl:path=>({data:{publicUrl:uploads.get(path)||'https://fixture.test/storage/v1/object/public/voice-images/'+path}}),upload:async(path,file)=>{uploads.set(path,URL.createObjectURL(file));return ok({path});}})},
 from(){let mode='read',value,id;return {select(){return this;},order(){return this;},eq(k,v){id=v;return this;},insert(v){mode='insert';value=v;return this;},update(v){mode='update';value=v;return this;},delete(){mode='delete';return this;},then(resolve,reject){if(mode==='insert')items.unshift({...value,id:crypto.randomUUID(),created_at:new Date().toISOString()});if(mode==='update')items=items.map(i=>i.id===id?{...i,...value}:i);if(mode==='delete')items=items.filter(i=>i.id!==id);return Promise.resolve(ok([...items])).then(resolve,reject);}};}
};`;
const entry=`
import React,{useState,useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import Insight from '/src/components/insight/Insight.jsx';
import Manager from '/src/components/admin/AdminContentManager.jsx';
import supabase from '/src/api/supabase.js';
import '/src/style.css';
const e=React.createElement;
function Fixture(){const [items,setItems]=useState([]),[selected,setSelected]=useState(null),[admin,setAdmin]=useState(false);
const reload=async()=>{const {data}=await supabase.from('bc_insights').select();setItems(data);};useEffect(()=>{reload();},[]);
return e('main',{style:{padding:20,maxWidth:1400,margin:'auto'}},e('button',{onClick:()=>setAdmin(!admin)},admin?'사용자 화면':'관리자 화면'),admin?e(Manager,{type:'insight',items,onReload:reload}):e(Insight,{insights:items,selectedInsight:selected,setSelectedInsight:setSelected}));}
createRoot(document.getElementById('root')).render(e(Fixture));`;
const server=await createServer({configFile:false,server:{host:'127.0.0.1',port:5174,strictPort:true},plugins:[{
 name:'insight-fixture',enforce:'pre',resolveId(id){if(/\/api\/supabase(?:\.js)?$/.test(id))return '\0insight-mock';if(id==='/insight-entry.js')return '\0insight-entry';},load(id){if(id==='\0insight-mock')return mock;if(id==='\0insight-entry')return entry;},configureServer(s){s.middlewares.use('/__insights',(_req,res)=>{res.setHeader('Content-Type','text/html');res.end('<!doctype html><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>인사이트 로컬 검증</title><div id="root"></div><script type="module" src="/insight-entry.js"></script>');});}
}]});await server.listen();console.log('http://127.0.0.1:5174/__insights');
