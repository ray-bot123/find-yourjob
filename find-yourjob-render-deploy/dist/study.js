const escape = value => String(value ?? '').replace(/[&<>"']/g, char =>
  ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[char]);
const read = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
};
const saveKey = 'fyj-saved-targets-v1';
const planKey = 'fyj-study-plans-v1';
let saved = read(saveKey, {});
let plans = read(planKey, {});
const targetKey = target => JSON.stringify([target.source,target.direction,target.title,target.link || '']);

function planIdentity(target) {
  const normalize = value => String(value || '').normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase();
  const title = normalize(target.title);
  if (target.source === 'Role type') return JSON.stringify(['role',title]);
  const company = normalize(target.company);
  const location = normalize(target.location);
  if (company && location) return JSON.stringify(['opening',title,company,location]);
  let path = target.link || '';
  try { const url = new URL(path); path = url.origin + url.pathname.replace(/\/$/,''); } catch {}
  return JSON.stringify(['opening',title,company,location,path]);
}

function planRank(item) {
  const execution = item.execution;
  return execution ? 1 + Object.keys(execution.accepted || {}).length * 1000 +
    Math.min(999,Object.keys(execution.submissions || {}).length) + (execution.resumeDraft ? 10000 : 0) : 0;
}

function uniquePlanEntries(records) {
  const groups = new Map();
  for (const entry of Object.entries(records)) {
    const [, item] = entry;
    if (!item?.target || !item.plan) continue;
    const identity = planIdentity(item.target);
    const current = groups.get(identity);
    if (!current || planRank(item) >= planRank(current[1])) groups.set(identity,entry);
  }
  return [...groups.values()];
}

function findExistingPlan(target) {
  plans = read(planKey,plans);
  const identity = planIdentity(target);
  return uniquePlanEntries(plans).find(([,item]) => planIdentity(item.target) === identity);
}
let resumeContext = () => '';
let popup;
let request;
let returnFocus;

function persist(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); return true; }
  catch { return false; }
}

function button(label, action, primary = false) {
  const control = document.createElement('button');
  control.type = 'button';
  control.className = 'button' + (primary ? ' primary' : '');
  control.textContent = label;
  control.onclick = action;
  return control;
}

function dialog(html, origin) {
  if (!popup) {
    popup = document.createElement('dialog');
    popup.className = 'study-dialog';
    popup.setAttribute('aria-labelledby', 'study-title');
    popup.addEventListener('close', () => {
      request?.abort();
      if (returnFocus?.isConnected) returnFocus.focus();
    });
    document.body.append(popup);
  }
  if (origin) returnFocus = origin;
  popup.innerHTML = html;
  popup.prepend(button('Close', () => popup.close()));
  if (!popup.open) popup.showModal();
}

function planBody(plan) {
  return '<p>' + escape(plan.summary) + '</p>' +
    [['Experience you can build on',plan.existingEvidence],['What to verify',plan.unknowns]]
      .filter(([, items]) => items.length).map(([label,items]) =>
        '<h3>' + label + '</h3><ul>' + items.map(item => '<li>' + escape(item) + '</li>').join('') + '</ul>').join('') +
    plan.steps.map((step,index) => '<article class="study-step"><h3>' + (index+1) + '. ' + escape(step.title) +
      '</h3><p class="v3-small">' + escape(step.effort) + '</p><dl>' +
      [['Gap to address',step.gap],['What to study and practice',step.study],
       ['What to submit',step.deliverable],['How to know it’s ready',step.acceptance]].map(([label,value]) =>
        '<dt>' + label + '</dt><dd>' + escape(value) + '</dd>').join('') + '</dl></article>').join('');
}

function showTrial(target, plan, back) {
  dialog('<h2 id="study-title">Try ' + escape(target.title) + '</h2><h3>Your work sample</h3><p>' +
    escape(plan.trial.task) + '</p><h3>Reflect afterward</h3><p>' + escape(plan.trial.reflection) + '</p>');
  popup.append(button('Back to Study Road', back));
}

function askCommunity(target) {
  popup.close();
  const openComposer = () => {
    document.querySelector('[data-action="compose"]')?.click();
    const title = document.querySelector('#post-title');
    const body = document.querySelector('#post-body');
    if (title && body && !title.value && !body.value) {
      title.value = ('How can I prepare for a ' + target.title + ' role?').slice(0,160);
      body.value = 'I’m exploring this role. What work sample would you recommend building to show readiness for it?';
      body.dispatchEvent(new Event('input',{bubbles:true}));
    }
  };
  if (location.hash === '#/community') openComposer();
  else {
    window.addEventListener('hashchange', openComposer, {once:true});
    location.hash = '#/community';
  }
}

function showPlan(target, plan, basis, description) {
  dialog('<h2 id="study-title">Study Road</h2><h3>' + escape(target.title) + '</h3><p class="v3-small">' +
    escape(basis) + '</p>' + planBody(plan) + '<div class="actions study-actions"></div><p role="status"></p>');
  const actions = popup.querySelector('.study-actions');
  const existing = findExistingPlan(target);
  actions.append(
    button('Try this role', () => showTrial(target, plan, () => showPlan(target, plan, basis, description))),
    button('Ask in Community', () => askCommunity(target)),
    button(existing ? (existing[1].execution ? 'Continue plan' : 'Set up saved plan') : 'Add to plan',
      () => choosePace(target, plan, basis, description), true),
  );
  const edit = document.createElement('details');
  edit.innerHTML = '<summary>Refine with a full job description</summary><label>Job description<textarea maxlength="12000">' +
    escape(description || '') + '</textarea></label>';
  edit.append(button('Regenerate Study Road', () => openStudy(target, null, edit.querySelector('textarea').value)));
  popup.append(edit);
}

function openStudy(target, origin, description = '') {
  request?.abort();
  const basis = description.trim() ? 'Based on your resume and the job description you supplied.' :
    target.source === 'Adzuna' ? 'Based on your resume and the listing excerpt. Verify requirements in the original posting.' :
    'Based on your resume and this role type. Verify requirements against a specific opening before applying.';
  dialog('<h2 id="study-title">Study Road</h2><h3>' + escape(target.title) + '</h3><p class="v3-small">' +
    escape(basis) + '</p><p role="status">Building your plan…</p>', origin);
  const resume = resumeContext();
  if (resume.trim().length < 40) {
    popup.querySelector('[role="status"]').textContent = 'Import and confirm your resume in Discover to create a personalized plan.';
    popup.append(button('Go to Discover', () => { popup.close(); location.hash = '#/discover'; }));
    return;
  }
  const active = new AbortController();
  request = active;
  fetch('/api/ai/conversation', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({mode:'study', resume, consent:true, turns:[], target:{
      title:target.title, company:target.company || '', direction:target.direction,
      description:description.trim() || target.description || '',
      basis:description.trim() ? 'Full description supplied by user' : target.source === 'Adzuna' ? 'Excerpt only' : 'Role type only',
    }}),
    signal:AbortSignal.any([active.signal,AbortSignal.timeout(45000)]),
  }).then(async response => {
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Could not generate a Study Road.');
    if (!active.signal.aborted && popup.open) showPlan(target,data,basis,description);
  }).catch(error => {
    if (active.signal.aborted || !popup.open) return;
    popup.querySelector('[role="status"]').textContent = error.name === 'TimeoutError' ?
      'This is taking longer than expected. Please retry.' : error.message;
    popup.append(button('Retry', () => openStudy(target,null,description)));
  });
}

export function attachStudy(card, target, feedback) {
  if (card.querySelector('.study-card-actions')) return;
  const key = targetKey(target);
  const actions = document.createElement('div');
  actions.className = 'actions study-card-actions';
  actions.setAttribute('role', 'group');
  actions.setAttribute('aria-label', 'Actions for ' + target.title);
  if (feedback) {
    const interested = button('Interested', () => select('like'));
    const notForMe = button('Not for me', () => select('dislike'));
    function select(action) {
      feedback.set(action);
      updateFeedback();
    }
    function updateFeedback() {
      const current = feedback.read();
      interested.setAttribute('aria-pressed', String(current === 'like'));
      notForMe.setAttribute('aria-pressed', String(current === 'dislike'));
    }
    updateFeedback();
    actions.append(interested, notForMe);
  }
  const road = button('Study Road', () => openStudy(target,road),true);
  const bookmark = button('', () => {
    const next = {...saved};
    if (next[key]) delete next[key]; else next[key] = target;
    if (!persist(saveKey,next)) { bookmark.textContent = 'Could not save'; return; }
    if (next[key]) saved[key] = target; else delete saved[key];
    updateBookmark();
  });
  const updateBookmark = () => {
    bookmark.textContent = saved[key] ? 'Saved ✓' : 'Save';
    bookmark.setAttribute('aria-pressed', String(Boolean(saved[key])));
  };
  updateBookmark();
  actions.append(road,bookmark);
  card.append(actions);
}

function mountCollections() {
  const route = location.hash;
  const main = document.querySelector('#main');
  if (main && route.startsWith('#/plan/')) { mountPlanDetail(main); return; }
  if (!main || main.querySelector('.study-collection') || !['#/saved','#/plan'].includes(route)) return;
  const isSaved = route === '#/saved';
  const entries = isSaved ? Object.entries(saved) : uniquePlanEntries(plans);
  const section = document.createElement('section');
  section.className = 'v3-panel study-collection';
  section.innerHTML = '<h2>' + (isSaved ? 'Saved roles and openings' : 'Your Study Roads') + '</h2>';
  if (!entries.length) section.append(isSaved ? 'Save a role or opening from Discover.' : 'Add a Study Road from Discover to get started.');
  for (const [key,item] of entries) {
    const target = isSaved ? item : item.target;
    const card = document.createElement('article');
    card.className = 'study-step';
    card.innerHTML = '<h3>' + escape(target.title) + '</h3><p>' +
      escape([target.company,target.location,target.direction].filter(Boolean).join(' · ')) + '</p>';
    if (isSaved) {
      const road = button('Study Road', () => openStudy(target,road),true);
      card.append(road,button('Remove', () => {
        const next = {...saved};
        delete next[key];
        if (persist(saveKey,next)) {
          delete saved[key];
          section.remove();
          mountCollections();
        }
      }));
    } else {
      if (item.execution) {
        const summary = document.createElement('p');
        const execution = item.execution;
        const day = Math.max(0,today()-execution.start);
        const reviewedToday = Object.keys(execution.submissions).some(id => id.endsWith(':'+day));
        summary.textContent = progressLabel(execution) + (Object.keys(execution.accepted).length === 3 ?
          ' · Application materials' : reviewedToday ? ' · Evidence reviewed today' : ' · Today’s assignment is ready');
        card.append(summary);
      }
      if (!item.execution) {
        const hint = document.createElement('p');
        hint.className = 'v3-small';
        hint.textContent = 'Choose a duration to start daily assignments and evidence reviews.';
        card.append(hint);
      }
      card.append(button(item.execution ? 'Continue plan' : 'Set up schedule', () =>
        openPlanPage(key),true));
    }
    section.append(card);
  }
  main.prepend(section);
}

export function initStudy(getResume) {
  resumeContext = getResume;
  const previous = read('fyj-exploration-feedback-v1', []);
  if (!read(saveKey,null) && Array.isArray(previous)) {
    for (const event of previous) {
      if (event.action !== 'save' || typeof event.role !== 'string') continue;
      const target = {source:'Role type',title:event.role,direction:event.direction || ''};
      saved[targetKey(target)] = target;
    }
    if (Object.keys(saved).length) persist(saveKey,saved);
  }
  window.addEventListener('storage', event => {
    if (![planKey,saveKey].includes(event.key)) return;
    plans = read(planKey,{});
    saved = read(saveKey,{});
    if (['#/plan','#/saved'].includes(location.hash)) document.querySelector('.study-collection')?.remove();
    mountCollections();
  });
  new MutationObserver(mountCollections).observe(document.querySelector('#app'),{childList:true,subtree:true});
  mountCollections();
}



const membershipKey = 'fyj-local-trial-v1';
const dayNumber = date => Date.UTC(date.getFullYear(),date.getMonth(),date.getDate()) / 86400000;
const today = () => dayNumber(new Date());
const hasTrial = () => Number(read(membershipKey,0)) > Date.now();
const progressLabel = execution => {
  const done = Object.keys(execution.accepted).length;
  return done + ' of 3 milestones supported by submitted evidence';
};

function choosePace(target, plan, basis, description) {
  const existing = findExistingPlan(target);
  if (existing?.[1].execution) {
    openPlanPage(existing[0]);
    return;
  }
  if (existing) ({target,plan,basis} = existing[1]);
  if (location.hash && location.hash !== '#/discover') {
    popup?.close();
    window.addEventListener('hashchange', () => {
      if (location.hash === '#/discover') choosePace(target,plan,basis,description);
    }, {once:true});
    location.hash = '#/discover';
    return;
  }

  dialog('<h2 id="study-title">Start your Study Road</h2><p>' + escape(target.title) + '</p>' +
    '<label>Plan length <select><option value="1">1 month · intensive</option>' +
    '<option value="3" selected>3 months · steady</option><option value="6">6 months · flexible</option></select></label>' +
    '<label>Study hours per week <input id="weekly-hours" type="number" min="1" max="40" value="5"></label><p>Daily assignments, evidence reviews and a tailored resume are membership features. A shorter plan requires more time; the duration is a target, not a guarantee.</p>' +
    '<div class="plan-checkout"></div><p role="status">Checking payment options…</p>');
  const surface = popup;
  const checkout = surface.querySelector('.plan-checkout');
  const status = surface.querySelector('[role="status"]');

  function startPlan(membership) {
    const latest = findExistingPlan(target);
    if (latest?.[1].execution) { openPlanPage(latest[0]); return; }
    const key = latest?.[0] || targetKey(target);
    const months = Number(surface.querySelector('select').value);
    const weeklyHours=Number(surface.querySelector('#weekly-hours').value);
    if(!Number.isFinite(weeklyHours)||weeklyHours<1||weeklyHours>40){status.textContent='Choose 1–40 study hours per week.';return;}
    const item = {target,plan,basis,execution:{months,weeklyHours,start:today(),submissions:{},accepted:{},membership}};
    if (!persist(planKey,{...plans,[key]:item})) {
      status.textContent = 'Could not save the plan on this device.';
      return;
    }
    plans[key] = item;
    popup.close();

    openPlanPage(key);
  }
  setupCheckout(checkout,status,startPlan);
  surface.append(button('Back to Study Road', () => showPlan(target,plan,basis,description)));
}

async function paymentRequest(action, method='GET') {
  const response = await fetch('/api/paypal/'+action,{method,signal:AbortSignal.timeout(50000)});
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Checkout is unavailable.');
  return data;
}

async function setupCheckout(container,status,startPlan) {
  try {
    const {configured} = await paymentRequest('config');
    if (!container.isConnected) return;
    if (!configured) { status.textContent = 'PayPal Sandbox checkout is awaiting configuration.'; return; }
    const membership = await paymentRequest('status');
    if (!container.isConnected) return;
    if (membership.active) {
      status.textContent = 'Your PayPal Sandbox membership is active. No new subscription is needed.';
      container.append(button('Start my plan', () => startPlan('paypal'),true));
      return;
    }
    const terms = await paymentRequest('terms');
    if (!container.isConnected) return;
    const descriptions = terms.cycles.map(cycle => {
      const price = cycle.price ? cycle.price.currency_code+' '+cycle.price.value : 'Free';
      return price+' per '+cycle.frequency.interval_count+' '+cycle.frequency.interval_unit.toLowerCase()+
        (cycle.total ? ' × '+cycle.total+' cycle(s)' : ' until cancelled');
    });
    if (Number(terms.setupFee?.value)>0) descriptions.push('Setup fee '+terms.setupFee.currency_code+' '+terms.setupFee.value);
    status.textContent = 'PayPal Sandbox · '+descriptions.join(' · ');
    const verify = button('Verify subscription', async () => {
      verify.disabled = true;
      try {
        const result = await paymentRequest('status');
        if (!container.isConnected) return;
        if (result.active) startPlan('paypal');
        else status.textContent = 'Subscription status: '+result.status+'. Complete sandbox approval first.';
      } catch (error) { status.textContent = error.message; }
      finally { verify.disabled = false; }
    });
    const start = button('Start PayPal sandbox checkout', async () => {
      start.disabled = true;
      try {
        const result = await paymentRequest('start','POST');
        if (!container.isConnected) return;
        const link = document.createElement('a');
        link.className='button primary';
        link.href=result.approval;
        link.target='_blank';
        link.rel='noopener noreferrer';
        link.textContent='Open PayPal Sandbox';
        start.replaceWith(link);
        status.textContent = 'Approve in PayPal Sandbox, then return here and verify the subscription.';
      } catch (error) { status.textContent = error.message; start.disabled=false; }
    },true);
    container.append(start,verify);
  } catch (error) {
    status.textContent = error.message || 'Could not load payment options.';
    container.append(button('Retry', () => { container.replaceChildren(); setupCheckout(container,status,startPlan); }));
  }
}

function dailyAssignment(step, offset, duration) {
  const fraction = offset / Math.max(1,duration-1);
  if (fraction < .25) return 'Study and take notes on: ' + step.study;
  if (fraction < .55) return 'Build one small part of this deliverable and document how it works: ' + step.deliverable;
  if (fraction < .85) return 'Test or revise your work against one criterion. Include the result: ' + step.acceptance;
  return 'Package your milestone evidence for review: ' + step.deliverable;
}

async function executionAI(mode, context) {
  const resume = resumeContext();
  if (resume.trim().length < 40) throw new Error('Confirm your resume in Discover first.');
  const response = await fetch('/api/member/conversation',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({mode,resume,execution:context,consent:true}),
    signal:AbortSignal.timeout(45000),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'The AI request failed. Please retry.');
  return data;
}

function updateExecution(key, execution) {
  const item = {...plans[key],execution};
  if (!persist(planKey,{...plans,[key]:item})) throw new Error('Could not save your progress.');
  plans[key] = item;
  document.querySelector('.study-collection')?.remove();
  mountCollections();
}

async function showDailyPlan(key, selectedDay = null) {
  const surface = document.querySelector('.plan-detail-content');
  if (!surface) { openPlanPage(key); return; }
  const {target,plan,execution} = plans[key];
  const currentDay = Math.max(0,today()-execution.start);
  const day = selectedDay ?? currentDay;
  const duration = execution.months*30;
  const perStage = duration/3;
  const nextStage = plan.steps.findIndex((_,index) => !execution.accepted[index]);
  const allDone = nextStage < 0;
  const stage = day === currentDay && !allDone ? nextStage : Math.min(2,Math.floor(day/perStage));
  const offset = allDone ? 0 : Math.min(perStage-1, Math.max(0,day-stage*perStage));
  const step = plan.steps[stage];
  const task = allDone ? '' : dailyAssignment(step,offset,perStage);
  const submissionKey = stage + ':' + day;
  const previous = execution.submissions[submissionKey] || Object.entries(execution.submissions).find(([id]) => id.endsWith(':'+day))?.[1];
  surface.innerHTML = '<h1>' + escape(target.title) + '</h1><p>' +
    execution.months + '-month plan · ' + escape(progressLabel(execution)) + '</p>' +
    '<p class="v3-small">Progress tracks evidence against this plan’s milestones.</p>' +
    roadmap(plan, execution, perStage) + '<div class="plan-calendar"></div>' + '<section class="plan-day">' +
    (allDone ? '<h3>Application materials</h3>' : '<h3>' + (day === currentDay ? 'Today’s assignment' : 'Assignment preview') + ' · Day ' + (day+1) +
      '</h3><p>' + escape(step.title) + '</p><p>' + escape(task) + '</p><h4>What to produce</h4><p>' + escape(step.deliverable) + '</p><h4>Review criteria</h4><p>' + escape(step.acceptance) + '</p><label>GitHub repository<input type="url" class="study-repository" maxlength="250" placeholder="https://github.com/owner/project" value="' +
      escape(previous?.repository || '') + '"></label><p class="v3-small">Share a public repository. Include what you built, how you tested it, and the results in its README. The reviewer reads the README.</p>') +
    '<p role="status">' + escape(previous?.feedback || '') + '</p></section>';
  renderWeek(surface.querySelector('.plan-calendar'),key,execution,day,currentDay,duration,perStage,plan);
  const status = surface.querySelector('[role="status"]');
  const reminder=button('Export daily calendar reminders',()=>{
    const stamp=new Date((execution.start)*86400000).toISOString().slice(0,10).replaceAll('-','');
    const safe=String(target.title).replace(/[\r\n,;\\]/g,' ');
    const ics=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//find yourjob//Study reminders//EN','BEGIN:VEVENT',
      'UID:'+encodeURIComponent(key)+'@findyourjob.local','DTSTAMP:'+new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z/,'Z'),
      'DTSTART:'+stamp+'T190000','DURATION:PT30M','RRULE:FREQ=DAILY;COUNT='+duration,
      'SUMMARY:Study Road - '+safe,'DESCRIPTION:Open My plan to review your assignment. Adjust reminder time in your calendar.',
      'BEGIN:VALARM','TRIGGER:-PT10M','ACTION:DISPLAY','DESCRIPTION:Study Road reminder','END:VALARM','END:VEVENT','END:VCALENDAR',''].join('\r\n');
    const url=URL.createObjectURL(new Blob([ics],{type:'text/calendar'}));
    const link=document.createElement('a');link.href=url;link.download='study-reminders.ics';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  surface.querySelector('.plan-calendar').append(reminder);
  if (execution.membership === 'paypal') {
    try {
      const {active} = await paymentRequest('status');
      if (!status.isConnected) return;
      if (!active) { status.textContent = 'An active PayPal sandbox subscription is required.'; return; }
    } catch (error) { status.textContent = error.message; return; }
  } else if (!hasTrial()) {
    status.textContent = 'Your trial has ended. Paid membership checkout is not available in this preview.';
    return;
  }
  if (!allDone) {
    const daily = document.createElement('section');
    const cached=execution.assignments?.[day];
    const text=document.createElement('p');
    text.style.whiteSpace='pre-wrap';
    text.textContent=cached || 'Create a detailed assignment for your available study time.';
    const generate=button(cached?'Refresh daily assignment':'Create today’s detailed assignment',async()=>{
      generate.disabled=true;
      text.textContent='Preparing your daily assignment…';
      try {
        const result=await executionAI('daily-plan',{target,step,day:day+1,minutes:Math.round((execution.weeklyHours||5)*60/5),previousFeedback:previous?.feedback||'',months:execution.months});
        updateExecution(key,{...plans[key].execution,assignments:{...plans[key].execution.assignments,[day]:result.assignment}});
        text.textContent=result.assignment;
      } catch(error){text.textContent=error.message;} finally {generate.disabled=false;}
    });
    daily.append(text,generate);
    surface.querySelector('.plan-day').prepend(daily);
    const pace = document.createElement('details');
    pace.innerHTML = '<summary>Adjust plan length</summary><label>Plan length <select>' +
      [1,3,6].map(months => '<option value="' + months + '"' + (execution.months === months ? ' selected' : '') +
        '>' + months + (months === 1 ? ' month' : ' months') + '</option>').join('') + '</select></label>';
    pace.append(button('Update schedule', () => {
      try {
        const latest = plans[key].execution;
        updateExecution(key,{...latest,months:Number(pace.querySelector('select').value)});
        showDailyPlan(key);
      } catch (error) { status.textContent = error.message; }
    }));
    surface.querySelector('.plan-day').append(pace);
  }
  if (allDone) {
    if (execution.resumeDraft) {
      const draft = document.createElement('textarea');
      draft.setAttribute('aria-label','Review and edit resume draft');
      draft.value = execution.resumeDraft;
      surface.querySelector('.plan-day').append(draft,button('Download resume', () => {
        const url = URL.createObjectURL(new Blob([draft.value],{type:'text/plain;charset=utf-8'}));
        const link = document.createElement('a');
        link.href=url; link.download='tailored-resume.txt'; link.click();
        setTimeout(() => URL.revokeObjectURL(url),1000);
      }));
      if (target.link && /^https?:\/\//i.test(target.link)) {
        const apply = document.createElement('a');
        apply.className='button primary';
        apply.href=target.link;
        apply.target='_blank';
        apply.rel='noopener noreferrer';
        apply.textContent='Open application';
        surface.querySelector('.plan-day').append(apply);
      }
      return;
    }
    const draftButton = button('Generate resume draft', async () => {
      draftButton.disabled = true;
      status.textContent = 'Drafting your resume…';
      try {
        const result = await executionAI('resume-draft',{target,evidence:Object.values(execution.accepted)});
        updateExecution(key,{...plans[key].execution,resumeDraft:result.resumeDraft});
        if (status.isConnected) showDailyPlan(key);
      } catch (error) { status.textContent = error.message; draftButton.disabled=false; }
    },true);
    surface.querySelector('.plan-day').append(draftButton);
    draftButton.click();
    return;
  }
  if (day !== currentDay) {
    surface.querySelector('.study-repository').readOnly = true;
    return;
  }
  const submit = button('Submit for review', async () => {
    const repository = surface.querySelector('.study-repository').value.trim();
    if (!/^https:\/\/github\.com\/[\w-]+\/[\w.-]+\/?$/i.test(repository)) { status.textContent = 'Enter a GitHub repository link, such as https://github.com/owner/project.'; return; }
    submit.disabled = true;
    status.textContent = 'Reviewing your evidence…';
    try {
      const result = await executionAI('review-study',{target,step,task,repository});
      const reviewed = {repository,feedback:result.feedback};
      const latest = plans[key].execution;
      const accepted = {...latest.accepted,...(result.accepted ? {[stage]:reviewed} : {})};
      updateExecution(key,{...latest,accepted,submissions:{...latest.submissions,[submissionKey]:reviewed}});
      if (status.isConnected) {
        if (Object.keys(accepted).length === plan.steps.length) showDailyPlan(key);
        else if (result.accepted) {
          status.textContent = result.feedback;
          surface.querySelector('.plan-day').append(button('Continue to next milestone', () => showDailyPlan(key),true));
        } else {
          status.textContent = result.feedback;
          submit.disabled = false;
        }
      }
    } catch (error) { status.textContent = error.message; submit.disabled = false; }
  },true);
  surface.querySelector('.plan-day').append(submit);
}






function openPlanPage(key) {
  if (popup?.open) popup.close();
  const url = '#/plan/' + encodeURIComponent(key);
  if (location.hash !== url) location.hash = url;
  else mountCollections();
}

function mountPlanDetail(main) {
  if (main.querySelector('.plan-detail')) return;
  let key;
  try { key = decodeURIComponent(location.hash.slice('#/plan/'.length)); } catch {}
  const item = Object.hasOwn(plans,key) ? plans[key] : null;
  const page = document.createElement('section');
  page.className = 'plan-detail';
  page.innerHTML = '<a class="text-link" href="#/plan">← All study plans</a><div class="plan-detail-content"></div>';
  main.replaceChildren(page);
  const content = page.querySelector('.plan-detail-content');
  if (!item) {
    content.innerHTML = '<h1>Study plan unavailable</h1><p>Open a plan saved in this browser from My plan.</p>';
    return;
  }
  if (item.execution) showDailyPlan(key);
  else {
    content.innerHTML = '<h1>' + escape(item.target.title) + '</h1><p>Open your Study Road in Discover to start this plan.</p>';
    content.append(button('Open Study Road in Discover', () => {
      window.addEventListener('hashchange', () => {
        if (location.hash === '#/discover') showPlan(item.target,item.plan,item.basis,'');
      }, {once:true});
      location.hash = '#/discover';
    },true));
  }
}

function roadmap(plan, execution, stageDays) {
  return '<section class="plan-roadmap"><h2>Overall roadmap</h2>' + planBody({...plan,steps:[]}) +
    '<div class="plan-milestones">' + plan.steps.map((step,index) => {
      const completed = Boolean(execution.accepted[index]);
      return '<details class="study-step"' + (index === plan.steps.findIndex((_,i) => !execution.accepted[i]) ? ' open' : '') +
        '><summary><strong>' + escape(step.title) + '</strong><span>' + (completed ? 'Evidence accepted' : 'Days ' +
        (index*stageDays+1) + '–' + ((index+1)*stageDays)) + '</span></summary><p>' + escape(step.effort) +
        '</p><dl>' + [['Skill gap',step.gap],['Study and practice',step.study],['Milestone deliverable',step.deliverable],
          ['Acceptance criteria',step.acceptance]].map(([label,value]) => '<dt>' + label + '</dt><dd>' +
          escape(value) + '</dd>').join('') + '</dl></details>';
    }).join('') + '</div></section>';
}

function renderWeek(calendar,key,execution,selected,current,duration,stageDays,plan) {
  const week = Math.floor(selected/7)*7;
  const days = Array.from({length:7},(_,index) => week+index).filter(day => day<duration || day<=current);
  const dateFor = day => new Date((execution.start+day)*86400000);
  const format = (day,options) => new Intl.DateTimeFormat('en-US',{...options,timeZone:'UTC'}).format(dateFor(day));
  const reviewed = day => Object.keys(execution.submissions).some(id => id.endsWith(':'+day));
  calendar.innerHTML = '<div class="plan-calendar-head"><div><h2>Weekly schedule</h2><p>' +
    escape(format(week,{month:'long',day:'numeric',year:'numeric'})) + '</p></div><div class="actions"></div></div>' +
    '<div class="plan-calendar-scroll"><div class="plan-week-grid"></div></div>';
  const actions = calendar.querySelector('.actions');
  const previous = button('← Previous week',() => showDailyPlan(key,Math.max(0,week-7)));
  previous.disabled = week===0;
  const next = button('Next week →',() => showDailyPlan(key,week+7));
  next.disabled = week+7>=Math.max(duration,current+1);
  actions.append(previous,button('Today',() => showDailyPlan(key)),next);
  const grid = calendar.querySelector('.plan-week-grid');
  grid.style.setProperty('--days',days.length);
  grid.append(document.createElement('span'));
  for (const day of days) {
    const status = reviewed(day) ? 'Reviewed' : day === current ? 'Today' : day < current ? 'Past' : 'Scheduled';
    const control = button(format(day,{weekday:'short',day:'numeric'}),() => showDailyPlan(key,day));
    control.setAttribute('aria-pressed',String(day===selected));
    control.classList.toggle('is-today',day===current);
    const caption = document.createElement('small');
    caption.textContent = status;
    control.append(caption);
    grid.append(control);
  }
  plan.steps.forEach((step,index) => {
    const label = document.createElement('div');
    label.className = 'plan-week-label';
    label.textContent = step.title;
    grid.append(label);
    for (const day of days) {
      const cell = document.createElement('div');
      cell.className = 'plan-week-cell';
      if (Math.min(2,Math.floor(day/stageDays))===index) {
        cell.classList.add('scheduled','stage-'+index);
        if (execution.accepted[index]) cell.classList.add('accepted');
      }
      grid.append(cell);
    }
  });
}



