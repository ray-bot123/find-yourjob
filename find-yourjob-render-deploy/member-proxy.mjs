import http from 'node:http';

export function siteOrigin(req) {
  const local = ['localhost:4175', '127.0.0.1:4175'];
  if (local.includes(req.headers.host)) return 'http://' + req.headers.host;
  const publicOrigin = process.env.FYJ_PUBLIC_ORIGIN || process.env.RENDER_EXTERNAL_URL;
  if (publicOrigin && req.headers.host === new URL(publicOrigin).host) return publicOrigin;
  return '';
}

const routes = {
  '/api/ai/status': [4178, '/status', 'GET', 0],
  '/api/ai/conversation': [4178, '/conversation', 'POST', 800000],
  '/api/member/conversation': [4178, '/conversation', 'POST', 800000],
  '/api/resume/parse/pdf': [4177, '/parse/pdf', 'POST', 4999999],
  '/api/resume/parse/docx': [4177, '/parse/docx', 'POST', 4999999],
};
const usage = new Map();

export function memberProxy(req, res, pathname='/api/member/conversation') {
  const [port, path, method, maxBytes] = routes[pathname];
  const origin = siteOrigin(req);
  const reject = (status,error) => {
    res.writeHead(status, {'Content-Type':'application/json','Cache-Control':'no-store'});
    res.end(JSON.stringify({error}));
  };
  if (!origin || req.method !== method || (method==='POST' && req.headers.origin !== origin)) {
    return reject(403,'Open this action from find yourjob.');
  }
  const length = Number(req.headers['content-length']);
  if (method==='POST' && (!Number.isInteger(length) || length < 1 || length > maxBytes)) {
    return reject(413,'The file or request is too large.');
  }
  if (origin.startsWith('https:') && method==='POST') {
    const minute = Math.floor(Date.now()/60000);
    for (const [key,value] of usage) if (value.minute!==minute) usage.delete(key);
    const ip = req.headers['cf-connecting-ip'] || 'public';
    const entry = usage.get(ip) || {minute,count:0};
    if (entry.count >= 8 || usage.size >= 1000) return reject(429,'Please wait a minute before trying again.');
    entry.count++;
    usage.set(ip,entry);
  }
  const localOrigin = 'http://127.0.0.1:4175';
  const headers = {Origin:localOrigin,Cookie:req.headers.cookie||''};
  if (method==='POST') {
    headers['Content-Type']=req.headers['content-type']||'application/json';
    headers['Content-Length']=String(length);
  }
  const upstream=http.request({hostname:'127.0.0.1',port,path,method,headers,timeout:55000},response=>{
    res.writeHead(response.statusCode,{'Content-Type':'application/json','Cache-Control':'no-store'});
    response.pipe(res);
  });
  upstream.on('timeout',()=>upstream.destroy());
  upstream.on('error',()=>{if(!res.headersSent)reject(502,'The service is unavailable. Please retry.');else res.end();});
  req.on('aborted',()=>upstream.destroy());
  req.pipe(upstream);
}
