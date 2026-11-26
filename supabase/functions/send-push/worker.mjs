export function validEndpoint(endpoint) {
 try {
  const u = new URL(endpoint);
  return u.protocol === 'https:' && !u.username && !u.password && !u.port && !u.hash && (
   u.hostname === 'fcm.googleapis.com' || u.hostname === 'updates.push.services.mozilla.com' ||
   /^[a-z0-9-]+\.push\.apple\.com$/.test(u.hostname));
 } catch { return false; }
}
async function sameSecret(a,b) {
 const digest = async s => new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)));
 const [x,y]=await Promise.all([digest(a),digest(b)]);
 let diff=0; for(let i=0;i<x.length;i++) diff|=x[i]^y[i];
 return diff===0;
}
export function makeHandler({ db, send, secret }) {
 return async request => {
  if(request.method!=='POST') return new Response('Method not allowed',{status:405});
  if(!secret || secret.length<32 || !await sameSecret(request.headers.get('x-push-secret')||'',secret)) {
   return new Response('Unauthorized',{status:401});
  }
  const rpc=async(name,args={})=>{
   const result=await db.rpc(name,args); if(result.error) throw new Error('Database operation failed');
   return result.data;
  };
  try {
   await rpc('bv_push_cleanup');
   const jobs=await rpc('bv_push_claim');
   let sent=0;
   async function deliver(job) {
    const args={p_id:job.id,p_token:job.lease_token};
    const payloads=await rpc('bv_push_payload',args);
    const item=payloads?.[0];
    let result='cancelled';
    if(item && validEndpoint(item.endpoint)) {
     try {
      await send({endpoint:item.endpoint,keys:{p256dh:item.p256dh,auth:item.auth}},
       JSON.stringify({kind:item.kind,id:String(job.id)}),{TTL:300,urgency:'normal',timeout:10000});
      result='sent'; sent++;
     } catch(error) {
      const code=Number(error.statusCode);
      result=code===404 || code===410 ? 'gone' : !code || code===429 || code>=500 ? 'retry' : 'failed';
     }
    }
    await rpc('bv_push_finish',{...args,p_result:result});
   }
   // Keep each invocation bounded; leases recover interrupted workers.
   for(let i=0;i<jobs.length;i+=4) await Promise.all(jobs.slice(i,i+4).map(deliver));
   return Response.json({processed:jobs.length,sent});
  } catch {
   // Do not log device endpoints, encryption keys or content.
   return new Response('Push processing failed; pending jobs will retry',{status:500});
  }
 };
}
