import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
let state;
const client={auth:{getUser:async()=>({data:{user:state.user},error:null}),getSession:async()=>({data:{session:{user:state.user}},error:null})},rpc:async()=>({data:[],error:null}),from(table){
 const call={table,filters:[]};state.calls.push(call);
 return {insert(payload){call.op='insert';call.payload=payload;return this;},update(payload){call.op='update';call.payload=payload;return this;},delete(){call.op='delete';return this;},select(fields){call.fields=fields;return this;},eq(k,v){call.filters.push([k,v]);return this;},order(){return this;},single(){return Promise.resolve({data:call.payload,error:state.error});},then(resolve){return Promise.resolve({data:[],error:state.error}).then(resolve);}};}};
async function moduleFor(path){const context=vm.createContext({console});const stub=new vm.SyntheticModule(['default'],function(){this.setExport('default',client);},{context});const mod=new vm.SourceTextModule(await readFile(new URL(path,import.meta.url),'utf8'),{context});await mod.link(()=>stub);await mod.evaluate();return mod.namespace;}
const members=await moduleFor('../src/services/memberService.js');
const missions=await moduleFor('../src/services/challengeService.js');
let n=0;
async function test(name,fn){state={calls:[],user:{id:'verified'},error:null};await fn();console.log(`PASS ${++n}: ${name}`);}
await test('member registration normalizes email and never sends a privileged role',async()=>{
 await members.createMember({email:' A@Example.Test ',storeId:'seongsu'});
 const x=state.calls[0].payload;assert.equal(x.email,'a@example.test');assert.equal(x.is_active,true);assert.equal(x.store_id,'seongsu');assert.equal(x.is_admin,undefined);
});
await test('bad email or no store rejected before network',async()=>{
 await assert.rejects(members.createMember({email:'bad',storeId:'seongsu'}));
 await assert.rejects(members.createMember({email:'a@example.test',storeId:''}));assert.equal(state.calls.length,0);
});
await test('duplicate email gets actionable error',async()=>{
 state.error={code:'23505'};await assert.rejects(members.createMember({email:'a@example.test',storeId:'seongsu'}),/이미 등록된/);
});
await test('member changes use optimistic version and cannot change email',async()=>{
 await members.updateMember({id:'m1',updated_at:'version'},{storeId:'gangnam',isActive:false});
 const x=state.calls[0];assert.equal(x.payload.is_active,false);assert.equal(x.payload.email,undefined);assert.equal(JSON.stringify(x.filters),'[["id","m1"],["updated_at","version"]]');
});
await test('stale row update prompts refresh',async()=>{
 state.error={code:'PGRST116'};await assert.rejects(members.updateMember({id:'m1',updated_at:'old'},{storeId:'gangnam',isActive:true}),/새로고침/);
});
await test('new active mission targets multiple stores without closing other missions',async()=>{
 await missions.createWeeklyChallenge({title:'a',description:'b',startDate:'2026-09-19',endDate:'2026-09-30',targetStoreIds:['seongsu','gangnam','seongsu']});
 assert.equal(state.calls.length,1);const x=state.calls[0];assert.equal(x.op,'insert');assert.equal(JSON.stringify(x.payload[0].target_store_ids),'["seongsu","gangnam"]');
});
await test('whole-store audience is explicit empty array',async()=>{
 await missions.createWeeklyChallenge({title:'a',description:'b',startDate:'2026-09-19',endDate:'2026-09-30'});assert.equal(JSON.stringify(state.calls[0].payload[0].target_store_ids),'[]');
});
await test('reopen updates only selected mission and preserves audience',async()=>{
 await missions.reopenWeeklyChallenge('mission-1');assert.equal(state.calls.length,1);assert.equal(JSON.stringify(state.calls[0].filters),'[["id","mission-1"]]');assert.equal(state.calls[0].payload.target_store_ids,undefined);
});
await test('participation identity comes from auth, keeps chosen anonymous/nickname writer',async()=>{
 await missions.createChallengeComment({challengeId:'m1',content:'hello',userId:'forged',writer:'익명 BC'});assert.equal(state.calls[0].payload[0].user_id,'verified');assert.equal(state.calls[0].payload[0].writer,'익명 BC');
});
await test('delete does not silently succeed when RLS hides the row',async()=>{
 state.error={code:'PGRST116'};await assert.rejects(missions.deleteChallengeComment('c1'));assert.equal(state.calls[0].fields,'id');
});
console.log(`${n} member/mission service scenarios passed.`);
