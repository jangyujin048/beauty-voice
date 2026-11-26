// Generates local secrets without printing them; files are excluded from Git.
import { createECDH, randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
const ecdh=createECDH('prime256v1'); ecdh.generateKeys();
const pub=ecdh.getPublicKey().toString('base64url');
const priv=ecdh.getPrivateKey().toString('base64url');
const secret=randomBytes(32).toString('hex');
await mkdir('.push-secrets',{recursive:true,mode:0o700});
await writeFile('.push-secrets/edge.env',`WEB_PUSH_PUBLIC_KEY=${pub}\nWEB_PUSH_PRIVATE_KEY=${priv}\nPUSH_WORKER_SECRET=${secret}\nWEB_PUSH_SUBJECT=https://beauty-voice-pi.vercel.app\n`,{mode:0o600,flag:'wx'});
await writeFile('.push-secrets/vercel.env',`VITE_WEB_PUSH_PUBLIC_KEY=${pub}\n`,{mode:0o600,flag:'wx'});
console.log('Created .push-secrets/edge.env and vercel.env. Keep these files private; do not regenerate after deployment.');
