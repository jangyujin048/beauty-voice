import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
const source = await readFile(new URL('../src/services/commentService.js',import.meta.url),'utf8');
let state;
const client={auth:{getUser:async()=>({data:{user:state.user},error:null})},
 rpc:async()=>{state.rpcCalls++;return {data:state.allowed,error:state.rpcError};},
 from:()=>({insert(rows){state.payload=rows[0];return this;},select(){return this;},single:async()=>({data:state.payload,error:null})})};
const context=vm.createContext({});
const stub=new vm.SyntheticModule(['default'],function(){this.setExport('default',client);},{context});
const module=new vm.SourceTextModule(source,{context});
await module.link(()=>stub);await module.evaluate();
const create=module.namespace.createComment;
const reset=()=>{state={user:{id:'verified-user'},allowed:false,rpcError:null,rpcCalls:0,payload:null};};
let count=0;
async function test(name,fn){reset();await fn();console.log(`PASS ${++count}: ${name}`);}
await test('anonymous writes ignore caller supplied identity/name',async()=>{
 await create({postId:1,content:'  hello  ',userId:'forged',writer:'Google Name'});
 assert.equal(state.payload.user_id,'verified-user');assert.equal(state.payload.writer,'익명 BC');
 assert.equal(state.payload.is_admin,false);assert.equal(state.payload.content,'hello');assert.equal(state.rpcCalls,0);
});
await test('authorized official reply uses canonical writer',async()=>{
 state.allowed=true;await create({postId:1,content:'official',isAdmin:true});
 assert.equal(state.payload.writer,'운영진 · 조직문화팀');assert.equal(state.payload.is_admin,true);
});
await test('BC cannot request official via service',async()=>{
 await assert.rejects(create({postId:1,content:'fake',isAdmin:true}));assert.equal(state.payload,null);
});
await test('RPC error fails closed',async()=>{
 state.allowed=true;state.rpcError={message:'offline'};
 await assert.rejects(create({postId:1,content:'fake',isAdmin:true}));assert.equal(state.payload,null);
});
await test('missing authenticated user rejects even with caller ID',async()=>{
 state.user=null;await assert.rejects(create({postId:1,content:'fake',userId:'forged'}));assert.equal(state.payload,null);
});
await test('string booleans never opt into official reply',async()=>{
 await create({postId:1,content:'anon',isAdmin:'false'});assert.equal(state.payload.is_admin,false);
});
await test('blank comment rejected before persistence',async()=>{
 await assert.rejects(create({postId:1,content:'  '}));assert.equal(state.payload,null);
});
console.log(`${count} service scenarios passed.`);
