import { tracks, modules, sources, integrativeQuestion } from './src/curriculum.js';
import { createState, loadState, saveState, recordAttempt, getLevel, dueModules, summarize, evaluateAnswer, validateImport, markExposure } from './src/engine.js';
import { posterior, betExpectedValue, rollDecision, marketQuote } from './src/models.js';

const main = document.querySelector('main');
let storage;
try { storage = window.localStorage; } catch { storage = null; }
let state = loadState(storage);
let canSave = true;
let filter = 'all';
let search = '';
let session = null;
let lessonTab = 'learn';
let toastTimer;
const byId = id => modules.find(module => module.id === id);
const trackOf = module => tracks.find(track => track.id === module.track);
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const levelNames = ['Unexplored', 'Encountered', 'One independent check', 'Practising', 'Independent checks', 'Advanced checks'];
const percent = value => `${(100 * value).toFixed(1)}%`;
const button = (label, href, dark = true) => `<a class="button ${dark ? 'dark' : ''}" href="${href}">${label}<span>↗</span></a>`;
const bars = level => `<span class="tiny-level" aria-label="Level ${level} of 5">${Array.from({length:5}, (_, i) => `<i class="${i < level ? 'on' : ''}"></i>`).join('')}</span>`;
function persist() {
  canSave = saveState(storage, state);
  if (!canSave) toast('Browser storage is unavailable. Export your progress to keep this session.');
}
function toast(message) {
  const node = document.querySelector('#toast');
  node.textContent = message;
  node.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { node.hidden = true; }, 5500);
}
function recommended() {
  const due = dueModules(state, modules);
  if (due.length) return due[0];
  const failed = state.diagnostic.answers.find(answer => typeof answer === 'object' && !answer.correct && getLevel(state, answer.moduleId) < 3);
  if (failed && byId(failed.moduleId)) return byId(failed.moduleId);
  if (state.lastModule && byId(state.lastModule) && getLevel(state, state.lastModule) < 3) return byId(state.lastModule);
  return modules.find(module => getLevel(state, module.id) < 3 && module.prerequisites.every(id => getLevel(state, id) >= 2)) || modules[0];
}
function heading(eyebrow, title, description) {
  return `<div class="page-heading"><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p>${description}</p></div>`;
}
function warning() { return canSave ? '' : '<p class="save-warning" role="status">Progress is kept in memory for this session. Use Export progress to save a backup.</p>'; }

function coinExhibit(id = 'hero') {
  return `<figure class="exhibit" data-coin="${id}"><div class="figure-meta"><span>THE BAYESIAN COIN</span><span>FIG. 01</span></div><h2>One observation.<br><em>A different belief.</em></h2>
  <svg viewBox="0 0 460 208" role="img" aria-label="Bayesian update between a fair coin and a coin with a 75 percent chance of heads">
  <g stroke="#8c9c80" stroke-width=".65" fill="none"><path d="M32 175h396M32 40v135"/><path d="M32 74h396M32 108h396M32 142h396" stroke-dasharray="2 5"/></g>
  <g fill="#536849" font-family="Menlo,monospace" font-size="8"><text x="32" y="28">PRIOR BELIEF</text><text x="316" y="28">AFTER A HEAD</text><text x="55" y="198">TWO COIN HYPOTHESES</text><text x="267" y="198">UPDATED BELIEFS</text></g>
  <path d="M105 63 C190 65 225 143 342 143" fill="none" stroke="#536849" stroke-width="1.2" stroke-dasharray="4 4"/>
  <path d="M105 143 C190 143 225 63 342 63" fill="none" stroke="#a64e32" stroke-width="1.2"/>
  <circle cx="105" cy="63" r="18" fill="#f6f3e9" stroke="#536849"/><text x="105" y="67" text-anchor="middle" fill="#244e43" font-family="Georgia,serif" font-size="13">F</text>
  <circle cx="105" cy="143" r="18" fill="#244e43"/><text x="105" y="147" text-anchor="middle" fill="#f6f3e9" font-family="Georgia,serif" font-size="13">B</text>
  <circle cx="342" cy="63" r="24" fill="#a64e32" opacity=".12"/><circle cx="342" cy="63" r="17" fill="#a64e32"/><text x="342" y="67" text-anchor="middle" fill="#fcfbf6" font-family="Georgia,serif" font-size="13">B</text><circle cx="342" cy="143" r="17" fill="#f6f3e9" stroke="#536849"/><text x="342" y="147" text-anchor="middle" fill="#244e43" font-family="Georgia,serif" font-size="13">F</text>
  <g fill="#536849" font-family="Menlo,monospace" font-size="8"><text x="143" y="55">P(H | F) = 0.50</text><text x="143" y="158">P(H | B) = 0.75</text><text x="365" y="66" data-coin-biased>60.0%</text><text x="365" y="146" data-coin-fair>40.0%</text></g>
  <text x="230" y="100" fill="#a64e32" font-family="Georgia,serif" font-style="italic" font-size="16">evidence changes the odds</text>
  </svg>
  <label class="range-label" for="${id}-prior">Prior probability of the biased coin <output id="${id}-prior-value">50%</output></label><input id="${id}-prior" data-prior type="range" min="0" max="100" value="50"><div class="range-ends"><span>CERTAINLY FAIR</span><span>CERTAINLY BIASED</span></div>
  <p class="exhibit-result">After one head, P(biased) = <strong data-posterior>60.0%</strong></p><figcaption><span>A two-hypothesis teaching model. Change your prior.</span><a href="#lab">Enter the laboratory ↗</a></figcaption></figure>`;
}
function wireCoins() {
  document.querySelectorAll('[data-coin]').forEach(figure => {
    const slider = figure.querySelector('[data-prior]');
    const update = () => {
      const p = Number(slider.value) / 100;
      const result = posterior({prior:p});
      figure.querySelector('output').textContent = `${slider.value}%`;
      figure.querySelector('[data-posterior]').textContent = percent(result);
      figure.querySelector('[data-coin-fair]').textContent = percent(1-result);
      figure.querySelector('[data-coin-biased]').textContent = percent(result);
    };
    slider.addEventListener('input', update);
    update();
  });
}
function renderHome() {
  const next = recommended();
  main.innerHTML = `<section class="hero"><div class="hero-copy"><p class="eyebrow"><span class="cross">✳</span> A JANE STREET LEARNING COMPANION</p><h1>Learn to think.<br><em>Then think again.</em></h1><p>A field guide to probability, markets, code, and clear reasoning. Build intuition through experiments. Make it your own, one good question at a time.</p><div class="hero-actions">${button('Explore the curriculum','#curriculum')}<a class="text-link" href="#diagnostic">Find my starting point <span>↗</span></a></div><p class="hero-note"><span class="dot"></span>Original exercises. No account. A little more understanding, every day.</p></div>${coinExhibit()}</section>
  <div class="reading-line"><div><b>${tracks.length}</b><span>connected fields of study</span></div><div><b>${modules.length}</b><span>guided explorations</span></div><div><b>${modules.reduce((n,m)=>n+m.questions.length,0)}</b><span>questions to reason through</span></div><div><b>∞</b><span>curiosity required</span></div></div>
  <aside class="continue-band"><span class="continue-num">01</span><div><p class="eyebrow">${state.lastModule ? 'YOUR NEXT EXPLORATION' : 'A GOOD PLACE TO BEGIN'}</p><h3>${esc(next.title)}</h3><p>${esc(trackOf(next).title)} · ${next.minutes} minute exploration</p></div>${button(state.lastModule ? 'Continue learning' : 'Begin here',`#lesson/${next.id}`,false)}</aside>
  ${catalogMarkup()}<section class="approach"><div><p class="eyebrow">THE SOCRATIC APPROACH</p><h2>Understanding is<br><em>something you do.</em></h2><p>Reading an answer can feel like knowing it. Here, you predict, test, and return to the idea later. The point is to build reasoning you can use.</p><a class="text-link" href="#sources" style="margin-top:22px">Read about the method <span>↗</span></a></div><div><div class="approach-step"><span>01</span><div><h3>Start with a question.</h3><p>A short diagnostic finds a useful starting point. Explore any field whenever curiosity takes you there.</p></div></div><div class="approach-step"><span>02</span><div><h3>Make your thinking visible.</h3><p>Commit to a prediction. If it breaks, try a smaller case or a narrower question before opening the explanation.</p></div></div><div class="approach-step"><span>03</span><div><h3>Come back. Connect the dots.</h3><p>Independent checks and later recall build your skill map. A mixed assessment connects ideas across fields.</p></div></div></div></section>`;
  wireCoins(); wireCatalog();
}
function catalogMarkup() {
  return `<section class="section" id="curriculum-section"><div class="section-top"><div><p class="eyebrow">THE LEARNING COLLECTION</p><h2>Eight fields. <em>One curious mind.</em></h2></div><p>A connected path from foundations to harder questions. Every exploration includes a short field note and three original problems.</p></div><div class="toolbar"><div class="filters" aria-label="Filter by field"><button class="filter active" data-filter="all" aria-pressed="true">All fields</button>${tracks.map(t=>`<button class="filter" data-filter="${t.id}" aria-pressed="false">${esc(t.shortTitle || t.title)}</button>`).join('')}</div><label class="search"><span aria-hidden="true">⌕</span><span class="sr-only">Search explorations</span><input id="catalog-search" type="search" placeholder="Find an idea…" autocomplete="off"></label></div><div id="catalog-results"></div></section>`;
}
function renderCatalog() {
  main.innerHTML = heading('THE CURRICULUM','Follow the questions.','A broad preparation map for quantitative reasoning, trading and software. Start with your foundations, or follow a subject that interests you.') + catalogMarkup();
  main.querySelector('.section-top').hidden = true;
  main.querySelector('.section').style.paddingTop = '0';
  wireCatalog();
}
function wireCatalog() {
  const query = main.querySelector('#catalog-search');
  query.value = search;
  query.addEventListener('input', () => {search=query.value;renderCatalogResults();});
  main.querySelectorAll('[data-filter]').forEach(node=>node.addEventListener('click',()=>{filter=node.dataset.filter;renderCatalogResults();}));
  renderCatalogResults();
}
function renderCatalogResults() {
  main.querySelectorAll('[data-filter]').forEach(node=>{const active=node.dataset.filter===filter;node.classList.toggle('active',active);node.setAttribute('aria-pressed',String(active));});
  const query = search.trim().toLowerCase();
  const shown = modules.filter(m=>(filter==='all'||m.track===filter)&&[m.title,m.summary,trackOf(m).title,...m.objectives].join(' ').toLowerCase().includes(query));
  const rows = tracks.filter(t=>shown.some(m=>m.track===t.id)).map(t=>{
    const trackModules = shown.filter(m=>m.track===t.id);
    return `<article class="track-card"><div class="track-head"><span class="track-number">${String(tracks.indexOf(t)+1).padStart(2,'0')}</span><div><h3>${esc(t.title)}</h3><p>${esc(t.subtitle)}</p></div><span class="track-glyph" aria-hidden="true">${esc(t.symbol)}</span></div>${trackModules.map(m=>`<a class="module-row" href="#lesson/${m.id}"><span class="module-index">${String(modules.filter(n=>n.track===t.id).indexOf(m)+1).padStart(2,'0')}</span><span class="module-info"><strong>${esc(m.title)}</strong><small>${esc(m.level)} · ${m.minutes} MIN · 3 QUESTIONS</small></span>${bars(getLevel(state,m.id))}<span class="module-arrow">↗</span></a>`).join('')}</article>`;
  }).join('');
  main.querySelector('#catalog-results').innerHTML=`<p class="results-note" role="status">${shown.length} EXPLORATIONS · ${query ? `MATCHING “${esc(search)}”` : 'START ANYWHERE. RETURN OFTEN.'}</p><div class="track-grid">${rows||'<div class="empty"><h3>No explorations found.</h3><p>Try a broader search, or select All fields.</p></div>'}</div>`;
}
function renderLesson(id, reset=false) {
  const module=byId(id);
  if(!module){renderNotFound();return;}
  if(reset||!session||session.kind!=='lesson'||session.moduleId!==id){session={kind:'lesson',moduleId:id,index:0,wrong:0,hints:0,done:false,revealed:false,answered:false};lessonTab='learn';}
  const track=trackOf(module);
  main.innerHTML=`<a class="breadcrumb" href="#curriculum">← THE CURRICULUM / ${esc(track.title.toUpperCase())}</a>`+heading(`${esc(track.title)} · ${module.minutes} MINUTES`,esc(module.title),esc(module.summary))+`<div class="lesson-layout"><aside class="lesson-sidebar"><div><p class="eyebrow">QUESTIONS YOU WILL EXPLORE</p><ul>${module.objectives.map(o=>`<li>${esc(o)}</li>`).join('')}</ul></div><div class="level-readout">${bars(getLevel(state,id))}<span>Level ${getLevel(state,id)} / 5 · ${levelNames[getLevel(state,id)]}</span></div><div><p class="eyebrow">CONNECTING IDEAS</p>${module.prerequisites.length?module.prerequisites.map(pre=>`<p><a href="#lesson/${pre}">${esc(byId(pre)?.title||pre)} ↗</a></p>`).join(''):'<p style="font-size:11px">A foundation. Start right here.</p>'}</div></aside><div><div class="lesson-tabs" role="group" aria-label="Exploration mode"><button aria-pressed="${lessonTab==='learn'}" class="tab ${lessonTab==='learn'?'active':''}" data-tab="learn">The field note</button><button aria-pressed="${lessonTab==='practice'}" class="tab ${lessonTab==='practice'?'active':''}" data-tab="practice">Think it through <span aria-hidden="true">↗</span></button></div><div id="lesson-content"></div>${warning()}</div></div>`;
  main.querySelectorAll('[data-tab]').forEach(node=>node.addEventListener('click',()=>{lessonTab=node.dataset.tab;renderLesson(id);main.querySelector('[data-tab="'+lessonTab+'"]').focus();}));
  if(lessonTab==='learn'){
    main.querySelector('#lesson-content').innerHTML=`<article class="lesson-article"><p class="eyebrow">THE INTUITION</p>${module.lesson.map(section=>`<h2>${esc(section.title)}</h2><p>${esc(section.body)}</p>`).join('')}<div class="source-inline"><p style="font-size:9px;margin-bottom:7px">TOPIC REFERENCES · ORIGINAL EDUCATIONAL EXAMPLES</p>${module.sourceIds.map(id=>sources.find(s=>s.id===id)).filter(Boolean).map(s=>`<p><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗</a></p>`).join('')}</div><button class="button dark" id="begin-practice">Try the questions <span>→</span></button><p class="session-note">Prefer a retrieval challenge? You can open Think it through before reading the note.</p></article>`;
    main.querySelector('#begin-practice').onclick=()=>{lessonTab='practice';renderLesson(id);main.querySelector('h2')?.focus();};
  }else renderQuestion();
}
function questionForSession() {
  if(session.kind==='lesson') return {module:byId(session.moduleId),question:byId(session.moduleId).questions[session.index]};
  return session.items[session.index];
}
function questionMarkup(question,index,total,kind) {
  return `<div class="question-card"><div class="question-meta"><span>${kind==='lesson'?'THINK IT THROUGH':kind==='diagnostic'?'FIND YOUR STARTING POINT':'MIXED ASSESSMENT'}</span><span>${String(index+1).padStart(2,'0')} / ${String(total).padStart(2,'0')}</span></div><h2 id="question-title" tabindex="-1">${esc(question.prompt)}</h2><form id="answer-form" aria-labelledby="question-title">${question.type==='choice'?`<fieldset style="border:0;padding:0;margin:0"><legend class="answer-label">Choose the conclusion you can defend.</legend><div class="choices">${question.options.map(o=>`<label class="choice"><input type="radio" name="answer" value="${esc(o.value)}"><span>${esc(o.label)}</span></label>`).join('')}</div></fieldset><button class="button dark" type="submit">${kind==='lesson'?'Check my reasoning':'Record answer'} <span>→</span></button>`:`<label class="answer-label" for="answer-input">Your prediction · use a number or fraction</label><div class="answer-field"><input id="answer-input" name="answer" type="text" inputmode="decimal" autocomplete="off" placeholder="e.g. 1/2" maxlength="100"><button class="button dark" type="submit">${kind==='lesson'?'Check my reasoning':'Record answer'} <span>→</span></button></div>`}</form><div id="feedback" aria-live="polite"></div><div class="question-actions">${kind==='lesson'?'<button class="link-button" id="hint">A smaller question</button><button class="link-button" id="reveal">Show the explanation</button>':'<button class="link-button" id="skip-question">I don’t know yet →</button>'}<button class="button dark" id="next-question" hidden>Next question <span>→</span></button></div></div><p class="session-note">${kind==='lesson'?'Hints and explanations are for learning. Assisted answers earn no independent credit for 24 hours.':'One question at a time. Explanations appear after the last answer; these results do not award skill levels.'}</p>`;
}
function renderQuestion() {
  if(session.done){renderSessionComplete();return;}
  const {module,question}=questionForSession();
  const total=session.kind==='lesson'?module.questions.length:session.items.length;
  const container=main.querySelector('#lesson-content')||main.querySelector('#mixed-content');
  container.innerHTML=questionMarkup(question,session.index,total,session.kind);
  if(session.renderedIndex!==session.index){session.renderedIndex=session.index;session.wrong=0;session.hints=0;session.revealed=false;session.answered=false;session.feedback='';session.raw='';}
  const feedback=container.querySelector('#feedback');
  const form=container.querySelector('form');
  const next=container.querySelector('#next-question');
  function lock(focus=true){form.querySelectorAll('input,button').forEach(n=>n.disabled=true);container.querySelector('#hint')?.setAttribute('hidden','');container.querySelector('#reveal')?.setAttribute('hidden','');next.hidden=false;session.answered=true;if(focus)next.focus();}
  function explain(correct,lead){session.feedback=feedback.innerHTML=`<div class="feedback ${correct?'correct':''}"><p><strong>${lead}</strong></p><p>${esc(question.explanation)}</p></div>`;lock();}
  function attempt(correct,revealed=false){state=recordAttempt(state,{moduleId:module.id,questionId:question.id,correct,hinted:session.hints>0||session.wrong>0,revealed,role:question.role});persist();}
  function hint(){
    const index=Math.min(session.hints,question.hints.length-1);session.hints++;
    session.feedback=feedback.innerHTML=`<div class="feedback"><p>${esc(question.hints[index])}</p></div>`;
    // Persist exposure even when the learner leaves before submitting.
    state=recordAttempt(state,{moduleId:module.id,questionId:question.id,correct:false,hinted:true,role:question.role});persist();
    if(session.hints>=question.hints.length)container.querySelector('#hint').disabled=true;
  }
  form.addEventListener('submit',event=>{
    event.preventDefault();if(session.answered)return;
    const raw=new FormData(form).get('answer');session.raw=String(raw??'');
    const result=evaluateAnswer(question,raw);
    if(!result.valid){feedback.innerHTML=`<p class="feedback" role="alert">${esc(result.message)}</p>`;return;}
    if(session.kind!=='lesson'){
      session.answers.push({moduleId:module.id,questionId:question.id,correct:result.correct,answer:String(raw)});
      advance();return;
    }
    if(result.correct){const priorSkill=state.skills[module.id];const exposed=priorSkill?.assistedAt?.[question.id];const isNew=!priorSkill?.correctIds.includes(question.id);const eligible=!session.hints&&!session.wrong&&(exposed===undefined||Date.now()-exposed>=86400000);attempt(true);explain(true,eligible&&isNew?'That checks out. An independent check recorded.':'That checks out. Review recorded; no new independent question added.');}
    else{
      attempt(false);session.wrong++;
      if(session.wrong>=3){session.revealed=true;attempt(false,true);explain(false,'Let’s rebuild the idea, then return to it later.');}
      else{hint();container.querySelector('input')?.focus();}
    }
  });
  container.querySelector('#hint')?.addEventListener('click',hint);
  container.querySelector('#reveal')?.addEventListener('click',()=>{session.revealed=true;attempt(false,true);explain(false,'A worked explanation. No independent credit awarded.');});
  container.querySelector('#skip-question')?.addEventListener('click',()=>{session.answers.push({moduleId:module.id,questionId:question.id,correct:false});advance();});
  function advance(){
    session.index++;
    if(session.index>=total){session.done=true;if(session.kind==='diagnostic'){state={...state,diagnostic:{completed:true,answers:session.answers},updatedAt:Date.now()};persist();}renderSessionComplete();}
    else{renderQuestion();main.querySelector('#question-title').focus();}
  }
  next.addEventListener('click',advance);
  form.addEventListener('input',()=>{session.raw=String(new FormData(form).get('answer')??'');});
  feedback.innerHTML=session.feedback||'';
  for(const input of form.querySelectorAll('input')){if(input.type==='radio')input.checked=input.value===session.raw;else input.value=session.raw||'';}
  if(session.hints>=question.hints.length&&container.querySelector('#hint'))container.querySelector('#hint').disabled=true;
  if(session.answered)lock(false);
}
function renderSessionComplete() {
  const container=main.querySelector('#lesson-content')||main.querySelector('#mixed-content');
  if(session.kind!=='lesson'){state=markExposure(state,session.items.filter(item=>item.module.questions.some(q=>q.id===item.question.id)).map(item=>({moduleId:item.module.id,questionId:item.question.id})));persist();}
  if(session.kind==='lesson'){
    const module=byId(session.moduleId),level=getLevel(state,module.id);
    const siblings=modules.filter(m=>m.track===module.track);const next=siblings[siblings.indexOf(module)+1]||recommended();
    container.innerHTML=`<div class="question-card session-complete"><div class="completion-mark">✳</div><p class="eyebrow">EXPLORATION COMPLETE</p><h2>A little more understanding.</h2><p>You finished all three questions. This exploration is at level ${level}/5: ${levelNames[level].toLowerCase()}. Let the idea settle, then try recalling it tomorrow.</p>${button('Explore the next idea',`#lesson/${next.id}`)}<div style="margin-top:20px"><a class="text-link" href="#progress">See your skill map ↗</a></div><p class="session-note" style="margin-top:25px">Fixed questions measure these checks, not complete understanding. Try explaining your reasoning aloud or inventing a counterexample.</p></div>`;
  }else{
    const correct=session.answers.filter(a=>a.correct).length;
    const next=session.kind==='diagnostic'?recommended():byId(session.answers.find(a=>!a.correct)?.moduleId)||recommended();
    container.innerHTML=`<div class="question-card session-complete"><p class="eyebrow">${session.kind==='diagnostic'?'YOUR STARTING POINT':'ASSESSMENT REFLECTION'}</p><div class="completion-mark">${correct} / ${session.answers.length}</div><h2>${session.kind==='diagnostic'?'Follow the next question.':'Keep the connections growing.'}</h2><p>${session.kind==='diagnostic'?'This is a small sample, not a placement certificate. A useful next exploration is':'Return to an idea that needs another look:'} <strong>${esc(next.title)}</strong>.</p>${button('Begin this exploration',`#lesson/${next.id}`)}<div class="mixed-results">${session.answers.map((answer,i)=>{const item=session.items[i];return `<p><strong>${answer.correct?'✓ Checked':'↺ Revisit'} · ${esc(item.module.title)}</strong><br>${esc(item.question.explanation)}</p>`;}).join('')}</div><a class="text-link" href="#progress">See your skill map ↗</a></div>`;
  }
  const completion=container.querySelector('h2');completion?.setAttribute('tabindex','-1');completion?.focus();
}
function renderMixed(kind) {
  const items=kind==='diagnostic'?[modules[0],modules[3],modules[9],modules[15]].map((m,i)=>({module:m,question:m.questions[i===1?1:i===3?2:0]})):tracks.map(t=>{const module=modules.filter(m=>m.track===t.id).at(-1);return {module,question:module.questions[2]};});
  if(kind==='assessment'){
    const module=byId(integrativeQuestion.moduleId);items.push({module,question:integrativeQuestion.question});
  }
  session={kind,items,index:0,answers:[],done:false};
  main.innerHTML=heading(kind==='diagnostic'?'A SHORT DIAGNOSTIC':'CONNECT THE FIELDS',kind==='diagnostic'?'Where shall we begin?':'What travels between ideas?',kind==='diagnostic'?'Four questions, one at a time. Answer what you can; “I don’t know yet” is a useful starting point. We’ll suggest an exploration after the last question.':'Nine questions across the curriculum. Work without hints, then use the explanations to identify what to revisit. This is a sample of your reasoning, not an interview score.')+`<div class="lesson-layout"><aside class="lesson-sidebar"><div><p class="eyebrow">HOW THIS WORKS</p><p style="font-size:11px;line-height:1.9">Commit to an answer before seeing an explanation. No timer. No penalty for uncertainty.</p></div><div><a href="#curriculum">Return to the curriculum ↗</a></div></aside><div id="mixed-content"></div></div>`;
  renderQuestion();
}
function renderProgress() {
  const summary=summarize(state,modules),due=dueModules(state,modules);
  main.innerHTML=heading('YOUR LEARNING RECORD','Understanding, over time.','Levels reflect objective checks across different questions and later recall. They are a guide to practice; a small fixed question bank cannot certify full mastery.')+warning()+`<div class="metric-grid"><div><b>${summary.started}<small style="font-size:18px"> / ${modules.length}</small></b><span>EXPLORATIONS STARTED</span></div><div><b>${summary.independent}</b><span>LEVEL 4 OR HIGHER</span></div><div><b>${summary.due}</b><span>READY FOR REVIEW</span></div><div><b>${summary.percent}%</b><span>OF LEVEL CHECKS</span></div></div><div class="section-top"><div><p class="eyebrow">THE SKILL MAP</p><h2>Where you’ve <em>been thinking.</em></h2></div>${button(due.length?'Review an idea':'Continue exploring',`#lesson/${(due[0]||recommended()).id}`)}</div><table class="progress-table"><thead><tr><th scope="col">EXPLORATION</th><th scope="col" class="progress-track">FIELD</th><th scope="col">LEVEL</th><th scope="col">NEXT REVIEW</th></tr></thead><tbody>${modules.map(m=>{const skill=state.skills[m.id];return `<tr><td><a href="#lesson/${m.id}">${esc(m.title)} ↗</a></td><td class="progress-track">${esc(trackOf(m).title)}</td><td>${bars(getLevel(state,m.id))}<small>${getLevel(state,m.id)} / 5</small></td><td>${skill?.dueAt?(skill.dueAt<=Date.now()?'Ready now':new Date(skill.dueAt).toLocaleDateString(undefined,{month:'short',day:'numeric'})):'After your first check'}</td></tr>`;}).join('')}</tbody></table><div class="privacy-note"><strong>How levels are earned</strong><br>0 unexplored → 1 encountered → 2 one independent check → 3 two independent checks including recall → 4 correct recall at least a day later → 5 edge-case evidence and another later recall. Incorrect review answers reduce the level. Hints and reveals create a 24-hour pause on independent credit for that question.<br><br>Practise explaining each answer aloud. This prototype checks selected and numeric answers; it cannot assess the quality of your explanation.</div><div class="section-top"><div><p class="eyebrow">CONNECT WHAT YOU KNOW</p><h2>A different <em>kind of review.</em></h2></div>${button('Try a mixed assessment','#assessment',false)}</div><p style="font-size:12px">Explore questions from every field, including a final connecting problem. Revisit this after working through the curriculum.</p><div class="data-actions"><button id="export-progress" class="button dark">Export progress <span>↓</span></button><button id="import-progress" class="button">Import a backup <span>↑</span></button><input type="file" id="progress-file" accept="application/json,.json" hidden><button id="reset-progress" class="link-button">Reset this browser’s progress</button></div><div id="reset-confirm" hidden class="privacy-note"><p>This clears all learning records for this site in this browser. Export a backup first if you want to keep them.</p><button id="confirm-reset" class="button" style="margin-top:15px">Clear my progress</button> <button id="cancel-reset" class="link-button">Keep it</button></div><p class="session-note" style="margin-bottom:50px">Your data stays on this browser and origin. Local and hosted copies keep separate records. Export/import moves progress between them.</p>`;
  main.querySelector('#export-progress').onclick=()=>{
    const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const anchor=document.createElement('a');anchor.href=url;anchor.download='quantitative-observatory-progress.json';anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Progress exported. Keep the JSON file as your backup.');
  };
  main.querySelector('#import-progress').onclick=()=>main.querySelector('#progress-file').click();
  main.querySelector('#progress-file').onchange=async event=>{
    const file=event.target.files?.[0];if(!file)return;
    try{if(file.size>2_000_000)throw new Error('The progress file exceeds 2 MB.');const candidate=validateImport(await file.text());
      const known=new Set(modules.map(m=>m.id));if(Object.keys(candidate.skills).some(id=>!known.has(id)))throw new Error('This backup contains an unknown exploration.');
      for(const [id,skill] of Object.entries(candidate.skills)){const ids=new Set(byId(id).questions.map(q=>q.id));if([...skill.correctIds,...skill.recallIds,...skill.edgeIds,...Object.keys(skill.assistedAt)].some(q=>!ids.has(q)))throw new Error('This backup contains an unknown question.');}
      state=candidate;persist();renderProgress();toast('Progress imported. Your skill map is restored.');
    }catch(error){toast(error.message||'Could not import this progress file. Your current progress is unchanged.');}
  };
  main.querySelector('#reset-progress').onclick=()=>{main.querySelector('#reset-confirm').hidden=false;main.querySelector('#confirm-reset').focus();};
  main.querySelector('#cancel-reset').onclick=()=>{main.querySelector('#reset-confirm').hidden=true;main.querySelector('#reset-progress').focus();};
  main.querySelector('#confirm-reset').onclick=()=>{state=createState();persist();session=null;renderProgress();toast('Progress reset for this site in this browser.');};
}
function renderLab() {
  main.innerHTML=heading('THE LABORATORY','Change an assumption.<br><em>Watch an idea move.</em>','Four small models for reasoning under uncertainty. Predict what will happen before moving a control. Each model makes its assumptions explicit.')+`<div class="lab-grid"><article class="lab-card wide"><div><p class="eyebrow">01 / LEARNING FROM EVIDENCE</p><h2>How much should one head change your mind?</h2><p>You select one of two coins: a fair coin, or a biased coin with P(heads) = 0.75. You observe one head. The slider sets your prior probability of selecting the biased coin.</p><p class="lab-callout">Before you move it: if the prior were only 10%, would one head make the biased coin more likely than the fair one?</p><p style="font-size:12px;line-height:1.9;margin-top:18px">Bayes’ rule: posterior = 0.75p / [0.75p + 0.50(1 − p)]. Evidence changes the odds; it doesn’t erase your starting point.</p><a class="text-link" href="#lesson/conditioning" style="margin-top:20px">Explore conditional probability ↗</a></div>${coinExhibit('lab')}</article><article class="lab-card"><p class="eyebrow">02 / EXPECTATION & DECISIONS</p><h2>Keep it, or roll again?</h2><p>A fair six-sided die shows a number. You may keep that value, or discard it and accept one final roll. You value each point equally.</p><label class="range-label" for="kept-value">Value you can keep <output id="kept-output">3 points</output></label><input id="kept-value" type="range" min="1" max="6" step="1" value="3"><svg class="lab-svg" viewBox="0 0 440 130" role="img" aria-label="Comparison of kept value and expected reroll value"><path d="M25 107H420" stroke="#a8b19c"/><rect id="kept-bar" x="90" y="47" width="85" height="60" fill="#536849"/><rect x="270" y="61.5" width="85" height="45.5" fill="#a64e32"/><g font-family="Menlo,monospace" font-size="9" fill="#536849"><text x="97" y="126">KEEP VALUE</text><text x="268" y="126">REROLL E[V]</text><text x="297" y="51.5">3.50</text><text id="kept-chart-value" x="116" y="37">3.00</text></g></svg><div class="lab-stat"><span>Expected gain from rerolling</span><b id="roll-advantage">+0.50</b></div><p id="roll-explanation" class="lab-callout"></p></article><article class="lab-card"><p class="eyebrow">03 / EXPECTATION ISN’T A GUARANTEE</p><h2>A good bet can still lose.</h2><p>A ticket costs 1 point and pays 4 points in total if you win, otherwise 0. Set the chance of winning. Net expected value includes the ticket cost.</p><label class="range-label" for="win-prob">Chance of winning <output id="win-output">30%</output></label><input id="win-prob" type="range" min="0" max="100" value="30"><svg class="lab-svg" viewBox="0 0 440 130" role="img" aria-label="Win and loss probability bars"><rect x="25" y="42" width="390" height="35" fill="#e4e9da"/><rect id="win-bar" x="25" y="42" width="117" height="35" fill="#244e43"/><g font-family="Menlo,monospace" font-size="9" fill="#536849"><text x="25" y="31">WIN</text><text x="355" y="31">LOSE</text><text x="25" y="103">WIN: +3 NET</text><text x="315" y="103">LOSE: −1 NET</text></g></svg><div class="lab-stat"><span>Net expected value per ticket</span><b id="bet-value">+0.20</b></div><p id="bet-explanation" class="lab-callout"></p></article><article class="lab-card wide"><div><p class="eyebrow">04 / A MARKET-MAKING TOY MODEL</p><h2>Inventory changes your quote.</h2><p>You estimate a fair value of 100. A positive inventory means you already own units. In this toy model, move both quotes down to encourage selling and discourage buying.</p><p class="lab-callout">A teaching rule, not a trading strategy: reservation value = 100 − 0.1 × inventory. The full bid–ask spread stays at 2.</p><a class="text-link" href="#lesson/${modules.find(m=>m.track==='markets')?.id||modules[12].id}" style="margin-top:20px">Explore markets & liquidity ↗</a></div><div><label class="range-label" for="inventory">Inventory (units) <output id="inventory-output">0</output></label><input id="inventory" type="range" min="-30" max="30" value="0"><svg class="lab-svg" viewBox="0 0 440 140" role="img" aria-label="Bid and ask prices shift with inventory"><path d="M30 80H410" stroke="#a6b399"/><path d="M220 20v85" stroke="#a64e32" stroke-dasharray="3 4"/><g font-family="Menlo,monospace" font-size="9" fill="#536849"><text x="184" y="17">FAIR: 100</text><text x="25" y="105">95</text><text x="395" y="105">105</text></g><circle id="bid-dot" cx="182" cy="80" r="7" fill="#244e43"/><circle id="ask-dot" cx="258" cy="80" r="7" fill="#a64e32"/></svg><div class="lab-stat"><span>Your bid / ask</span><b id="quote-output">99.00 / 101.00</b></div><p class="session-note">This model omits order flow, adverse selection, fees, volatility and position limits.</p></div></article></div>`;
  wireCoins();
  const kept=main.querySelector('#kept-value');const win=main.querySelector('#win-prob');const inventory=main.querySelector('#inventory');
  function updateRoll(){const value=Number(kept.value),result=rollDecision(value);main.querySelector('#kept-output').textContent=`${value} points`;main.querySelector('#roll-advantage').textContent=`${result.advantage>=0?'+':''}${result.advantage.toFixed(2)}`;main.querySelector('#kept-bar').setAttribute('y',String(107-value*13));main.querySelector('#kept-bar').setAttribute('height',String(value*13));main.querySelector('#kept-chart-value').setAttribute('y',String(97-value*13));main.querySelector('#kept-chart-value').textContent=value.toFixed(2);main.querySelector('#roll-explanation').textContent=result.choice==='reroll'?'Rerolling has higher expected value. The next individual roll can still be worse.':'Keeping has higher expected value. The reroll’s average stays at 3.5, regardless of the number showing.';}
  function updateBet(){const p=Number(win.value)/100,ev=betExpectedValue(p,4,1);main.querySelector('#win-output').textContent=`${win.value}%`;main.querySelector('#bet-value').textContent=`${ev>=0?'+':''}${ev.toFixed(2)}`;main.querySelector('#win-bar').setAttribute('width',String(390*p));main.querySelector('#bet-explanation').textContent=p===.25?'Break-even expectation: 4 × 0.25 − 1 = 0. The outcomes still vary.':ev>0?`Positive expectation, with a ${100-Number(win.value)}% chance of losing this ticket. Repeated play also needs risk and bankroll limits.`:'Negative expectation: the expected payout does not cover the ticket cost.';}
  function updateQuote(){const inv=Number(inventory.value),quote=marketQuote({inventory:inv});main.querySelector('#inventory-output').textContent=String(inv);main.querySelector('#quote-output').textContent=`${quote.bid.toFixed(2)} / ${quote.ask.toFixed(2)}`;main.querySelector('#bid-dot').setAttribute('cx',String(30+(quote.bid-95)*38));main.querySelector('#ask-dot').setAttribute('cx',String(30+(quote.ask-95)*38));}
  kept.oninput=updateRoll;win.oninput=updateBet;inventory.oninput=updateQuote;updateRoll();updateBet();updateQuote();
}
function renderSources(){
  main.innerHTML=heading('SOURCES & APPROACH','A field guide.<br><em>An open invitation to think.</em>','This is an independent, AI-authored educational prototype inspired by the Paper Observatory. Its curriculum is a broad preparation map, not an official Jane Street syllabus or a claim to teach everything.')+`<section class="approach" style="border:0;padding-top:5px"><div><p class="eyebrow">WHAT YOU’RE LEARNING</p><h2>Public sources.<br><em>Original questions.</em></h2><p>Jane Street’s public resources inform the topic coverage. All explanations, toy experiments and exercise scenarios here are educational constructions. They are not claimed to be actual interview questions.</p></div><div><div class="approach-step"><span>01</span><div><h3>Authored Socratic practice</h3><p>Adapted from <a href="https://github.com/janestreet/agent_skills" target="_blank" rel="noopener noreferrer">Jane Street’s MIT-licensed Socratic Tutor skill</a>: a diagnostic, one question at a time, narrowing prompts, evidence-based levels and spaced recall. The original skill is a set of instructions for an AI agent; this website adapts its approach to authored exercises. There is no language model running in the website.</p></div></div><div class="approach-step"><span>02</span><div><h3>Show the limits of the evidence</h3><p>Numeric and selected answers are checked deterministically. The prototype cannot evaluate spoken reasoning or certify understanding. Progress is evidence from this small question bank.</p></div></div><div class="approach-step"><span>03</span><div><h3>A starting point, with room to grow</h3><p>The first collection spans eight domains, 24 explorations and 72 questions. Build on it with longer proofs, coding projects, fresh problems and discussion with other people.</p></div></div></div></section><p class="eyebrow" style="margin-bottom:20px">PRIMARY TOPIC REFERENCES</p><ol class="sources-list">${sources.map((s,i)=>`<li><span class="source-num">${String(i+1).padStart(2,'0')}</span><div><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗</a><p>${esc(s.note)}</p></div></li>`).join('')}</ol><div class="privacy-note"><strong>Your progress is yours.</strong> Learning records stay in local storage for this browser and site. No analytics, account, model call or learner-data upload is included. Export a backup from Your progress to move it between the local and hosted sites.<br><br>Visual reference: <a href="https://thepaperobservatory.com" target="_blank" rel="noopener noreferrer">The Paper Observatory ↗</a>. Jane Street is not affiliated with or endorsing this website.</div>`;
}
function renderNotFound(){main.innerHTML=`<div class="error-heading"><p class="eyebrow">AN UNEXPLORED COORDINATE</p><h1>This path isn’t in the collection.</h1><p>Return to the curriculum to find your next question.</p>${button('Explore the curriculum','#curriculum')}</div>`;}
function navigate(){
  const route=location.hash.slice(1)||'home';
  document.querySelectorAll('[data-nav]').forEach(node=>{if(node.dataset.nav===route)node.setAttribute('aria-current','page');else node.removeAttribute('aria-current');});
  if(route==='home')renderHome();else if(route==='curriculum')renderCatalog();else if(route==='lab')renderLab();else if(route==='progress')renderProgress();else if(route==='sources')renderSources();else if(route==='diagnostic'||route==='assessment')renderMixed(route);else if(route.startsWith('lesson/'))renderLesson(route.slice(7),true);else renderNotFound();
  document.title=`${route.startsWith('lesson/')?(byId(route.slice(7))?.title||'Exploration')+' — ':''}The Quantitative Observatory`;
  window.scrollTo(0,0);main.focus({preventScroll:true});
}
document.querySelector('.skip-link').addEventListener('click',event=>{event.preventDefault();main.focus();main.scrollIntoView({block:'start'});});
window.addEventListener('hashchange',navigate);
navigate();
