import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../dist/study.js',import.meta.url),'utf8').replaceAll('export function','function');
function harness() {
  const events = {};
  const context = vm.createContext({
    localStorage:{getItem:()=>null},
    location:{hash:'#/saved'},
    window:{addEventListener:(name,handler)=>{events[name]=handler;}},
    document:{createElement:()=>({})},
    AbortSignal, URL, setTimeout,
  });
  vm.runInContext(source,context);
  return {context,events,run:code=>vm.runInContext(code,context)};
}
test('Add to plan from Saved continues checkout in Discover instead of silently returning',()=>{
  const {context,events,run}=harness();
  run("choosePace({source:'Role type',title:'Analyst'},{},'','')");
  assert.equal(context.location.hash,'#/discover');
  assert.equal(typeof events.hashchange,'function');
});
test('active subscriber gets Start my plan, with no duplicate checkout request',async()=>{
  const {context,run}=harness();
  context.actions=[];
  context.requests=[];
  context.result=[];
  run("paymentRequest=async action=>{requests.push(action); return action==='config'?{configured:true}:{active:true};}");
  await run("setupCheckout({isConnected:true,append:control=>actions.push(control)}, {}, value=>result.push(value))");
  assert.deepEqual([...context.requests],['config','status']);
  assert.equal(context.actions[0].textContent,'Start my plan');
  context.actions[0].onclick();
  assert.deepEqual([...context.result],['paypal']);
});
