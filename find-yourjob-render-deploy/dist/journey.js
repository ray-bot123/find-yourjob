import { attachStudy, initStudy } from './study.js';
import {validateResumeSize} from './resume-policy.js';
const roles=[
{id:'data',name:'Data Analyst',tag:'Find patterns. Explain decisions.',color:'#e7efff',symbol:'↗',work:'Investigate messy data, check assumptions and explain what the numbers can—and cannot—say.',fit:'Deep focus · Structured investigation',cost:'Illustrative pathway: 8–16 weeks at 6 hours/week',task:'A shop reports 120 orders on Monday and 150 on Tuesday. Monday has 12 refunds; Tuesday has 30. Write a short recommendation: did performance improve? Name two missing facts you would request.',routine:'Now check the definitions: are refunds from the same day’s orders? Explain why this matters before recommending action.',criteria:['Explain the metric and assumptions','Identify missing information','Communicate a defensible recommendation']},
{id:'success',name:'Customer Success Specialist',tag:'Build trust. Untangle problems.',color:'#fceadf',symbol:'◎',work:'Help customers adopt a product, investigate issues and coordinate follow-ups across teams.',fit:'Frequent conversations · Changing priorities',cost:'Illustrative pathway: 6–12 weeks at 6 hours/week',task:'A customer says: “We paid for this tool, but nobody uses it. We want to cancel.” Draft a response and three questions to understand the problem without promising a refund or a feature.',routine:'Two teams have not replied and the customer asks for an update. Write a follow-up that is honest about what is still unknown.',criteria:['Acknowledge the customer’s concern','Investigate before proposing a solution','Set a realistic next step']},
{id:'research',name:'UX Research Assistant',tag:'Stay curious. Make sense of people.',color:'#eee8fa',symbol:'✳',work:'Prepare research, listen carefully, organize notes and distinguish observations from interpretations.',fit:'Listening · Ambiguity · Careful synthesis',cost:'Illustrative pathway: 10–20 weeks at 6 hours/week',task:'Three users say checkout is “confusing.” Write five neutral interview questions that uncover what happened without suggesting the answer.',routine:'One user contradicts your initial conclusion. Explain how you would revise your notes and what you would investigate next.',criteria:['Ask neutral questions','Separate observation from interpretation','Address contradictory evidence']}
];
const key='fyj-experiments-v3';let s;try{s=JSON.parse(localStorage.getItem(key))||{}}catch{s={}};s.notes=s.notes||{};s.evidence=s.evidence||{};let view='explore',active='data',message='';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function save(){try{localStorage.setItem(key,JSON.stringify(s));message='Saved on this device.'}catch{message='Storage unavailable. Keep this tab open; changes are temporary.'}}
const button=(label,action,id='')=>`<button class="button" data-v3="${action}" data-role="${id}">${label}</button>`;
function card(r){const n=s.notes[r.id];return `<article class="v3-card"><div class="v3-art" style="background:${r.color}"><span>${r.symbol}</span><small>CAREER POSSIBILITY</small></div><div class="v3-body"><span class="eyebrow">${r.fit}</span><h2>${r.name}</h2><p>${r.work}</p><dl><dt>Work fit</dt><dd>${n?esc(n.feeling):'Explore first · No preference evidence yet'}</dd><dt>Preparation</dt><dd>${s.evidence[r.id]?'Draft saved · Not assessed':'Not assessed'}</dd><dt>Transition effort</dt><dd>${r.cost}</dd></dl><p class="v3-small">Planning example, not a personalized estimate. Team conditions and hiring eligibility are unknown.</p>${button('Try the work ↗','try',r.id)} ${button(s.target===r.id?'Your chosen direction':'Choose direction','choose',r.id)}</div></article>`}
function render(){const root=document.getElementById('v3-root');if(!root)return;let r=roles.find(x=>x.id===active)||roles[0];root.innerHTML=`<div class="v3-tabs">${button('01 Explore','explore')}${button('02 Compare experiences','compare')}${button('03 Build evidence','evidence')}</div><section class="v3-hero"><p class="eyebrow">FIND YOUR JOB. FIND YOURSELF.</p><h1>${view==='explore'?'A new direction.<br>A little more you.':view==='try'?'Try a small piece of the work.':view==='compare'?'What did you learn about yourself?':'Make your next move tangible.'}</h1><p>${view==='explore'?'Discover possibilities, experience the everyday work, then decide what is worth learning.':view==='try'?'Notice your curiosity and energy. Being a beginner is not a sign that a role is wrong for you.':view==='compare'?'Keep enjoyment, current ability and transition effort separate. It is okay to rule a direction out.':'Build a project you can explain. Every claim should have evidence behind it.'}</p></section><div class="v3-notice">Research prototype · Illustrative US roles, not live vacancies · No AI or employer assessment connected</div><div role="status" class="v3-status">${esc(message)}</div>${view==='explore'?`<div class="v3-controls"><label>Explore a city <select id="v3-city">${['Austin, TX','New York, NY','San Francisco, CA'].map(c=>`<option ${s.city===c?'selected':''}>${c}</option>`).join('')}</select></label><span>Sample role library for ${esc(s.city||'Austin, TX')}. City selection does not query live jobs.<br>Discovery is not filtered by your past experience.</span></div><div class="v3-grid">${roles.map(card).join('')}</div><section class="v3-panel"><h2>Get closer to the real working day.</h2><p>Company culture is not the same as your future team's day-to-day. Ask about meetings, interruptions and what a difficult week looks like.</p><a class="button" href="#/community">Ask the community ↗</a></section>`:view==='try'?`<div class="v3-columns"><section class="v3-panel"><p class="eyebrow">${r.name} · 20–30 minute sample</p><h2>A task, then the less glamorous part.</h2><h3>01 / Investigate</h3><p>${r.task}</p><h3>02 / Revisit the details</h3><p>${r.routine}</p><p class="v3-small">Illustrative exercise, not employer-designed or validated. A short sample cannot establish team fit.</p></section><form id="v3-reflect" class="v3-panel"><label>Your response<textarea name="response" required minlength="20">${esc(s.notes[r.id]?.response||'')}</textarea></label><label>Would you want to repeat this kind of work?<select name="feeling">${['Still exploring','I would like to do more','Interesting, but draining','Probably not for me'].map(f=>`<option ${s.notes[r.id]?.feeling===f?'selected':''}>${f}</option>`).join('')}</select></label><label>What energized or drained you?<textarea name="reflection" required>${esc(s.notes[r.id]?.reflection||'')}</textarea></label><button class="button">Save experience & compare →</button></form></div>`:view==='compare'?`<div class="v3-grid">${roles.map(x=>`<section class="v3-panel"><h2>${x.name}</h2><p>${esc(s.notes[x.id]?.feeling||'Not tried yet')}</p><p>${esc(s.notes[x.id]?.reflection||'Try a small task before committing to a long learning plan.')}</p><p class="v3-small">${x.cost}</p>${button('Try / revisit','try',x.id)} ${button('Choose direction','choose',x.id)}</section>`).join('')}</div>`:evidence()}`;bind(root)}
function evidence(){const r=roles.find(x=>x.id===s.target);if(!r)return `<section class="v3-panel"><h2>Choose a direction to begin.</h2><p>Your evidence plan follows the work you decide to explore.</p>${button('Explore directions','explore')}</section>`;return `<div class="v3-columns"><section class="v3-panel"><p class="eyebrow">YOUR DURABLE ROLE GOAL</p><h2>${r.name}</h2><p>This goal stays with you even when a vacancy closes.</p><ol><li><b>Explore the foundations.</b> Identify unfamiliar concepts in the task and use introductory learning resources.</li><li><b>Build a practice case.</b> Expand your trial response into a short case study with assumptions, decisions and limitations.</li><li><b>Review and revise.</b> Ask a practitioner to review the criteria below. Explain the decisions yourself.</li><li><b>Prepare an application.</b> Compare your evidence with a current listing, verify hard requirements and describe practice work honestly.</li></ol><h3>Evidence criteria</h3>${r.criteria.map(c=>`<p>○ ${c} <small>— not assessed</small></p>`).join('')}<p class="v3-small">No readiness score or application recommendation is generated from saving a draft. Courses and employer requirements have not been verified.</p></section><form id="v3-evidence" class="v3-panel"><h2>Your practice case</h2><label>Project title<input name="title" required value="${esc(s.evidence[r.id]?.title||'')}"></label><label>Project link (optional)<input name="url" type="url" value="${esc(s.evidence[r.id]?.url||'')}" placeholder="https://"></label><label>Decisions, evidence and limitations<textarea name="body" required minlength="40">${esc(s.evidence[r.id]?.body||'')}</textarea></label><button class="button">Save project draft</button><p class="v3-small">${s.evidence[r.id]?'Draft saved. Awaiting an independent review.':'Stored locally in this browser. Do not include confidential material.'}</p>${button('Download my evidence','export')}<a class="button" href="#/community">Ask for a perspective ↗</a></form></div>`}
function bind(root){root.querySelectorAll('[data-v3]').forEach(b=>b.onclick=()=>{message='';const a=b.dataset.v3;if(a==='export'){const blob=new Blob([JSON.stringify(s,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='find-yourjob-evidence.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return}if(a==='try'){active=b.dataset.role;view='try'}else if(a==='choose'){s.target=b.dataset.role;save();view='evidence'}else view=a;render()});root.querySelector('#v3-city')?.addEventListener('change',e=>{s.city=e.target.value;save();render()});root.querySelector('#v3-reflect')?.addEventListener('submit',e=>{e.preventDefault();s.notes[active]=Object.fromEntries(new FormData(e.target));save();view='compare';render()});root.querySelector('#v3-evidence')?.addEventListener('submit',e=>{e.preventDefault();s.evidence[s.target]=Object.fromEntries(new FormData(e.target));save();render()})}
function mount(){if(location.hash && location.hash!=='#/discover')return;const main=document.querySelector('#main');if(main&&!document.getElementById('v3-root')){main.innerHTML='<div id="v3-root"></div>';render()}}
new MutationObserver(mount).observe(document.querySelector('#app'),{childList:true});window.addEventListener('hashchange',()=>{view='explore';mount()});mount();
// Conversation-led discovery. Existing trials and evidence views remain available.
const questions=[
{key:'city',text:'Where would you like your next chapter to happen?',choices:['Austin, TX','New York, NY','San Francisco, CA','Remote in the US']},
{key:'energy',text:'What kind of work gives you energy—even if you have never done it professionally?',choices:['Finding patterns','Helping people','Understanding people','I’m not sure yet']},
{key:'avoid',text:'What would you like less of in your next working day?',choices:['Constant interruptions','Repetitive tasks','Unclear expectations','Too much time alone']},
{key:'time',text:'How much time could you comfortably explore or learn each week?',choices:['2–3 hours','4–6 hours','7–10 hours','Help me figure it out']}
];
let chat;try{chat=JSON.parse(localStorage.getItem('fyj-conversation-v1'))}catch{}if(!chat||!Array.isArray(chat.answers))chat={answers:[]};let chatNotice='';
const originalRender=render;
render=function(){if(view!=='explore'){originalRender();const root=document.getElementById('v3-root');if(root){const back=document.createElement('button');back.className='button';back.textContent='← Back to conversation';back.onclick=()=>{view='explore';render()};root.prepend(back)}return}renderConversation()};
function saveChat(){try{localStorage.setItem('fyj-conversation-v1',JSON.stringify(chat))}catch{chatNotice='Your answers could not be saved. They will remain available in this tab.'}}
function renderConversation(){const root=document.getElementById('v3-root');if(!root)return;const step=Math.min(chat.answers.length,questions.length),q=questions[step];const selected=chat.answers[1]||'';const ordered=[...roles].sort((a,b)=>{const preferred=/pattern/i.test(selected)?'data':/help/i.test(selected)?'success':/understand/i.test(selected)?'research':'';return Number(b.id===preferred)-Number(a.id===preferred)});
root.innerHTML=`<div class="chat-layout"><section class="chat-main"><header class="chat-heading"><div><span class="ai-orb">✳</span><strong>Your career companion</strong><span class="chat-demo">Guided demo</span></div><button class="plain" id="chat-edit">${step?'Edit answers':'Start fresh'}</button></header><div class="chat-intro"><p class="eyebrow">A LITTLE CURIOSITY. A NEW POSSIBILITY.</p><h1>Let’s find work<br>that feels like you.</h1><p>You don’t need a job title—or a perfect resume.<br>We’ll figure out one small step at a time.</p></div><div class="chat-thread" aria-label="Career exploration conversation"><div class="chat-ai"><span class="ai-orb">✳</span><p>Hi, I’m here to help you explore your next move. Let’s start with the life you want your work to fit into.</p></div>${chat.answers.map((answer,i)=>`<div class="chat-ai"><span class="ai-orb">✳</span><p>${questions[i].text}</p></div><div class="chat-user">${esc(answer)}</div>`).join('')}<div class="chat-ai"><span class="ai-orb">✳</span><div><p>${q?q.text:'Here are three different working days to explore. Start with whichever makes you curious.'}</p>${q?'':`<p class="v3-small">${/pattern|help|understand/i.test(selected)?'Your stated interest determines which sample appears first.':'These are contrasting samples to help you discover a preference.'} Your past experience does not restrict these possibilities. We have not verified city availability or team conditions.</p>`}</div></div>${q?`<div class="chat-choices">${q.choices.map(c=>`<button class="button" data-answer="${esc(c)}">${c}</button>`).join('')}</div>`:`<div class="chat-results">${ordered.map(r=>`<article class="chat-role"><div class="chat-role-icon" style="background:${r.color}">${r.symbol}</div><div><h2>${r.name}</h2><p>${r.fit}</p><p>${r.work}</p><small>${r.cost}</small><p class="v3-small">Team fit unknown · Preparation not assessed</p><button class="button" data-trial="${r.id}">Try a 20-minute task ↗</button><button class="plain" data-details="${r.id}">Why explore this?</button></div></article>`).join('')}</div><div class="chat-choices"><button class="button" id="chat-compare">Compare my experiences</button><button class="button" id="chat-evidence">Continue my evidence plan</button></div>`}</div>${q?`<form id="chat-form" class="chat-composer"><label class="sr-only" for="chat-answer">Your answer</label><input id="chat-answer" autocomplete="off" maxlength="500" required placeholder="${step===0?'Type any city or remote preference…':'Tell me in your own words…'}"><button class="button" aria-label="Send answer">Send ↑</button></form>`:''}<p class="chat-disclosure">Scripted interaction preview · Sample roles, no live jobs or AI analysis · Answers stay on this device</p><p role="status">${esc(chatNotice)}</p></section><aside class="chat-context"><p class="eyebrow">YOUR NEXT CHAPTER</p><h2>A direction takes shape.</h2><p>No need to have all the answers.</p><div class="chat-progress"><span style="width:${step/4*100}%"></span></div><small>${step} of 4 starting questions</small>${questions.map((q,i)=>`<div class="chat-fact"><span>${['Location','What gives you energy','What you want less of','Time to explore'][i]}</span><b>${esc(chat.answers[i]||'We’ll explore this together')}</b></div>`).join('')}<div class="chat-next"><span>UP NEXT</span><h3>Experience a working day.</h3><p>Try a small task before investing months in a new direction.</p></div><a class="button" href="#/community">Ask someone doing the work ↗</a></aside></div>`;
const answer=value=>{if(!value.trim())return;chat.answers.push(value.trim());if(step===0){s.city=value.trim();save()}saveChat();render();requestAnimationFrame(()=>root.querySelector('#chat-form')?.scrollIntoView({block:'nearest',behavior:'smooth'}))};root.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>answer(b.dataset.answer));root.querySelector('#chat-form')?.addEventListener('submit',e=>{e.preventDefault();answer(root.querySelector('#chat-answer').value)});root.querySelector('#chat-edit').onclick=()=>{chat.answers=[];saveChat();render()};root.querySelectorAll('[data-trial]').forEach(b=>b.onclick=()=>{active=b.dataset.trial;view='try';originalRender();render()});root.querySelectorAll('[data-details]').forEach(b=>b.onclick=()=>{const r=roles.find(r=>r.id===b.dataset.details);chatNotice=`${r.name}: ${r.work} This is an exploration prompt, not a confirmed fit. Your preference about “${chat.answers[2]}” needs to be checked with someone on the actual team.`;render()});root.querySelector('#chat-compare')?.addEventListener('click',()=>{view='compare';render()});root.querySelector('#chat-evidence')?.addEventListener('click',()=>{view='evidence';render()})}
render();
// Resume-first entry. Raw resume text remains in memory and is never persisted.
let resumeText='',resumeSource='',resumeConfirmed=false,resumeError='';
const conversationAfterResume=renderConversation;
renderConversation=function(){if(resumeConfirmed){conversationAfterResume();const root=document.getElementById('v3-root');const header=root?.querySelector('.chat-heading');if(header){const edit=document.createElement('button');edit.className='plain';edit.textContent='Review background';edit.onclick=()=>{resumeConfirmed=false;render()};header.append(edit)}return}renderResumeEntry()};
function renderResumeEntry(){const root=document.getElementById('v3-root');if(!root)return;root.innerHTML=`<div class="chat-layout"><section class="chat-main"><header class="chat-heading"><div><span class="ai-orb">✳</span><strong>Your career companion</strong><span class="chat-demo">Guided demo</span></div></header><div class="chat-intro"><p class="eyebrow">FIRST, YOUR STORY</p><h1>Start with where<br>you’ve been.</h1><p>Your experience is a starting point.<br>Your next chapter can be something entirely different.</p></div><div class="chat-ai"><span class="ai-orb">✳</span><p>${resumeText?'Here is the background you shared. Please check the text before we prepare personalized work choices.':'Let’s start with your resume, so you don’t have to explain your whole background from scratch. Upload your PDF or Word resume to get started.'}</p></div><form id="resume-form" class="v3-panel"><div class="resume-upload">↑ Import your resume<input id="resume-file" type="file" accept=".txt,text/plain" hidden><div class="resume-file-control"><button class="button" id="resume-file-button" type="button" aria-describedby="resume-file-status">Choose file</button><span id="resume-file-status" role="status">${esc(/\.(pdf|docx|txt)$/i.test(resumeSource)?resumeSource:'No file chosen')}</span></div><span class="v3-small">UTF-8 TXT · Under 5 MB. Any source language. For PDF or Word, paste the text below.</span></div>${resumeSource?`<p class="v3-small">Source: ${esc(resumeSource)}</p>`:''}<label for="resume-text">${resumeText?'Review your imported background':'Or paste your resume / describe your experience'}</label><textarea id="resume-text" required minlength="40" maxlength="100000" placeholder="Experience, education, projects and skills…" style="min-height:220px">${esc(resumeText)}</textarea><p class="v3-small">Remove contact details or anything you don’t want to share. Confirmed resume text is saved in this browser. You can clear it in Settings &amp; your data.</p><p role="status" class="resume-error">${esc(resumeError)}</p><button class="button" type="submit">Confirm & continue →</button><button class="plain" type="button" id="resume-sample">Try a sample resume</button></form><p class="chat-disclosure">Your resume is read locally. AI processing begins after you confirm the provider on the next screen.</p></section><aside class="chat-context"><p class="eyebrow">ONE STEP AT A TIME</p><h2>Your experience.<br>Your possibilities.</h2><div class="chat-fact"><span>01 / START HERE</span><b>Import & confirm your background</b></div><div class="chat-fact"><span>02 / REFLECT</span><b>Choose work that interests you</b></div><div class="chat-fact"><span>03 / EXPLORE</span><b>Compare different working days</b></div><div class="chat-fact"><span>04 / PREPARE</span><b>Try the work. Build evidence.</b></div><p>Your previous job titles will not exclude new directions.</p></aside></div>`;
root.querySelector('#resume-file').onchange=async event=>{const file=event.target.files[0];if(!file)return;const draft=root.querySelector('#resume-text').value;resumeText=draft;resumeError='';if(!/\.txt$/i.test(file.name)||!validateResumeSize(file.size)){resumeError='Please choose a non-empty UTF-8 TXT file smaller than 5 MB (5,000,000 bytes), or paste your resume text.';render();return}try{const text=await file.text();if(text.trim().length<40)throw Error('There is not enough readable text. Paste at least 40 characters of your experience.');if(text.length>100000)throw Error('Please shorten the text to 100,000 characters.');resumeText=text;resumeSource=file.name}catch(error){resumeError=error.message}render()};root.querySelector('#resume-form').onsubmit=event=>{event.preventDefault();const value=root.querySelector('#resume-text').value.trim();if(value.length<40)return;resumeText=value;resumeSource=resumeSource||'Pasted background';resumeConfirmed=true;resumeError='';saveResumeProfile();render()};root.querySelector('#resume-sample').onclick=()=>{resumeSource='Illustrative sample — not your profile';resumeText='Retail Team Lead | 2021–2025\nCoordinated weekly schedules for a team of eight. Trained new colleagues, resolved customer issues and prepared weekly sales reports.\nEducation: BA in Communications, 2021.\nSkills: Excel, customer communication, scheduling and team coordination.\nProject: Created a simple onboarding checklist for new colleagues.';resumeError='';render()}}
questions[1].text='Thinking about your experience, what would you like to keep doing—or explore more of?';
questions[2].text='What would you most like to change about your previous working day?';
render();

// PDF and Word extraction through the local, in-memory document reader.
const resumeWithImport=renderResumeEntry;
renderResumeEntry=function(){resumeWithImport();const root=document.getElementById('v3-root');if(!root)return;const input=root.querySelector('#resume-file');input.accept='.pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain';root.querySelector('.resume-upload .v3-small').textContent='PDF, Word (.docx), or UTF-8 TXT · Smaller than 5 MB';const privacy=root.querySelector('#resume-text').nextElementSibling;privacy.textContent='PDF and Word files are read by a service on this computer, in memory, without saving the file. Confirmed text is saved in this browser. Clear it in Settings & your data. Scanned PDFs require OCR, which is not yet available.';
const chooseFile=root.querySelector('#resume-file-button');
chooseFile.onclick=()=>input.click();
const textHandler=input.onchange;
input.onchange=async event=>{const file=event.target.files[0];if(!file)return;root.querySelector('#resume-file-status').textContent=file.name;const kind=file.name.split('.').pop().toLowerCase();if(kind==='txt'){await textHandler(event);return}resumeText=root.querySelector('#resume-text').value;resumeError='';if(!validateResumeSize(file.size)){resumeError='Choose a non-empty file smaller than 5 MB (5,000,000 bytes).';render();return}if(!['pdf','docx'].includes(kind)){resumeError='Use PDF or Word (.docx). Save legacy .doc files as .docx first.';render();return}input.disabled=true;chooseFile.disabled=true;const submit=root.querySelector('button[type="submit"]');submit.disabled=true;root.querySelector('.resume-error').textContent='Reading your document…';try{const response=await fetch(`/api/resume/parse/${kind}`,{method:'POST',headers:{'Content-Type':'application/octet-stream'},body:file,signal:AbortSignal.timeout(30000)});const result=await response.json();if(!response.ok)throw Error(result.error||'Unable to read this document.');resumeText=result.text;resumeSource=file.name;resumeError='Text extracted. Please check dates, columns and reading order before continuing.'}catch(error){resumeError=error.name==='TimeoutError'?'Reading took too long. Try exporting a simpler document.':error instanceof TypeError?'The local document reader is unavailable. Start the resume service and retry.':error.message}render()};};
render();

// Contextual conversation replaces the scripted four-question flow entirely.
let guidance={resume:'',turns:[],responses:[],busy:false,error:'',status:null,consent:false,generation:0};
const beforeGuidance=renderConversation;
renderConversation=function(){if(!resumeConfirmed){beforeGuidance();return}if(guidance.resume!==resumeText){guidance={resume:resumeText,turns:[],responses:[],busy:false,error:'',status:null,consent:false,generation:guidance.generation+1};checkGuidance()}renderGuidance()};
async function checkGuidance(){const generation=guidance.generation;try{const response=await fetch('/api/ai/status',{signal:AbortSignal.timeout(5000)});if(!response.ok)throw Error();const status=await response.json();if(generation!==guidance.generation)return;guidance.status=status;guidance.error=''}catch{if(generation!==guidance.generation)return;guidance.status={ready:false};guidance.error='The local guidance service is unavailable.'}if(resumeConfirmed)renderGuidance()}
async function askGuidance(value,adapt=data=>data){if(guidance.busy||!guidance.status?.ready||!guidance.consent)return;if(value)guidance.turns.push({role:'user',content:value});const generation=guidance.generation;guidance.busy=true;guidance.error='';renderGuidance();try{const response=await fetch('/api/ai/conversation',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({resume:guidance.resume,turns:guidance.turns,consent:true}),signal:AbortSignal.timeout(60000)});const responseData=await response.json();if(!response.ok)throw Error(responseData.error);if(generation!==guidance.generation)return;const data=adapt(responseData);guidance.responses.push(data);guidance.turns.push({role:'assistant',content:JSON.stringify(data)})}catch(error){if(generation!==guidance.generation)return;guidance.error=error.name==='TimeoutError'?'The response took too long. Your answer is preserved; retry when ready.':error.message}finally{if(generation===guidance.generation){guidance.busy=false;if(resumeConfirmed)renderGuidance()}}}
function renderGuidance(){const root=document.getElementById('v3-root');if(!root||!resumeConfirmed||view!=='explore')return;const latest=guidance.responses.at(-1);const ready=guidance.status?.ready;root.innerHTML=`<div class="chat-layout"><section class="chat-main"><header class="chat-heading"><div><span class="ai-orb">✳</span><strong>Your career companion</strong></div><button class="plain" id="guidance-background">Review resume</button></header><div class="chat-intro"><p class="eyebrow">YOUR EXPERIENCE IS THE STARTING POINT</p><h1>Let’s make sense<br>of your next move.</h1><p>Your choices are ready. Let’s explore where they could take you.</p></div><div class="chat-thread" aria-live="polite">${guidance.turns.map(turn=>{if(turn.role==='user')return `<div class="chat-user">${esc(/^(My confirmed preferences: |I updated my preferences\.)/.test(turn.content) ? 'Use my selected preferences to explore career directions.' : turn.content)}</div>`;const reply=JSON.parse(turn.content);return `<div class="chat-ai"><span class="ai-orb">✳</span><div><p>${esc(reply.message)}</p><p><strong>${esc(reply.question)}</strong></p>${reply.facts.length?`<details><summary>From your resume</summary>${reply.facts.map(f=>`<p>${esc(f.claim)}</p><blockquote>${esc(f.quote)}</blockquote>`).join('')}</details>`:''}${reply.directions.map(d=>`<article class="chat-role"><div><h2>${esc(d.title)}</h2><p>${esc(d.reason)}</p><p><b>Tradeoff:</b> ${esc(d.tradeoff)}</p><p><b>Try this:</b> ${esc(d.experiment)}</p><small>Career hypothesis · No live vacancy verified</small></div></article>`).join('')}</div></div>`}).join('')}${!guidance.turns.length?`<section class="v3-panel"><h2>Your resume is ready.</h2><p>${!guidance.status?'Checking the guidance service…':ready?`The assistant will read your resume and ask about specific experiences. Your resume and replies will be processed by ${esc(guidance.status.provider)}.`:'Personalized guidance needs an AI connection. Your document has been read, but your background has not yet been analyzed.'}</p>${ready?'<button class="button" id="guidance-start">Continue with AI guidance →</button>':'<button class="button" id="guidance-check">Check connection</button>'}</section>`:''}${guidance.busy?'<p role="status">Reading your background and latest answer…</p>':''}${guidance.error?`<div role="alert" class="v3-panel"><p>${esc(guidance.error)}</p>${ready?'<button class="button" id="guidance-retry">Retry this turn</button>':''}</div>`:''}</div>${latest&&!guidance.error&&!guidance.busy?`<div class="chat-choices">${latest.suggestions.map(x=>`<button class="button" data-guidance-answer="${esc(x)}">${esc(x)}</button>`).join('')}</div><form id="guidance-form" class="chat-composer"><label class="sr-only" for="guidance-answer">Your reply or correction</label><input id="guidance-answer" required maxlength="4000" placeholder="Reply, correct something, or tell me what matters…"><button class="button">Send ↑</button></form>`:''}<p class="chat-disclosure">Confirmed resume text stays in this browser. AI guidance sends it to the disclosed provider. Job availability is checked separately in Discover. LinkedIn is not connected.</p></section><aside class="chat-context"><p class="eyebrow">WHAT WE’RE LEARNING</p><h2>Your direction,<br>in your words.</h2>${[['Keep',latest?.keep],['Change',latest?.change],['Still to explore',latest?.unknowns]].map(([label,items])=>`<div class="chat-fact"><span>${label}</span>${items?.length?items.map(x=>`<p>${esc(x)}</p>`).join(''):'<p>Not established yet</p>'}</div>`).join('')}<p>You can correct any interpretation in the conversation.</p></aside></div>`;
root.querySelector('#guidance-background').onclick=()=>{resumeConfirmed=false;render()};root.querySelector('#guidance-check')?.addEventListener('click',checkGuidance);root.querySelector('#guidance-start')?.addEventListener('click',()=>{guidance.consent=true;askGuidance()});root.querySelector('#guidance-retry')?.addEventListener('click',()=>askGuidance());root.querySelectorAll('[data-guidance-answer]').forEach(b=>b.onclick=()=>askGuidance(b.dataset.guidanceAnswer));root.querySelector('#guidance-form')?.addEventListener('submit',event=>{event.preventDefault();const value=root.querySelector('#guidance-answer').value.trim();if(value)askGuidance(value)})}
render();
// Fast preference setup before contextual AI guidance.
let prefs={work:[],places:[],arrangement:[],style:[],currency:'USD',period:'Year',minimum:'',maximum:'',salaryUnknown:true},prefStep=0,prefDone=false,prefResume='',prefNotice='';
try{const saved=JSON.parse(localStorage.getItem('fyj-preferences-v1'));if(saved&&Array.isArray(saved.work)&&Array.isArray(saved.places)&&Array.isArray(saved.arrangement)&&Array.isArray(saved.style))prefs={...prefs,...saved}}catch{}
const contextualGuidance=renderGuidance;
const prefTitles=['What would you like to do?','Where would you like to work?','Which work arrangement suits you?','What salary would work for you?','How would you like to work?','Your starting preferences'];
function prefTags(field,items){return `<div class="pref-tags">${items.map(x=>`<button type="button" aria-pressed="${prefs[field].includes(x)}" data-pref-field="${field}" data-pref-value="${esc(x)}">${esc(x)}${prefs[field].includes(x)?' ✓':''}</button>`).join('')}</div>`}
function prefSummary(){return {desired_work:prefs.work,spoken_requirements:prefs.jobRequirements||'',locations:prefs.places,work_arrangement:prefs.arrangement,working_style:prefs.style,salary:{currency:prefs.currency,period:prefs.period,minimum:prefs.minimum||null,desired_upper:prefs.maximum||null,include_undisclosed:prefs.salaryUnknown},note:'These are user-selected preferences, not inferred from the resume. Empty selections mean open/unknown. Start with desired work. Do not repeat answered questions or lead with dislikes. Give career hypotheses only; no verified job feed exists.'}}
renderGuidance=function(){if(!resumeConfirmed||view!=='explore')return;if(prefResume!==resumeText){prefResume=resumeText;prefDone=false;prefStep=0}if(prefDone){contextualGuidance();const root=document.getElementById('v3-root');const header=root?.querySelector('.chat-heading');if(header){const edit=document.createElement('button');edit.className='plain';edit.textContent='Edit preferences';edit.onclick=()=>{prefDone=false;prefStep=0;renderGuidance()};header.append(edit)}const start=root?.querySelector('#guidance-start');if(start)start.onclick=()=>{guidance.consent=true;askGuidance('My current preferences: '+JSON.stringify(prefSummary()))};return}renderPreferenceSetup()};
function renderPreferenceSetup() {
  const root=document.getElementById('v3-root');
  if (!root) return;
  const sections=[
    () => personalizedWorkTags()+voicePreferences()+
      '<label>Add a work type<input id="pref-custom" maxlength="100"></label><button type="button" class="button" id="pref-add">Add</button>',
    () => prefTags('places',[...new Set(['United States','United Kingdom','Canada','Australia','Singapore',...prefs.places])])+
      '<label>Add a country, region or city<input id="pref-custom" maxlength="100"></label><button type="button" class="button" id="pref-add">Add location</button>',
    () => prefTags('arrangement',['Remote','Hybrid','On-site']),
    () => '<div class="pref-fields"><label>Currency<select id="pref-currency">'+selectOptions(['USD','EUR','GBP','CAD','AUD','SGD','CNY','JPY','INR'],prefs.currency)+'</select></label>'+
      '<label>Base pay per<select id="pref-period">'+selectOptions(['Year','Month','Hour'],prefs.period)+'</select></label>'+
      '<label>Minimum acceptable<input id="pref-min" type="number" min="0" step="any" value="'+esc(prefs.minimum)+'" placeholder="Open"></label>'+
      '<label>Desired upper range<input id="pref-max" type="number" min="0" step="any" value="'+esc(prefs.maximum)+'" placeholder="Open"></label></div>'+
      '<label class="pref-check"><input type="checkbox" id="pref-undisclosed" '+(prefs.salaryUnknown?'checked':'')+'> Include roles with undisclosed salary</label>',
    () => prefTags('style',['Customer-facing','Frequent team collaboration','Long focus blocks','Deep technical work','Creative exploration','Structured routines','Flexible schedule']),
    () => [['Work content',prefs.work],['Locations',prefs.places],['Arrangement',prefs.arrangement],['Working style',prefs.style],
      ['Base pay',prefs.minimum||prefs.maximum?[prefs.currency+' '+(prefs.minimum||'Open')+' – '+(prefs.maximum||'Open')+' / '+prefs.period]:[]],
      ['Other requirements',prefs.jobRequirements?[prefs.jobRequirements]:[]]]
      .map(([label,values])=>'<div class="chat-fact"><span>'+label+'</span><b>'+esc(values.join(' · ')||'Open to explore')+'</b></div>').join(''),
  ];
  function selectOptions(items,selected) {
    return items.map(item=>'<option'+(item===selected?' selected':'')+'>'+item+'</option>').join('');
  }
  root.innerHTML='<section class="pref-shell"><header class="chat-heading"><div><span class="ai-orb">✳</span><strong>A few quick choices</strong></div><span>'+(prefStep+1)+' / 6</span></header>'+
    '<div class="chat-progress"><span style="width:'+((prefStep+1)/6*100)+'%"></span></div><div class="chat-intro"><h1>'+prefTitles[prefStep]+'</h1>'+
    '<p>'+(prefStep===5?'Check your choices before finding matches.':'Choose what fits, or leave it open.')+'</p></div>'+
    '<form id="pref-form">'+sections[prefStep]()+'<p role="status">'+esc(prefNotice)+'</p><div class="pref-actions">'+
    (prefStep?'<button type="button" class="button" id="pref-back">← Back</button>':'')+
    '<button class="button" type="submit">'+(prefStep===5?'Confirm preferences →':'Continue →')+'</button>'+
    (prefStep<5?'<button type="button" class="plain" id="pref-skip">Keep this open</button>':'')+'</div></form></section>';
  connectVoicePreferences(root);
  function capture() {
    const requirements=root.querySelector('#job-requirements');
    if (requirements) prefs.jobRequirements=requirements.value.trim();
    const custom=root.querySelector('#pref-custom')?.value.trim();
    if (custom) {
      const field=prefStep===0?'work':'places';
      if (!prefs[field].includes(custom)) prefs[field].push(custom);
    }
    if (prefStep===3) {
      prefs.currency=root.querySelector('#pref-currency').value;
      prefs.period=root.querySelector('#pref-period').value;
      prefs.minimum=root.querySelector('#pref-min').value;
      prefs.maximum=root.querySelector('#pref-max').value;
      prefs.salaryUnknown=root.querySelector('#pref-undisclosed').checked;
    }
  }
  root.querySelectorAll('[data-pref-field]').forEach(button=>button.onclick=()=>{
    capture();
    const {prefField,prefValue}=button.dataset;
    prefs[prefField]=prefs[prefField].includes(prefValue)?prefs[prefField].filter(value=>value!==prefValue):[...prefs[prefField],prefValue];
    renderPreferenceSetup();
  });
  root.querySelector('#pref-add')?.addEventListener('click',()=>{capture();renderPreferenceSetup();});
  root.querySelector('#pref-back')?.addEventListener('click',()=>{capture();prefNotice='';prefStep--;renderPreferenceSetup();});
  root.querySelector('#pref-skip')?.addEventListener('click',()=>{
    const field=['work','places','arrangement',null,'style'][prefStep];
    if (field) prefs[field]=[];
    if (prefStep===0) prefs.jobRequirements='';
    if (prefStep===3) {prefs.minimum='';prefs.maximum='';prefs.salaryUnknown=true;}
    prefNotice='';prefStep++;renderPreferenceSetup();
  });
  root.querySelector('#pref-form').onsubmit=event=>{
    event.preventDefault();capture();
    if (prefStep===3 && prefs.minimum!=='' && prefs.maximum!=='' && Number(prefs.minimum)>Number(prefs.maximum)) {
      prefNotice='The upper range must be at least your minimum.';renderPreferenceSetup();return;
    }
    prefNotice='';
    if (prefStep<5) {prefStep++;renderPreferenceSetup();return;}
    try {localStorage.setItem('fyj-preferences-v1',JSON.stringify(prefs));} catch {}
    prefDone=true;exploreIndex=0;
    const request='My confirmed preferences: '+JSON.stringify(prefSummary())+freshDirectionRequest;
    freshDirectionRequest='';
    renderGuidance();
    if (guidance.consent) askGuidance(request);
  };
}

render();
// Analyze the resume BEFORE displaying any work-content tags.
let workOptions={resume:'',data:null,busy:false,error:'',generation:0};
function personalizedWorkTags(){const options=workOptions.data?.options||[];return `${workOptions.data?`<p class="v3-small">${esc(workOptions.data.summary)}</p>`:''}${[['experience','From your experience'],['adjacent','Use your strengths differently'],['explore','Explore something new']].map(([kind,title])=>`<p class="eyebrow">${title}</p><div class="pref-tags">${options.filter(o=>o.kind===kind).map(o=>`<button type="button" aria-pressed="${prefs.work.includes(o.label)}" data-pref-field="work" data-pref-value="${esc(o.label)}" title="${esc(o.reason)}">${esc(o.label)}${prefs.work.includes(o.label)?' ✓':''}<small style="display:block;max-width:230px;white-space:normal;margin-top:6px;font-size:11px;font-weight:400">${esc(o.reason)}</small></button>`).join('')}</div>`).join('')}${prefTags('work',prefs.work.filter(label=>!options.some(o=>o.label===label)))}`}
const tagSetupGuidance=renderGuidance;
renderGuidance=function(){if(!resumeConfirmed||view!=='explore')return;if(workOptions.resume!==resumeText){workOptions={resume:resumeText,data:null,busy:false,error:'',generation:workOptions.generation+1};prefDone=false;prefStep=0;prefs.work=[]}if(workOptions.data){tagSetupGuidance();return}const root=document.getElementById('v3-root');if(!root)return;root.innerHTML=`<section class="pref-shell"><div class="chat-intro"><p class="eyebrow">START WITH YOUR EXPERIENCE</p><h1>${workOptions.busy?'Finding possibilities<br>in your experience.':'Your resume is ready.'}</h1><p>${workOptions.busy?'Preparing a mix of familiar activities, adjacent opportunities and new directions.':guidance.status?.ready?`Analyze your resume with ${esc(guidance.status.provider)} to personalize your choices. Then select what interests you, one step at a time.`:'Checking the AI connection before preparing your choices.'}</p></div>${workOptions.error?`<p role="alert">${esc(workOptions.error)}</p>`:''}${!workOptions.busy?`<button class="button" id="prepare-options">${guidance.status?.ready?'Analyze resume & continue →':'Check connection'}</button><button class="plain" id="options-review" style="margin-left:20px">Review resume</button>`:'<p role="status">Preparing your choices. This request will stop after 45 seconds.</p><button class="button" id="cancel-options">Cancel</button>'}</section>`;root.querySelector('#cancel-options')?.addEventListener('click',()=>{optionsAbort?.abort();workOptions.generation++;workOptions.busy=false;workOptions.error='Analysis cancelled. Your resume is still here.';renderGuidance()});root.querySelector('#options-review')?.addEventListener('click',()=>{resumeConfirmed=false;render()});root.querySelector('#prepare-options')?.addEventListener('click',()=>{if(!guidance.status?.ready){checkGuidance();return}prepareWorkOptions()})};
let optionsAbort;
async function prepareWorkOptions(){if(workOptions.busy)return;const generation=workOptions.generation;optionsAbort=new AbortController();const deadline=setTimeout(()=>optionsAbort.abort(),45000);workOptions.busy=true;workOptions.error='';guidance.consent=true;renderGuidance();try{const response=await fetch('/api/ai/conversation',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({resume:resumeText,turns:[],mode:'options',consent:true}),signal:optionsAbort.signal});const result=await response.json();if(!response.ok)throw Error(result.error||'Unable to prepare your choices.');if(generation!==workOptions.generation)return;workOptions.data=result}catch(error){if(generation!==workOptions.generation)return;workOptions.error=['TimeoutError','AbortError'].includes(error.name)?'Analysis took too long. Please retry.':error.message}finally{clearTimeout(deadline);if(generation===workOptions.generation){workOptions.busy=false;if(resumeConfirmed)renderGuidance()}}}
render();
// Recommendations become a selectable workspace, not another interview.
let exploreIndex=0,exploreFeedback=[];
try{const events=JSON.parse(localStorage.getItem('fyj-exploration-feedback-v1'));if(Array.isArray(events))exploreFeedback=events}catch{}
function persistExploreFeedback() {
  try { localStorage.setItem('fyj-exploration-feedback-v1', JSON.stringify(exploreFeedback)); }
  catch { /* Feedback still applies for the current session. */ }
}
const beforeExplorer=renderGuidance;
renderGuidance=function(){const latest=guidance.responses.at(-1);if(resumeConfirmed&&view==='explore'&&prefDone&&latest?.directions?.length){renderExplorer(latest);return}beforeExplorer()};
function renderExplorer(reply){const root=document.getElementById('v3-root');if(!root)return;exploreIndex=Math.min(exploreIndex,reply.directions.length-1);const selected=reply.directions[exploreIndex];root.innerHTML=`<section class="explore-workspace"><header class="chat-heading"><div><span class="ai-orb">✳</span><strong>Explore your possibilities</strong></div><button class="plain" id="explore-edit">Reset job recommendations</button></header><div class="chat-intro"><p class="eyebrow">SEE WHAT YOUR NEXT CHAPTER COULD LOOK LIKE</p><h1>Find the work that draws you in.</h1><p>Choose a direction. Explore the roles. Tell us what feels right.</p></div><div class="explore-columns"><aside class="explore-directions"><p class="eyebrow">DIRECTIONS TO EXPLORE</p>${reply.directions.map((d,i)=>`<button class="explore-direction ${i===exploreIndex?'selected':''}" data-direction="${i}" aria-pressed="${i===exploreIndex}"><b>${esc(d.title)}</b><span>${esc(d.reason)}</span></button>`).join('')}<div class="v3-panel"><h3>What to consider</h3><p>${esc(selected.tradeoff)}</p></div></aside><div class="explore-jobs"></div></div></section>`;
root.querySelectorAll('[data-direction]').forEach(b=>b.onclick=()=>{exploreIndex=Number(b.dataset.direction);renderGuidance()});root.querySelector('#explore-edit').onclick=()=>{resetDirections()};}

function voicePreferences() {
  return '<fieldset class="v3-panel"><legend>Optional job requirements</legend><label for="job-requirements">Describe the work you want</label><textarea id="job-requirements" maxlength="1200" placeholder="For example: remote creative work with fewer meetings">'+esc(prefs.jobRequirements||'')+'</textarea><label>Voice language <select id="voice-language"><option value="en-US">English</option><option value="zh-CN">中文</option></select></label> <button type="button" class="button" id="job-mic">Start voice input</button><p role="status" id="voice-status"></p></fieldset>';
}
function connectVoicePreferences(root) {
  const mic=root.querySelector('#job-mic');
  if (!mic) return;
  const input=root.querySelector('#job-requirements'), status=root.querySelector('#voice-status');
  const Recognition=window.SpeechRecognition || window.webkitSpeechRecognition;
  let speech;
  
  mic.onclick=()=>{
    if (speech) {speech.stop();return;}
    if (!Recognition) {status.textContent='Voice input is unavailable here. Type your requirements above.';return;}
    speech=new Recognition();
    speech.lang=root.querySelector('#voice-language').value;
    speech.onresult=event=>{
      if (!input.isConnected) return;
      const transcript=Array.from(event.results,result=>result[0].transcript).join(' ');
      input.value=[input.value.trim(),transcript].filter(Boolean).join(' ').slice(0,1200);

      status.textContent='Review or edit the transcript before continuing.';
    };
    speech.onerror=()=>{status.textContent='Voice input failed. Check microphone permission or type instead.';};
    const observer=new MutationObserver(()=>{if (!input.isConnected) {observer.disconnect();speech?.abort();}});
    speech.onend=()=>{observer.disconnect();speech=undefined;mic.textContent='Start voice input';};
    try {speech.start();observer.observe(root,{childList:true,subtree:true});mic.textContent='Stop voice input';status.textContent='Listening…';}
    catch {observer.disconnect();speech=undefined;status.textContent='Could not start voice input. You can type instead.';}
  };
}

let freshDirectionRequest='';
const exhaustedDirections=new Set();
function resetDirections() {
  const previous=guidance.responses.at(-1)?.directions||[];
  freshDirectionRequest=' Recommend a fresh set of directions substantially different from '+JSON.stringify(previous.map(item=>item.title));
  exhaustedDirections.clear();
  
  prefs.jobRequirements='';
  exploreFeedback=exploreFeedback.filter(event=>event.action!=='dislike');
  persistExploreFeedback();
  guidance.generation++;
  guidance.busy=false;
  guidance.error='';
  prefDone=false;
  prefStep=0;
  renderGuidance();
}

function replaceExhaustedDirection(reply,direction) {
  if (guidance.busy || !guidance.status?.ready || !guidance.consent || exhaustedDirections.has(direction.title) ||
      !exploreFeedback.some(event=>event.direction===direction.title && event.action==='dislike')) return false;
  exhaustedDirections.add(direction.title);
  const occupied=new Set([...reply.directions.map(item=>item.title),...exhaustedDirections].map(title=>title.trim().toLowerCase()));
  askGuidance('Recommend fresh directions from these confirmed preferences: '+JSON.stringify(prefSummary())+
    '. This direction ran out of openings after dismissals. Return new directions and concrete role titles. Avoid '+JSON.stringify([...occupied]),response=>{
      const replacement=response.directions?.find(item=>!occupied.has(item.title.trim().toLowerCase()));
      if (!replacement) throw new Error('No new direction was returned. Reset job recommendations to try again.');
      return {...response,directions:reply.directions.map(item=>item===direction?replacement:item)};
    });
  return true;
}

function jobFeedback(target, onDismiss) {
  const listing = target.source === 'Adzuna' ? new URL(target.link).pathname : null;
  const latest = () => exploreFeedback.findLast(event =>
    event.direction === target.direction && event.role === target.title &&
    (event.listing ?? null) === listing);
  return {
    read: () => latest()?.action,
    set(action) {
      exploreFeedback.push({
        direction: target.direction, role: target.title, listing,
        action: latest()?.action === action ? null : action,
        reason: null, at: new Date().toISOString(),
      });
      persistExploreFeedback();
      if (action === 'dislike' && latest()?.action === 'dislike') onDismiss();
    },
  };
}

const renderGuidanceWithRoles = renderGuidance;
const jobRequests = new Map();
const jobChoices = new Map();
const jobMoney = new Intl.NumberFormat('en-US', {style:'currency',currency:'USD',maximumFractionDigits:0});

function loadAdzunaJobs(role, location, page) {
  const query = new URLSearchParams({role, location, page}).toString();
  const cached = jobRequests.get(query);
  if (cached && cached.expires > Date.now()) return cached.request;
  if (jobRequests.size >= 40) jobRequests.delete(jobRequests.keys().next().value);
  const request = fetch('/api/jobs?' + query).then(async response => {
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    return result.jobs;
  }).catch(error => {
    jobRequests.delete(query);
    throw error;
  });
  jobRequests.set(query, {request, expires:Date.now()+180000});
  return request;
}

function dismissedJob(job) {
  const family = title => String(title ?? '').toLowerCase().replace(/\b(?:senior|junior|sr|jr|lead|principal|entry level|i{1,3}|iv)\b/g,' ').replace(/[^a-z0-9]+/g,' ').trim();
  const title = family(job.title);
  const path = new URL(job.link).pathname;
  const latestByListing = new Map();
  for (const event of exploreFeedback) if (event.listing) latestByListing.set(event.listing, event);
  return [...latestByListing.values()].some(event => {
    if (event.action !== 'dislike') return false;
    const excluded = family(event.role);
    return event.listing === path || (title && excluded &&
      ((' '+title+' ').includes(' '+excluded+' ') || (' '+excluded+' ').includes(' '+title+' ')));
  });
}

function showLiveJobs(reply) {
  const right = document.querySelector('.explore-jobs');
  const direction = reply?.directions?.[exploreIndex] || reply?.directions?.[0];
  if (!right || !direction) return;
  const titles = [...new Set((direction.roles?.length ? direction.roles : [direction]).map(role => role.title))];
  const places = prefs.places.filter(place => !/^(open|anywhere|no preference)$/i.test(place));
  const locations = [...new Set([...places, 'United States'])];
  const choice = jobChoices.get(direction.title) || {};
  const role = titles.includes(choice.role) ? choice.role : titles[0];
  const location = locations.includes(choice.location) ? choice.location : locations[0];
  const options = (values, selected) => values.map(value =>
    '<option' + (value === selected ? ' selected' : '') + '>' + esc(value) + '</option>'
  ).join('');
  const section = document.createElement('section');
  section.className = 'v3-panel live-jobs';
  section.innerHTML = '<h3>Live job openings</h3><p class="v3-small">US listings from Adzuna. Locations and pay come from the listing feed.</p>' +
    '<div class="live-jobs-filters"><label>Role <select>' + options(titles, role) + '</select></label>' +
    '<label>Location <select>' + options(locations, location) + '</select></label></div>' +

    '<div aria-live="polite"></div>';
  right.prepend(section);
  const [roleSelect, locationSelect] = section.querySelectorAll('select');
  const results = section.querySelector('[aria-live]');
  let sequence = 0;
  let visibleJobs = [];
  async function refresh(refilling = false) {
    const current = ++sequence;
    const role = roleSelect.value;
    const location = locationSelect.value;
    jobChoices.set(direction.title, {role, location});
    const place = /^united states$/i.test(location) ? '' : location;
    if (!refilling) visibleJobs = [];
    visibleJobs = visibleJobs.filter(job => !dismissedJob(job));
    renderResults(visibleJobs, refilling ? 'Looking for replacements…' : 'Searching Adzuna…');
    try {
      const collected = new Map(visibleJobs.map(job => [new URL(job.link).pathname, job]));
      const alternatives = [...new Set([direction].flatMap(item =>
        (item.roles?.length ? item.roles : [item]).map(candidate => candidate.title)))].filter(title => title !== role);
      const searches = [[role, 1], ...alternatives.slice(0, 4).map(title => [title, 1]), [role, 2], [role, 3]];
      let successfulSearches = 0;
      let searchError = '';
      for (const [query, page] of searches) {
        if (collected.size >= 5) break;
        let batch;
        try {
          batch = await loadAdzunaJobs(query, place, page);
          successfulSearches++;
        } catch (error) {
          if (!section.isConnected || current !== sequence) return;
          searchError = error.message;
          continue;
        }
        if (!section.isConnected || current !== sequence) return;
        for (const job of batch) {
          if (dismissedJob(job)) continue;
          const key = new URL(job.link).pathname;
          if (!collected.has(key)) collected.set(key, job);
          if (collected.size >= 5) break;
        }
        visibleJobs = [...collected.values()];
        if (visibleJobs.length) renderResults(visibleJobs, 'Checking for more openings…');
      }
      visibleJobs = [...collected.values()];
      if (!visibleJobs.length && !successfulSearches) throw new Error(searchError);
      if (!visibleJobs.length && !searchError && replaceExhaustedDirection(reply,direction)) return;
      renderResults(visibleJobs, visibleJobs.length < 5 ? (guidance.busy && !visibleJobs.length ? 'Finding a new direction…' : guidance.error || searchError || 'No matching US openings for this role and location. Try another role or direction.') : '');
    } catch (error) {
      if (!section.isConnected || current !== sequence) return;
      renderResults(visibleJobs, error.message || 'Job search is unavailable right now.');
      const retry = document.createElement('button');
      retry.className = 'button';
      retry.textContent = 'Retry';
      retry.onclick = () => refresh(true);
      results.append(retry);
    }
  }
  function renderResults(jobs, message) {

      results.innerHTML = jobs.map(job => {
        const bounds = [...new Set([job.salaryMin,job.salaryMax].filter(value => Number.isFinite(value) && value > 0))];
        const salary = bounds.length ? bounds.map(value => jobMoney.format(value)).join(' – ') : 'Pay not listed';
        return '<article class="explore-job"><h4>' + esc(job.title || 'Job opening') + '</h4><p>' +
          esc([job.company,job.location].filter(Boolean).join(' · ')) + '</p><p>' + esc(salary) +
          (bounds.length && job.estimated ? ' · Adzuna estimate' : '') + '</p><p>' + esc(job.description || '') +
          '</p><a href="' + esc(job.link) + '" target="_blank" rel="noopener noreferrer">View opening ↗</a>' +
          ' · <a href="https://www.adzuna.com/" target="_blank" rel="noopener noreferrer">Adzuna</a></article>';
      }).join('') + (message ? '<p>' + esc(message) + '</p>' : '');
      results.querySelectorAll('.explore-job').forEach((card,index) => {
        const target = {source:'Adzuna',direction:direction.title,...jobs[index]};
        attachStudy(card,target,jobFeedback(target,() => refresh(true)));
      });
  }
  roleSelect.onchange = locationSelect.onchange = () => refresh();
  refresh();
}

renderGuidance = function () {
  renderGuidanceWithRoles();
  const reply = guidance.responses.at(-1);
  const direction = reply?.directions?.[exploreIndex];
  if (view !== 'explore' || !prefDone || !direction) return;
  showLiveJobs(reply);
};
const resumeProfileKey = 'fyj-resume-profile-v1';
let lastProfileJSON = '';

function saveResumeProfile() {
  if (!resumeConfirmed || resumeSource === 'Illustrative sample — not your profile') return;
  const options = workOptions.resume === resumeText ? workOptions.data : null;
  const latest = guidance.resume === resumeText ? guidance.responses.at(-1) : null;
  const snapshot = JSON.stringify({
    text:resumeText, source:resumeSource, options,
    directions:prefResume === resumeText && prefDone && latest?.directions?.length ? latest : null,
  });
  if (snapshot === lastProfileJSON) return;
  try {
    localStorage.setItem(resumeProfileKey, snapshot);
    lastProfileJSON = snapshot;
  } catch {
    resumeError = 'Browser storage is unavailable. Your resume is available for this session.';
  }
}

function restoreResumeProfile() {
  try {
    const raw = localStorage.getItem(resumeProfileKey);
    const profile = JSON.parse(raw);
    if (typeof profile?.text !== 'string' || profile.text.trim().length < 40 || profile.text.length > 100000) return;
    resumeText = profile.text;
    resumeSource = typeof profile.source === 'string' ? profile.source : 'Saved background';
    resumeConfirmed = true;
    lastProfileJSON = raw;
    if (Array.isArray(profile.options?.options)) {
      workOptions.resume = resumeText;
      workOptions.data = profile.options;
    }
    if (Array.isArray(profile.directions?.directions) && profile.directions.directions.length) {
      prefResume = resumeText;
      prefDone = true;
      guidance.resume = resumeText;
      guidance.responses = [profile.directions];
      guidance.consent = true;
      checkGuidance();
    }
  } catch {}
}

function clearResumeProfile() {
  optionsAbort?.abort();
  lastProfileJSON = '';
  resumeText = resumeSource = resumeError = '';
  resumeConfirmed = false;
  prefDone = false;
  prefResume = '';
  prefStep = 0;
  workOptions = {resume:'',data:null,busy:false,error:'',generation:workOptions.generation+1};
  guidance = {resume:'',turns:[],responses:[],busy:false,error:'',status:null,consent:false,generation:guidance.generation+1};
  render();
}
window.addEventListener('fyj:clear-resume', clearResumeProfile);
window.addEventListener('storage', event => {
  if (event.key === resumeProfileKey && event.newValue === null) clearResumeProfile();
});
const renderWithLiveJobs = renderGuidance;
renderGuidance = function () {
  renderWithLiveJobs();
  saveResumeProfile();
};
restoreResumeProfile();
initStudy(() => resumeConfirmed ? resumeText : '');
render();


