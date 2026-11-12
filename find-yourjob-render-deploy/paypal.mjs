import { siteOrigin } from './member-proxy.mjs';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { readFileSync, writeFileSync, renameSync } from 'node:fs';

const base = 'https://api-m.sandbox.paypal.com';
const configPath = new URL('./paypal.local.json',import.meta.url);

async function readConfig() {
  const hosted = {client_id:process.env.FYJ_PAYPAL_CLIENT_ID,client_secret:process.env.FYJ_PAYPAL_CLIENT_SECRET,plan_id:process.env.FYJ_PAYPAL_PLAN_ID};
  if (hosted.client_id && hosted.client_secret && /^P-[A-Z0-9]+$/.test(hosted.plan_id)) return hosted;
  try {
    const config = JSON.parse((await readFile(configPath,'utf8')).replace(/^\uFEFF/,''));
    if (config.client_id?.trim() && config.client_secret?.trim() && /^P-[A-Z0-9]+$/.test(config.plan_id)) return config;
  } catch {}
  return null;
}

export function createPayPalHandler({loadConfig=readConfig,fetchApi=fetch,sessionFile=null}={}) {
  let initial=[];
  if (sessionFile) {
    try { initial=JSON.parse(readFileSync(sessionFile,'utf8')); }
    catch(error) { if(error.code!=='ENOENT') throw error; }
  }
  const sessions = new Map(initial.map(([id,value])=>[id,{...value,busy:false}]));
  const persist = () => {
    if (!sessionFile) return;
    const temporary=sessionFile+'.tmp';
    writeFileSync(temporary,JSON.stringify([...sessions]),{mode:0o600});
    renameSync(temporary,sessionFile);
  };

  async function paypal(config,path,options={}) {
    const auth = await fetchApi(base+'/v1/oauth2/token',{
      method:'POST', redirect:'error', signal:AbortSignal.timeout(10000),
      headers:{Authorization:'Basic '+Buffer.from(config.client_id+':'+config.client_secret).toString('base64'),
        'Content-Type':'application/x-www-form-urlencoded'},
      body:'grant_type=client_credentials',
    });
    if (!auth.ok) throw new Error('PayPal authentication failed.');
    const token = (await auth.json()).access_token;
    if (!token) throw new Error('PayPal did not issue an access token.');
    const response = await fetchApi(base+path,{
      redirect:'error',signal:AbortSignal.timeout(12000),...options,
      headers:{Authorization:'Bearer '+token,Accept:'application/json','Content-Type':'application/json',...options.headers},
    });
    if (!response.ok) throw new Error('PayPal could not complete the request.');
    return response.json();
  }

  return async function serve(req,res,path) {
    const send = (status,body,headers={}) => {
      res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store',...headers});
      res.end(JSON.stringify(body));
    };
    if (path==='/api/paypal/return' || path==='/api/paypal/cancel') {
      res.writeHead(200,{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'});
      res.end(path.endsWith('/cancel') ? 'Sandbox checkout cancelled. Return to find yourjob to try again.' :
        'Return to find yourjob and select Verify subscription. Access is granted after PayPal confirms activation.');
      return;
    }
    const origin = siteOrigin(req);
    if (!origin || (req.headers.origin && req.headers.origin!==origin)) return send(403,{error:'Invalid checkout origin.'});
    if (['/api/paypal/start','/api/paypal/reset'].includes(path) && (req.method!=='POST' || req.headers.origin!==origin)) return send(403,{error:'Start checkout from find yourjob.'});
    if (!['/api/paypal/start','/api/paypal/reset'].includes(path) && req.method!=='GET') return send(405,{error:'Method not allowed.'});
    const sessionId = /(?:^|;\s*)fyj_checkout=([a-f0-9-]{36})(?:;|$)/.exec(req.headers.cookie||'')?.[1];
    const session = sessions.get(sessionId);
    if (path==='/api/paypal/reset') {
      sessions.delete(sessionId);
      persist();
      return send(200,{reset:true},{'Set-Cookie':'fyj_checkout=; Max-Age=0; HttpOnly; SameSite=Lax; Path=/'});
    }
    const config = await loadConfig();
    if (path==='/api/paypal/config') return send(200,{configured:Boolean(config)});
    if (!config) return send(503,{error:'PayPal sandbox has not been configured.'});
    try {
      if (path==='/api/paypal/status') {
        if (!session?.subscription) return send(200,{active:false,status:'NOT_STARTED'});
        const details = await paypal(config,'/v1/billing/subscriptions/'+session.subscription);
        const active = details.id===session.subscription && details.plan_id===config.plan_id && details.status==='ACTIVE';
        return send(200,{active,status:details.status});
      }
      if (path==='/api/paypal/terms') {
        const plan = await paypal(config,'/v1/billing/plans/'+config.plan_id);
        if (plan.id!==config.plan_id || plan.status!=='ACTIVE') throw new Error('The sandbox plan is not active.');
        return send(200,{cycles:(plan.billing_cycles||[]).map(cycle=>({
          kind:cycle.tenure_type, frequency:cycle.frequency, total:cycle.total_cycles,
          price:cycle.pricing_scheme?.fixed_price,
        })),setupFee:plan.payment_preferences?.setup_fee});
      }
      if (path!=='/api/paypal/start') return send(404,{error:'Checkout endpoint not found.'});
      if (session?.busy) return send(409,{error:'Checkout is already starting.'});
      if (session?.subscription) {
        const details = await paypal(config,'/v1/billing/subscriptions/'+session.subscription);
        if (details.plan_id===config.plan_id && ['ACTIVE','APPROVED'].includes(details.status)) {
          return send(409,{error:'A subscription already exists. Verify it to continue.'});
        }
        if (details.plan_id===config.plan_id && details.status==='APPROVAL_PENDING') return send(200,{approval:session.approval});
      }
      const id = sessionId && session ? sessionId : randomUUID();
      const current = {busy:true,requestId:session?.subscription ? randomUUID() : session?.requestId || randomUUID()};
      sessions.set(id,current);
      persist();
      res.setHeader('Set-Cookie','fyj_checkout='+id+'; Max-Age=31536000; HttpOnly; SameSite=Lax; Path=/'+(origin.startsWith('https:')?'; Secure':''));
      try {
        const result = await paypal(config,'/v1/billing/subscriptions',{
          method:'POST',headers:{'PayPal-Request-Id':current.requestId},
          body:JSON.stringify({plan_id:config.plan_id,application_context:{
            brand_name:'find yourjob',shipping_preference:'NO_SHIPPING',user_action:'SUBSCRIBE_NOW',
            return_url:origin+'/api/paypal/return',cancel_url:origin+'/api/paypal/cancel',
          }}),
        });
        const approval = new URL(result.links?.find(link=>link.rel==='approve')?.href);
        if (approval.protocol!=='https:' || approval.host!=='www.sandbox.paypal.com' ||
            !/^I-[A-Z0-9]+$/.test(result.id)) throw new Error('Invalid sandbox approval response.');
        Object.assign(current,{subscription:result.id,approval:approval.href});
        persist();
        return send(200,{approval:approval.href});
      } finally {
        current.busy=false;
      }
    } catch (error) {
      if (['TimeoutError','AbortError'].includes(error.name) || error.cause?.code === 'UND_ERR_CONNECT_TIMEOUT') {
        return send(504,{error:'Could not connect to PayPal Sandbox in time. Retry when the connection is available.'});
      }
      return send(502,{error:'PayPal sandbox is unavailable. Check the sandbox app and plan configuration, then retry.'});
    }
  };
}
export const servePayPal = createPayPalHandler({
  sessionFile:process.env.FYJ_PAYPAL_SESSION_FILE || fileURLToPath(new URL('./paypal-sessions.local.json',import.meta.url)),
});

