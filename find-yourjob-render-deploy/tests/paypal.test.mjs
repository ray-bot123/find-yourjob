import assert from 'node:assert/strict';
import test from 'node:test';
import { createPayPalHandler } from '../paypal.mjs';

test('sandbox checkout unlocks only the owning browser with an active matching subscription',async()=>{
  let status='APPROVAL_PENDING', planId='P-TEST', creates=0;
  const handler=createPayPalHandler({
    loadConfig:async()=>({client_id:'fixture',client_secret:'fixture',plan_id:'P-TEST'}),
    fetchApi:async(url,options)=>{
      assert.equal(new URL(url).hostname,'api-m.sandbox.paypal.com');
      if (url.endsWith('/oauth2/token')) return Response.json({access_token:'fixture'});
      if (url.endsWith('/plans/P-TEST')) return Response.json({id:'P-TEST',status:'ACTIVE',billing_cycles:[]});
      if (options.method==='POST') {
        creates++;
        assert.equal(JSON.parse(options.body).plan_id,'P-TEST');
        return Response.json({id:'I-TEST',links:[{rel:'approve',href:'https://www.sandbox.paypal.com/billing/approve'}]});
      }
      return Response.json({id:'I-TEST',plan_id:planId,status});
    },
  });
  async function request(path,{method='GET',cookie='',origin='http://localhost:4175'}={}) {
    const result={};
    await handler({method,headers:{host:'localhost:4175',origin,cookie}},{
      setHeader:(key,value)=>{result[key]=value;},
      writeHead:code=>{result.code=code;},
      end:body=>{result.body=JSON.parse(body);},
    },'/api/paypal/'+path);
    return result;
  }
  assert.equal((await request('terms')).code,200);
  assert.equal((await request('start',{method:'POST',origin:'https://example.org'})).code,403);
  const start=await request('start',{method:'POST'});
  assert.equal(start.code,200);
  const cookie=start['Set-Cookie'].split(';')[0];
  assert.equal((await request('start',{method:'POST',cookie})).body.approval,start.body.approval);
  assert.equal(creates,1);
  assert.equal((await request('status',{cookie})).body.active,false);
  status='ACTIVE';
  assert.equal((await request('status')).body.active,false);
  assert.equal((await request('status',{cookie})).body.active,true);
  assert.equal((await request('start',{method:'POST',cookie})).code,409);
  planId='P-OTHER';
  assert.equal((await request('status',{cookie})).body.active,false);
  planId='P-TEST';
  status='CANCELLED';
  assert.equal((await request('status',{cookie})).body.active,false);
});
