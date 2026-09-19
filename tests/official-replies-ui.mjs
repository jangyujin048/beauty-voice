// Real components + AuthProvider, mocked Supabase only. No production network traffic.
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { mkdir } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const mock = `
let role = 'bc', callback, seq = 0;
const ids = {bc:'bc-id',admin:'admin-id'};
const makeSession = () => role === 'out' ? null : ({access_token:role+'-token',user:{id:ids[role],email:role+'@private.test',user_metadata:{full_name:'PRIVATE GOOGLE NAME'}}});
window.testState = {comments:[],writes:[],rpcError:false,rpcDelay:0};
window.switchUser = (next) => {role=next;callback?.('SIGNED_IN',makeSession());};
window.revokeAdmin = () => { window.testState.rpcError=true; };
const post={id:1,user_id:'bc-id',category:'질문',title:'댓글 기능 검증',content:'기존 익명 댓글과 공식 답변을 확인합니다.',store:'매장',status:'접수',created_at:'2026-09-19T00:00:00Z'};
window.fixturePost=post;
export default {
 auth:{
  getSession:async()=>({data:{session:makeSession()},error:null}),
  getUser:async()=>({data:{user:makeSession()?.user},error:null}),
  onAuthStateChange:(cb)=>{callback=cb;return {data:{subscription:{unsubscribe(){callback=null;}}}};}
 },
 rpc:async()=>{
   const allowed=role==='admin',delay=window.testState.rpcDelay;
   await new Promise(r=>setTimeout(r,delay));
   return {data:allowed,error:window.testState.rpcError?new Error('offline'):null};
 },
 from:(table)=>{
  let operation='read',payload,filters=[];
  const builder={
   select(){return this;},eq(k,v){filters.push([k,v]);return this;},order(){return this;},
   insert(value){operation='insert';payload=value[0];return this;},
   update(value){operation='update';payload=value;return this;},delete(){operation='delete';return this;},
   single(){return this.then(r=>({...r,data:Array.isArray(r.data)?r.data[0]:r.data}));},
   then(resolve,reject){
    const matches=x=>filters.every(([k,v])=>x[k]===v);
    let data;
    if(table==='beauty_voice_comments') {
     if(operation==='insert') {
      const item={...payload,id:'c'+(++seq),created_at:'2026-09-19T01:00:00Z'};
      window.testState.comments.push(item);window.testState.writes.push(item);data=[item];
     } else if(operation==='update') {
      data=window.testState.comments.filter(matches).map(x=>Object.assign(x,payload));
     } else if(operation==='delete') {
      window.testState.comments=window.testState.comments.filter(x=>!matches(x));data=[];
     } else data=window.testState.comments.filter(matches);
    } else data=[post];
    return Promise.resolve({data,error:null}).then(resolve,reject);
   }
  };return builder;
 }
};`;
const entry = `
import React from 'react';
import {createRoot} from 'react-dom/client';
import {AuthProvider} from '/src/contexts/AuthContext.jsx';
import BoardDetail from '/src/components/board/BoardDetail.jsx';
import AdminBoardPosts from '/src/components/admin/AdminBoardPosts.jsx';
import '/src/style.css';
const adminView=new URLSearchParams(location.search).has('admin');
const e=React.createElement;
createRoot(document.getElementById('root')).render(
 e(React.Fragment,null,
  e('nav', {style:{display:'flex',gap:8,flexWrap:'wrap'}},
   e('button',{onClick:()=>window.switchUser('bc')},'TEST BC'),
   e('button',{onClick:()=>window.switchUser('admin')},'TEST ADMIN'),
   e('button',{onClick:()=>window.switchUser('out')},'TEST LOGOUT'),
   e('button',{onClick:()=>window.revokeAdmin()},'TEST REVOKE')),
  e(AuthProvider,null,e('main',{style:{maxWidth:1000,margin:'auto',padding:16}},
   adminView?e(AdminBoardPosts):e(BoardDetail,{post:window.fixturePost})))
 )
);
`;
const server = await createServer({
 configFile:false,server:{host:'127.0.0.1',port:0},
 plugins:[{name:'official-reply-test', enforce:'pre',
 resolveId(id){if(/\/api\/supabase(?:\.js)?$/.test(id))return '\0mock-db';if(id==='/test-entry.jsx')return '\0test-entry.jsx';},
 load(id){if(id==='\0mock-db')return mock;if(id==='\0test-entry.jsx')return entry;},
 configureServer(s){s.middlewares.use('/__test',(_req,res)=>{res.setHeader('Content-Type','text/html');res.end('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><div id="root"></div><script type="module" src="/test-entry.jsx"></script>');});}
 }]
});
let browser;
try {
 await server.listen();
 const port=server.httpServer.address().port;
 if(process.env.UI_SERVE_ONLY) { console.log(`UI fixture ready: http://127.0.0.1:${port}/__test`); await new Promise(()=>{}); }
 browser=await chromium.launch({headless:true, ...(process.env.CHROME_EXECUTABLE ? {executablePath:process.env.CHROME_EXECUTABLE} : {})});
 const page=await browser.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('dialog',dialog=>dialog.accept());
 await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
 const url=`http://127.0.0.1:${port}/__test`;
 let count=0;
 const pass=name=>console.log('PASS '+(++count)+': '+name);
 await page.goto(url);
 await page.getByRole('button',{name:'댓글 등록',exact:true}).waitFor();
 assert.equal(await page.getByRole('button',{name:'운영진으로 답변',exact:true}).count(),0);
 await page.locator('#board-comment').fill('일반 BC 익명 댓글');
 await page.getByRole('button',{name:'댓글 등록',exact:true}).click();
 await page.getByText('일반 BC 익명 댓글',{exact:true}).waitFor();
 assert.equal(await page.evaluate(()=>testState.writes.at(-1).is_admin),false);
 pass('BC only sees anonymous action and posts anonymously');
 await page.evaluate(()=>switchUser('admin'));
 await page.getByRole('button',{name:'운영진으로 답변',exact:true}).waitFor();
 await page.locator('#board-comment').fill('운영진의 익명 댓글');
 await page.getByRole('button',{name:'댓글 등록',exact:true}).click();
 await page.getByText('운영진의 익명 댓글',{exact:true}).waitFor();
 let item=await page.evaluate(()=>testState.writes.at(-1));
 assert.equal(item.is_admin,false);assert.equal(item.writer,'익명 BC');assert.equal(item.user_id,'admin-id');
 assert.equal(await page.getByText('운영진 · 조직문화팀',{exact:true}).count(),0);
 pass('admin normal submit stays anonymous');
 await page.locator('#board-comment').fill('공식 답변 테스트');
 await page.getByRole('button',{name:'운영진으로 답변',exact:true}).click();
 await page.getByText('공식 답변 테스트',{exact:true}).waitFor();
 item=await page.evaluate(()=>testState.writes.at(-1));assert.equal(item.is_admin,true);assert.equal(item.writer,'운영진 · 조직문화팀');
 await page.getByText('운영진 · 조직문화팀',{exact:true}).waitFor();
 assert.equal(await page.getByText('답변완료',{exact:true}).count(),1);
 assert.ok(!(await page.locator('main').innerText()).includes('PRIVATE GOOGLE NAME'));
 assert.ok(!(await page.locator('main').innerText()).includes('@private.test'));
 pass('official action uses fixed team name without Google identity');
 // Actual edit flow preserves official bit.
 const officialCard=page.locator('article').filter({has:page.getByText('공식 답변 테스트',{exact:true})});
 await officialCard.getByRole('button',{name:'댓글 메뉴'}).click();
 await officialCard.getByRole('button',{name:'수정',exact:true}).click();
 await officialCard.locator('textarea').fill('공식 답변 수정');
 await officialCard.getByRole('button',{name:'저장',exact:true}).click();
 await page.getByText('공식 답변 수정',{exact:true}).waitFor();
 assert.equal(await page.evaluate(()=>testState.comments.at(-1).is_admin),true);
 pass('comment edit preserves reply type');
 const out=process.env.UI_SCREENSHOT_DIR;
 if(out)await mkdir(out,{recursive:true});
 for(const width of [390,1280]) {
  await page.setViewportSize({width,height:900});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  for(const label of ['댓글 등록','운영진으로 답변']) {
   const box=await page.getByRole('button',{name:label,exact:true}).boundingBox();
   assert.ok(box.x>=0&&box.x+box.width<=width);
  }
  if(out)await page.screenshot({path:out+'/board-'+width+'.png',fullPage:true});
 }
 pass('390px mobile and 1280px desktop fit both actions without horizontal overflow');
 await page.evaluate(()=>revokeAdmin());
 await page.locator('#board-comment').fill('거부되어야 함');
 await page.getByRole('button',{name:'운영진으로 답변',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('#board-comment')?.disabled===false);
 assert.equal(await page.evaluate(()=>testState.writes.length),3);
 pass('service rechecks official permission and fails closed');
 await page.evaluate(()=>switchUser('bc'));
 await page.getByRole('button',{name:'운영진으로 답변',exact:true}).waitFor({state:'hidden'});
 // Late response for admin must not re-enable the button for a different account.
 await page.evaluate(()=>{testState.rpcError=false;testState.rpcDelay=150;switchUser('admin');});
 await page.waitForTimeout(40);
 await page.evaluate(()=>switchUser('bc'));
 await page.waitForTimeout(220);
 assert.equal(await page.getByRole('button',{name:'운영진으로 답변',exact:true}).count(),0);
 pass('account switch ignores stale admin permission responses');
 await page.evaluate(()=>switchUser('out'));
 await page.getByText('로그인 후 댓글을 작성할 수 있습니다.',{exact:true}).waitFor();
 pass('logout removes comment composer');
 await page.goto(url+'?admin=1');
 await page.getByRole('button',{name:/댓글 기능 검증/}).click();
 await page.getByRole('button',{name:'익명 답변 등록',exact:true}).waitFor();
 assert.equal(await page.getByRole('button',{name:'운영진으로 답변',exact:true}).count(),0);
 await page.evaluate(()=>switchUser('admin'));
 await page.getByRole('button',{name:'운영진으로 답변',exact:true}).waitFor();
 await page.locator('textarea').fill('관리 화면 공식 답변');
 await page.getByRole('button',{name:'운영진으로 답변',exact:true}).click();
 await page.getByText('관리 화면 공식 답변',{exact:true}).waitFor();
 assert.equal(await page.getByText('운영진 · 조직문화팀',{exact:true}).count(),1);
 for(const width of [390,1280]){
  await page.setViewportSize({width,height:900});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  if(out)await page.screenshot({path:out+'/admin-'+width+'.png',fullPage:true});
 }
 pass('management view gates official action, displays fixed label and fits mobile/desktop');
 assert.deepEqual(errors,[]);
 console.log(count+' browser scenarios passed.');
} finally {await browser?.close();await server.close();}
