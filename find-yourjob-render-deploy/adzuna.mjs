import { readFile } from 'node:fs/promises';

export async function serveAdzuna(req, res, params) {
  const send = (status, body) => {
    res.writeHead(status, {'Content-Type':'application/json', 'Cache-Control':'no-store'});
    res.end(JSON.stringify(body));
  };
  if (req.method !== 'GET') return send(405, {error:'Method not allowed.'});
  const what = params.get('role')?.trim();
  const where = params.get('location')?.trim() || '';
  const page = Number(params.get('page') ?? 1);
  if (!what || what.length > 120 || where.length > 120 || !Number.isInteger(page) || page < 1 || page > 5) {
    return send(400, {error:'Enter a valid role and location.'});
  }
  let config;
  try {
    config = process.env.FYJ_ADZUNA_APP_ID && process.env.FYJ_ADZUNA_APP_KEY
      ? {app_id:process.env.FYJ_ADZUNA_APP_ID,app_key:process.env.FYJ_ADZUNA_APP_KEY}
      : JSON.parse((await readFile(new URL('./adzuna.local.json', import.meta.url), 'utf8')).replace(/^\uFEFF/, ''));
    if (!config.app_id?.trim() || !config.app_key?.trim()) throw new Error();
  } catch {
    return send(503, {error:'Adzuna is not configured on this device.'});
  }
  try {
    const query = new URLSearchParams({
      app_id:config.app_id.trim(), app_key:config.app_key.trim(), what,
      results_per_page:'5', ...(where ? {where} : {}),
    });
    const reply = await fetch('https://api.adzuna.com/v1/api/jobs/us/search/' + page + '?' + query, {
      redirect:'error', signal:AbortSignal.timeout(12000), headers:{Accept:'application/json'},
    });
    if (reply.status === 429) return send(429, {error:'Adzuna search limit reached. Try again later.'});
    if (!reply.ok) return send(502, {error:'Adzuna search is temporarily unavailable.'});
    const data = await reply.json();
    const jobs = data.results.flatMap(job => {
      let link;
      try { link = new URL(job.redirect_url); } catch { return []; }
      if (link.protocol !== 'https:' && link.protocol !== 'http:') return [];
      return [{
        title:job.title, company:job.company?.display_name, location:job.location?.display_name,
        description:job.description, link:link.href, salaryMin:job.salary_min,
        salaryMax:job.salary_max, estimated:String(job.salary_is_predicted)==='1',
      }];
    });
    return send(200, {jobs});
  } catch {
    return send(502, {error:'Adzuna search is temporarily unavailable.'});
  }
}
