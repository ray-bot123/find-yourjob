import test from 'node:test';
import assert from 'node:assert/strict';
import {createPayPalHandler} from '../paypal.mjs';

test('hosted association survives complete state loss but still checks provider and signature', async()=>{
 const previous=process.env.FYJ_PUBLIC_ORIGIN;
 process.env.FYJ_PUBLIC_ORIGIN='https://example.test';
 try {
  let status='ACTIVE',plan='P-TEST',creates=0;
  const config={client_id:'fixture',client_secret:'fixture-secret',plan_id:'P-TEST'};
  const options={loadConfig:async()=>config,fetchApi:async(url,opts)=>{
   if(url.endsWith('/token'))return Response.json({access_token:'fixture'});
   if(opts.method==='POST'){creates++;return Response.json({id:'I-TEST',links:[{rel:'approve',href:'https://www.sandbox.paypal.com/approve'}]});}
   return Response.json({id:'I-TEST',plan_id:plan,status,links:[{rel:'approve',href:'https://www.sandbox.paypal.com/approve'}]});
  }};
  let handler=createPayPalHandler(options);
  async function call(path,cookie='',method='GET') {
   const out={};
   await handler({method,headers:{host:'example.test',origin:'https://example.test',cookie}},
    {setHeader:(k,v)=>out[k]=v,writeHead:(code,headers)=>Object.assign(out,{code,...headers}),end:body=>out.body=JSON.parse(body)},'/api/paypal/'+path);
   return out;
  }
  const start=await call('start','','POST');assert.equal(start.code,200);
  assert.match(start['Set-Cookie'],/HttpOnly.*Secure/);
  const cookie=start['Set-Cookie'].split(';')[0];
  handler=createPayPalHandler(options);
  assert.equal((await call('status',cookie)).body.active,true);
  assert.equal((await call('status',cookie+'x')).body.active,false);
  assert.equal((await call('status',cookie.split('.')[0])).body.active,false);
  assert.equal((await call('start',cookie,'POST')).code,409);assert.equal(creates,1);
  status='CANCELLED';assert.equal((await call('status',cookie)).body.active,false);
  status='ACTIVE';plan='P-OTHER';assert.equal((await call('status',cookie)).body.active,false);plan='P-TEST';
  handler=createPayPalHandler(options);
  assert.equal((await call('status',cookie+'x')).body.active,false);
  assert.equal((await call('status')).body.active,false);
  handler=createPayPalHandler(options);status='APPROVAL_PENDING';
  assert.equal((await call('start',cookie,'POST')).body.approval,'https://www.sandbox.paypal.com/approve');assert.equal(creates,1);
  await call('reset',cookie,'POST');assert.equal((await call('status',cookie)).body.active,false);
  handler=createPayPalHandler({...options,loadConfig:async()=>({...config,client_secret:'rotated'})});
  assert.equal((await call('status',cookie)).body.active,false);
 } finally { if(previous===undefined)delete process.env.FYJ_PUBLIC_ORIGIN;else process.env.FYJ_PUBLIC_ORIGIN=previous; }
});
