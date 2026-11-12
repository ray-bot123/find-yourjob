import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createPayPalHandler} from '../paypal.mjs';
test('subscription binding survives restart and reset revokes it',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'fyj-'));
 try {
 const options={sessionFile:join(dir,'sessions.json'),loadConfig:async()=>({client_id:'test',client_secret:'test',plan_id:'P-TEST'}),fetchApi:async(url)=>Response.json(url.endsWith('/token')?{access_token:'test'}:url.endsWith('/subscriptions')?{id:'I-TEST',links:[{rel:'approve',href:'https://www.sandbox.paypal.com/approve'}]}:{id:'I-TEST',plan_id:'P-TEST',status:'ACTIVE'})};
 let handler=createPayPalHandler(options);
 async function call(path,method='GET',cookie=''){let out={};await handler({method,headers:{host:'localhost:4175',origin:'http://localhost:4175',cookie}},{setHeader:(k,v)=>out[k]=v,writeHead:(code,headers)=>Object.assign(out,{code,...headers}),end:body=>out.body=JSON.parse(body)},'/api/paypal/'+path);return out;}
 const start=await call('start','POST');assert.equal(start.code,200);const cookie=start['Set-Cookie'].split(';')[0];
 handler=createPayPalHandler(options);
 assert.equal((await call('status','GET',cookie)).body.active,true);
 await call('reset','POST',cookie);handler=createPayPalHandler(options);
 assert.equal((await call('status','GET',cookie)).body.active,false);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
