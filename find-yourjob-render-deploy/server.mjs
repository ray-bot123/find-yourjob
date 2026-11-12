import { memberProxy } from './member-proxy.mjs';
import { servePayPal } from './paypal.mjs';
import { serveAdzuna } from './adzuna.mjs';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('dist');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
http.createServer(async(req,res)=>{try{const requestUrl=new URL(req.url,'http://localhost');if(['/api/member/conversation','/api/ai/status','/api/ai/conversation','/api/resume/parse/pdf','/api/resume/parse/docx'].includes(requestUrl.pathname))return memberProxy(req,res,requestUrl.pathname);if(requestUrl.pathname.startsWith('/api/paypal/'))return await servePayPal(req,res,requestUrl.pathname);if(requestUrl.pathname==='/api/jobs')return await serveAdzuna(req,res,requestUrl.searchParams);const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}const data=await readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(data);}catch{res.writeHead(404);res.end('Not found');}}).listen(4175,process.env.FYJ_BIND_HOST || '127.0.0.1',()=>console.log('Local: http://127.0.0.1:4175'));




