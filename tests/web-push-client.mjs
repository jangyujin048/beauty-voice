import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
let source=await readFile(new URL('../src/services/pushService.js',import.meta.url),'utf8');
source=source.replace("import supabase from '../api/supabase';",'').replace('import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY', 'PUBLIC_KEY').replace(/export /g,'');
source+='\nglobalThis.api={savePush,disablePush,pushStatus,PUSH_OWNER};';
let sub=null,unsubscribed=0,permission='granted',saved=false,failDelete=false;const operations=[];
const key=Buffer.alloc(65,1);const memory=new Map();
const registration={pushManager:{getSubscription:async()=>sub,subscribe:async options=>{
 sub={endpoint:'https://fcm.googleapis.com/x',options, toJSON:()=>({keys:{p256dh:'B'.repeat(87),auth:'A'.repeat(22)}}),unsubscribe:async()=>{operations.push('unsubscribe');unsubscribed++;sub=null;return true;}};return sub;
}},getNotifications:async()=>[{close(){operations.push('close');}}]};
const rpc=async(name)=>{
 if(name==='bv_push_subscribe'){await new Promise(r=>setTimeout(r,10));operations.push('enroll');saved=true;return {data:'id'};}
 if(name==='bv_push_unsubscribe'){if(failDelete)return {error:1};operations.push('remove');saved=false;return {};}
 if(name==='bv_push_status')return {data:saved?[{notices:true,replies:true,missions:true,insights:true}]:[]};
};
const context=vm.createContext({PUBLIC_KEY:key.toString('base64url'),supabase:{rpc,auth:{getUser:async()=>({data:{user:{id:'alice'}}})}},
 window:{isSecureContext:true,PushManager:{},Notification:{},dispatchEvent(){}},
 navigator:{serviceWorker:{getRegistration:async()=>registration,register:async()=>registration,ready:Promise.resolve(registration)}},
 Notification:{requestPermission:async()=>permission},localStorage:{getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k)},atob,Uint8Array,Event,console});
vm.runInContext(source,context);const {api}=context;
const preferences={notices:true,replies:true,missions:true,insights:true};
permission='denied';await assert.rejects(api.savePush('alice',preferences));assert.equal(sub,null);
permission='granted';await api.savePush('alice',preferences);assert.equal(saved,true);assert.equal(memory.get(api.PUSH_OWNER),'alice');
failDelete=true;await assert.rejects(api.disablePush());assert.ok(sub,'server failure keeps endpoint available to retry');
failDelete=false;await api.disablePush();assert.equal(sub,null);assert.equal(saved,false);
operations.length=0;
const saving=api.savePush('alice',preferences);const logout=api.disablePush();await Promise.all([saving,logout]);
assert.deepEqual(operations,['enroll','remove','unsubscribe','close']);assert.equal(saved,false);assert.equal(sub,null);
await assert.rejects(api.savePush('bob',preferences));assert.equal(sub,null);assert.equal(saved,false);
console.log('PASS: explicit permission, subscription registration, disable error recovery, concurrent save/logout ordering and account mismatch');
