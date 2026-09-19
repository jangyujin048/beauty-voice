// Local UI fixture: real React components, mocked Supabase. No production account/data.
// Run from project root: node tests/store-members-ui.mjs
import { createServer } from 'vite';
const mock = `
let role='admin',authListener,serial=0;
const emails={admin:'admin@example.test',a:'seongsu.bc@example.test',b:'gangnam.bc@example.test',unknown:'not-registered@example.test'};
const session=()=>role==='out'?null:{access_token:role+'-token',user:{id:role+'-id',email:emails[role]}};
window.fixtureSwitchUser=next=>{role=next;authListener?.('SIGNED_IN',session());};
const stores=[{id:'seongsu',name:'올리브영N 성수',sort_order:1},{id:'beauty_mansion',name:'올리브영 뷰티 맨션 성수',sort_order:2},{id:'gangnam',name:'올리브영 센트럴 강남 타운',sort_order:3}];
const now=()=>new Date(Date.now()+(++serial)).toISOString();
let members=[{id:'member-a',email:emails.a,store_id:'seongsu',is_active:true,created_at:now(),updated_at:now()},{id:'member-b',email:emails.b,store_id:'gangnam',is_active:true,created_at:now(),updated_at:now()}];
let missions=[
 {id:'mission-all',title:'전체 매장 미션',description:'모든 등록 구성원이 함께하는 미션입니다.',target_store_ids:[]},
 {id:'mission-a',title:'성수 전용 미션',description:'성수 매장 구성원에게만 공개되는 미션입니다.',target_store_ids:['seongsu']},
 {id:'mission-b',title:'강남 전용 미션',description:'강남 매장 구성원에게만 공개되는 미션입니다.',target_store_ids:['gangnam']}
].map(x=>({...x,prompt:'참여 내용을 남겨주세요.',status:'active',start_date:'2026-09-19',end_date:'2026-09-30',created_at:now(),updated_at:now()}));
let comments=[];
const mine=()=>members.find(m=>m.email===emails[role]);
const allowed=c=>role==='admin'||(mine()?.is_active&&(c.target_store_ids.length===0||c.target_store_ids.includes(mine().store_id)));
const ok=data=>({data:structuredClone(data),error:null});
const denied=()=>({data:null,error:{code:'42501',message:'권한이 없습니다.'}});
export default {
 auth:{getSession:async()=>ok({session:session()}),getUser:async()=>ok({user:session()?.user}),onAuthStateChange:cb=>{authListener=cb;return {data:{subscription:{unsubscribe(){authListener=null;}}}};}},
 rpc:async name=>name==='beauty_voice_can_reply_official'?ok(role==='admin'):name==='beauty_voice_my_membership'?ok(mine()?[{store_id:mine().store_id,store_name:stores.find(s=>s.id===mine().store_id).name,is_active:mine().is_active}]:[]):ok(false),
 from(table){
  let op='read',payload,filters=[],sort,single=false;
  const match=x=>filters.every(([k,v])=>x[k]===v);
  const execute=()=>{
   let rows=[];
   if(table==='beauty_voice_stores'){rows=stores;}
   else if(table==='beauty_voice_members'){
    if(role!=='admin')return op==='read'?ok([]):denied();
    if(op==='insert'){
     if(members.some(m=>m.email===payload.email))return {data:null,error:{code:'23505'}};
     const item={...payload,id:'member-'+(++serial),created_at:now(),updated_at:now()};members.unshift(item);rows=[item];
    }else if(op==='update'){
     rows=members.filter(match).map(m=>Object.assign(m,payload,{updated_at:now()}));
    }else rows=members.filter(match);
   }else if(table==='weekly_challenges'){
    if(op!=='read'&&role!=='admin')return denied();
    if(op==='insert'){
     const item={...payload,id:'mission-'+(++serial),created_at:now(),updated_at:now()};missions.push(item);rows=[item];
    }else if(op==='update'){rows=missions.filter(match).map(m=>Object.assign(m,payload));}
    else if(op==='delete'){rows=missions.filter(match);missions=missions.filter(m=>!match(m));}
    else rows=missions.filter(m=>allowed(m)&&match(m));
    rows=rows.map(m=>({...m,weekly_challenge_comments:[{count:comments.filter(c=>c.challenge_id===m.id).length}]}));
   }else if(table==='weekly_challenge_comments'){
    if(op==='insert'){
     if(!missions.some(m=>m.id===payload.challenge_id&&allowed(m)))return denied();
     const item={...payload,id:'comment-'+(++serial),created_at:now(),updated_at:now()};comments.push(item);rows=[item];
    }else rows=comments.filter(c=>match(c)&&missions.some(m=>m.id===c.challenge_id&&allowed(m)));
   }else if(table==='user_profiles'){rows=[{user_id:session()?.user.id,nickname:'테스트 BC'}];}
   if(sort){rows=[...rows].sort((a,b)=>String(a[sort.key]).localeCompare(String(b[sort.key]))*(sort.asc?1:-1));}
   if(single&&rows.length!==1)return {data:null,error:{code:'PGRST116'}};
   return ok(single?rows[0]:rows);
  };
  return {select(){return this;},insert(value){op='insert';payload=Array.isArray(value)?value[0]:value;return this;},update(value){op='update';payload=value;return this;},delete(){op='delete';return this;},eq(k,v){filters.push([k,v]);return this;},order(key,options){sort={key,asc:options.ascending};return this;},single(){single=true;return Promise.resolve(execute());},maybeSingle(){single=true;return Promise.resolve(execute());},then(resolve,reject){return Promise.resolve(execute()).then(resolve,reject);}};
 }
};`;
const entry=`
import React,{useState,useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import {AuthProvider,useAuth} from '/src/contexts/AuthContext.jsx';
import MemberManager from '/src/components/members/MemberManager.jsx';
import AdminChallengeManager from '/src/components/admin/AdminChallengeManager.jsx';
import WeeklyChallenge from '/src/components/challenge/WeeklyChallenge.jsx';
import '/src/style.css';
const e=React.createElement;
window.alert=message=>window.dispatchEvent(new CustomEvent('fixture-alert',{detail:message}));
function Fixture(){
 const {user}=useAuth();const [view,setView]=useState(new URLSearchParams(location.search).get('view')||'members');
 const [notice,setNotice]=useState('');useEffect(()=>{const fn=e=>setNotice(e.detail);window.addEventListener('fixture-alert',fn);return()=>window.removeEventListener('fixture-alert',fn);},[]);
 const views={members:MemberManager,admin:AdminChallengeManager,missions:WeeklyChallenge};
 return e(React.Fragment,null,
  e('nav',{style:{display:'flex',flexWrap:'wrap',gap:8,padding:12}},
   ...[['admin','운영진 계정'],['a','일반 BC A'],['b','일반 BC B'],['unknown','미등록 계정'],['out','로그아웃']].map(([id,label])=>e('button',{key:id,onClick:()=>window.fixtureSwitchUser(id)},label)),
   ...[['members','구성원 화면'],['admin','미션관리 화면'],['missions','BC 미션 화면']].map(([id,label])=>e('button',{key:'view-'+id,onClick:()=>setView(id)},label))),
  notice?e('p',{role:'status'},notice):null,
  e('main',{style:{maxWidth:1100,margin:'auto',padding:16}},e(views[view],{key:(user?.id||'guest')+view})));
}
createRoot(document.getElementById('root')).render(e(AuthProvider,null,e(Fixture)));
`;
const server=await createServer({configFile:false,server:{host:'127.0.0.1',port:5174,strictPort:true},plugins:[{
 name:'member-fixture',enforce:'pre',
 resolveId(id){if(/\/api\/supabase(?:\.js)?$/.test(id))return '\0member-mock';if(id==='/member-entry.js')return '\0member-entry.js';},
 load(id){if(id==='\0member-mock')return mock;if(id==='\0member-entry.js')return entry;},
 configureServer(s){s.middlewares.use('/__members',(_req,res)=>{res.setHeader('Content-Type','text/html');res.end('<!doctype html><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>구성원·미션 테스트</title><div id="root"></div><script type="module" src="/member-entry.js"></script>');});}
}]});
await server.listen();console.log('Local test UI: http://127.0.0.1:5174/__members');
