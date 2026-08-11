/* Public legal practice deck. Heavy source data is fetched only after the user opens a source. */
(function(){
  const SOURCES=[
    {
      id:'lawbench-jec-knowledge',
      title:'JEC-QA 知识问答',
      subtitle:'LawBench · 1-2',
      count:500,
      kind:'知识单选',
      url:'https://raw.githubusercontent.com/open-compass/LawBench/refs/heads/main/data/zero_shot/1-2.json',
      sourceUrl:'https://github.com/open-compass/LawBench/tree/main/data/zero_shot',
      note:'中国法律知识拓展，不等同于 397 / 497 真题'
    },
    {
      id:'lawbench-jec-case',
      title:'JEC-QA 案例分析',
      subtitle:'LawBench · 3-6',
      count:500,
      kind:'案例单选',
      url:'https://raw.githubusercontent.com/open-compass/LawBench/refs/heads/main/data/zero_shot/3-6.json',
      sourceUrl:'https://github.com/open-compass/LawBench/tree/main/data/zero_shot',
      note:'偏法律适用与推理，不等同于 397 / 497 真题'
    }
  ];

  let currentSource=null;
  let loadedQuestions=[];
  let queue=[];
  let currentIndex=0;
  let selected='';
  let answered=false;

  db.externalQuestionProgress??={};

  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const progressFor=id=>db.externalQuestionProgress[id]||{};
  const announceChange=()=>{
    try{save()}catch{}
    window.dispatchEvent(new CustomEvent('jlu:state-changed'));
  };

  function openBankDB(){
    return new Promise((resolve,reject)=>{
      const req=indexedDB.open('jluQuestionBank',1);
      req.onupgradeneeded=()=>{
        if(!req.result.objectStoreNames.contains('sources'))req.result.createObjectStore('sources',{keyPath:'id'});
      };
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error);
    });
  }

  async function getCachedSource(id){
    const d=await openBankDB();
    return new Promise((resolve,reject)=>{
      const tx=d.transaction('sources','readonly');
      const req=tx.objectStore('sources').get(id);
      req.onsuccess=()=>{resolve(req.result||null);d.close()};
      req.onerror=()=>{reject(req.error);d.close()};
    });
  }

  async function setCachedSource(id,data){
    const d=await openBankDB();
    return new Promise((resolve,reject)=>{
      const tx=d.transaction('sources','readwrite');
      tx.objectStore('sources').put({id,data,fetchedAt:new Date().toISOString()});
      tx.oncomplete=()=>{resolve();d.close()};
      tx.onerror=()=>{reject(tx.error);d.close()};
    });
  }

  function categoryOf(text){
    const s=String(text||'');
    const rules=[
      ['法制史',/(秦朝|汉律|唐律|唐律疏议|宋刑统|明律|大明律|清律|大清律|法经|六法全书|中华法系|法制史|礼法|八议|十恶|五刑|春秋决狱|准五服以制罪)/],
      ['宪法',/(宪法|全国人民代表大会|全国人大|人大常委会|国务院|国家主席|基本权利|公民权利|选举法|自治机关|民族区域自治|特别行政区|监察委员会)/],
      ['刑法',/(刑法|犯罪|刑罚|量刑|罪名|故意犯罪|过失犯罪|共同犯罪|正当防卫|紧急避险|犯罪中止|犯罪未遂|犯罪预备|自首|立功|缓刑|假释|累犯|数罪并罚|死刑|有期徒刑|无期徒刑)/],
      ['民法',/(民法|民法典|民事|合同|物权|债权|侵权|婚姻|继承|收养|人格权|所有权|抵押|质押|留置|保证|代理|时效|善意取得|不当得利|无因管理|法人|自然人)/],
      ['法理',/(法理|法治|法律规则|法律原则|法律关系|法律责任|法律解释|法律渊源|法律体系|法的效力|权利与义务|公平正义|执法|司法|立法|守法|法律意识)/]
    ];
    for(const [name,re] of rules)if(re.test(s))return name;
    return '拓展';
  }

  function parseOptions(raw){
    const text=String(raw||'').replace(/\r/g,'');
    const matches=[...text.matchAll(/([A-D])[:：]([\s\S]*?)(?=(?:[A-D])[:：]|$)/g)];
    if(!matches.length)return {stem:text,options:[]};
    const stem=text.slice(0,matches[0].index).trim();
    return {stem,options:matches.map(m=>({key:m[1],text:m[2].trim().replace(/[;；]\s*$/,'')}))};
  }

  function normalizeSource(source,raw){
    return (Array.isArray(raw)?raw:[]).map((item,index)=>{
      const parsed=parseOptions(item.question);
      const answer=(String(item.answer||'').match(/[A-D]/)||[])[0]||'';
      return {
        id:`${source.id}:${index}`,
        sourceId:source.id,
        sourceTitle:source.title,
        index:index+1,
        stem:parsed.stem,
        options:parsed.options,
        answer,
        category:categoryOf(`${parsed.stem} ${parsed.options.map(x=>x.text).join(' ')}`)
      };
    }).filter(q=>q.stem&&q.options.length>=2&&q.answer);
  }

  async function loadSource(source,force=false){
    setBankMessage('正在打开题源…');
    try{
      let raw=null;
      if(!force){
        const cached=await getCachedSource(source.id);
        if(cached?.data)raw=cached.data;
      }
      if(!raw){
        const res=await fetch(source.url,{cache:'force-cache'});
        if(!res.ok)throw new Error(`HTTP ${res.status}`);
        raw=await res.json();
        await setCachedSource(source.id,raw);
      }
      currentSource=source;
      loadedQuestions=normalizeSource(source,raw);
      document.querySelector('#bankSourceSelect').value=source.id;
      setBankMessage(`已载入 ${loadedQuestions.length} 道 · 数据缓存于本机，不进入首屏。`);
      buildQueue(true);
      renderSourceCards();
      return true;
    }catch(err){
      setBankMessage(`公开题源暂时无法载入：${err.message||err}。你的本地题库不受影响。`,true);
      return false;
    }
  }

  function filterQuestions(list){
    const subject=document.querySelector('#bankSubject')?.value||'core';
    let out=list;
    if(subject==='core')out=out.filter(q=>q.category!=='拓展');
    else if(subject!=='all')out=out.filter(q=>q.category===subject);

    const mode=document.querySelector('#bankMode')?.value||'unseen';
    if(mode==='unseen')out=out.filter(q=>!progressFor(q.id).seen);
    if(mode==='wrong')out=out.filter(q=>progressFor(q.id).wrong);
    if(mode==='starred')out=out.filter(q=>progressFor(q.id).starred);
    if(mode==='random')out=[...out].sort(()=>Math.random()-.5);
    return out;
  }

  function buildQueue(resetIndex=false){
    if(!currentSource||!loadedQuestions.length)return;
    queue=filterQuestions(loadedQuestions);
    if(resetIndex)currentIndex=0;
    if(currentIndex>=queue.length)currentIndex=0;
    renderPractice();
    renderBankStats();
  }

  function currentQuestion(){return queue[currentIndex]||null}

  function renderPractice(){
    const wrap=document.querySelector('#bankPractice');
    if(!wrap)return;
    selected='';answered=false;
    if(!currentSource){
      wrap.innerHTML='<div class="bank-empty"><span>?</span><b>选择一个公开题源</b><small>题目只会在你主动载入时下载，不影响首页进入速度。</small></div>';
      return;
    }
    const q=currentQuestion();
    if(!q){
      wrap.innerHTML='<div class="bank-empty"><span>✓</span><b>当前筛选没有待刷题目</b><small>可以切换科目、模式，或选择“全部题目”。</small></div>';
      return;
    }
    const p=progressFor(q.id);
    wrap.innerHTML=`
      <div class="bank-question-head">
        <div><span class="bank-chip">${esc(q.category)}</span><span class="bank-chip subtle">${esc(q.sourceTitle)} #${q.index}</span></div>
        <div class="bank-counter">${currentIndex+1} / ${queue.length}</div>
      </div>
      <div class="bank-question">${esc(q.stem)}</div>
      <div class="bank-options">
        ${q.options.map(o=>`<button type="button" class="bank-option" data-bank-option="${o.key}"><b>${o.key}</b><span>${esc(o.text)}</span></button>`).join('')}
      </div>
      <div class="bank-result" id="bankResult" hidden></div>
      <div class="bank-actions">
        <button type="button" class="btn" id="bankSubmit">提交答案</button>
        <button type="button" class="btn ghost" id="bankNext">下一题</button>
        <button type="button" class="btn ghost ${p.starred?'is-starred':''}" id="bankStar">${p.starred?'★ 已收藏':'☆ 收藏'}</button>
        <button type="button" class="btn ghost" id="bankImport">收入我的训练卡</button>
      </div>`;

    wrap.querySelectorAll('[data-bank-option]').forEach(btn=>btn.onclick=()=>{
      if(answered)return;
      selected=btn.dataset.bankOption;
      wrap.querySelectorAll('[data-bank-option]').forEach(x=>x.classList.toggle('selected',x===btn));
    });
    document.querySelector('#bankSubmit').onclick=submitAnswer;
    document.querySelector('#bankNext').onclick=nextQuestion;
    document.querySelector('#bankStar').onclick=toggleStar;
    document.querySelector('#bankImport').onclick=importCurrent;
  }

  function submitAnswer(){
    const q=currentQuestion();if(!q||answered)return;
    if(!selected){setBankMessage('先选一个选项再交卷。',true);return}
    answered=true;
    const correct=selected===q.answer;
    const old=progressFor(q.id);
    db.externalQuestionProgress[q.id]={
      ...old,
      seen:true,
      attempts:Number(old.attempts||0)+1,
      correctCount:Number(old.correctCount||0)+(correct?1:0),
      wrong:!correct,
      lastSelected:selected,
      lastCorrect:correct,
      lastAt:new Date().toISOString()
    };
    announceChange();
    const wrap=document.querySelector('#bankPractice');
    wrap.querySelectorAll('[data-bank-option]').forEach(btn=>{
      const key=btn.dataset.bankOption;
      if(key===q.answer)btn.classList.add('correct');
      if(key===selected&&!correct)btn.classList.add('wrong');
    });
    const result=document.querySelector('#bankResult');
    result.hidden=false;
    result.className=`bank-result ${correct?'good':'bad'}`;
    result.innerHTML=`<b>${correct?'回答正确':'回答错误'}</b><span>标准答案：${q.answer}</span><small>公开源仅提供标准答案，不自动伪造解析。需要时可收入“我的训练卡”后补自己的规则链。</small>`;
    document.querySelector('#bankSubmit').disabled=true;
    setBankMessage(correct?'命中。继续保持规则调用速度。':'已自动加入错题队列。');
    renderBankStats();
  }

  function nextQuestion(){
    if(!queue.length)return;
    currentIndex=(currentIndex+1)%queue.length;
    renderPractice();
  }

  function toggleStar(){
    const q=currentQuestion();if(!q)return;
    const old=progressFor(q.id);
    db.externalQuestionProgress[q.id]={...old,starred:!old.starred};
    announceChange();
    renderPractice();renderBankStats();
  }

  function importCurrent(){
    const q=currentQuestion();if(!q)return;
    const exists=db.questions.some(x=>x.externalId===q.id);
    if(exists){setBankMessage('这道题已经在你的训练卡里了。');return}
    const options=q.options.map(o=>`${o.key}. ${o.text}`).join('\n');
    const nextId=Math.max(0,...db.questions.map(x=>Number(x.id)||0))+1;
    db.questions.push({
      id:nextId,
      cat:q.category==='拓展'?'法理':q.category,
      q:`${q.stem}\n${options}`,
      a:`标准答案：${q.answer}。\n来源：${q.sourceTitle}（公开学术数据）`,
      active:true,
      externalId:q.id
    });
    announceChange();
    try{renderQuestions()}catch{}
    setBankMessage('已收入“我的训练卡”，可以继续补自己的解析。');
  }

  function renderBankStats(){
    const el=document.querySelector('#bankStats');if(!el)return;
    const ids=currentSource?loadedQuestions.map(q=>q.id):Object.keys(db.externalQuestionProgress);
    const rows=ids.map(id=>progressFor(id)).filter(x=>x.seen||x.starred||x.wrong);
    const attempted=rows.filter(x=>x.seen).length;
    const attempts=rows.reduce((s,x)=>s+Number(x.attempts||0),0);
    const correct=rows.reduce((s,x)=>s+Number(x.correctCount||0),0);
    const wrong=rows.filter(x=>x.wrong).length;
    const starred=rows.filter(x=>x.starred).length;
    const accuracy=attempts?Math.round(correct/attempts*100):0;
    el.innerHTML=`
      <div><span>已做</span><strong>${attempted}</strong></div>
      <div><span>正确率</span><strong>${accuracy}%</strong></div>
      <div><span>错题</span><strong>${wrong}</strong></div>
      <div><span>收藏</span><strong>${starred}</strong></div>`;
  }

  function renderSourceCards(){
    const el=document.querySelector('#bankSources');if(!el)return;
    el.innerHTML=SOURCES.map(s=>`
      <article class="bank-source ${currentSource?.id===s.id?'active':''}">
        <div class="bank-source-icon">${s.id.includes('case')?'CASE':'QA'}</div>
        <div class="bank-source-copy">
          <span class="micro">${esc(s.subtitle)}</span>
          <h4>${esc(s.title)}</h4>
          <p>${esc(s.note)}</p>
          <div class="bank-source-meta"><span>${s.count} 道</span><span>${esc(s.kind)}</span><a href="${s.sourceUrl}" target="_blank" rel="noopener">来源说明 ↗</a></div>
        </div>
        <button class="btn ghost" type="button" data-load-source="${s.id}">${currentSource?.id===s.id?'已载入':'载入题源'}</button>
      </article>`).join('');
    el.querySelectorAll('[data-load-source]').forEach(btn=>btn.onclick=()=>{
      const s=SOURCES.find(x=>x.id===btn.dataset.loadSource);if(s)loadSource(s);
    });
  }

  function setBankMessage(text,error=false){
    const el=document.querySelector('#bankMessage');if(!el)return;
    el.textContent=text;el.classList.toggle('error',error);
  }

  function switchTab(name){
    document.querySelectorAll('[data-bank-tab]').forEach(b=>b.classList.toggle('active',b.dataset.bankTab===name));
    const pub=document.querySelector('#publicBank');
    const personal=document.querySelector('.personal-bank-panel');
    if(pub)pub.hidden=name!=='public';
    if(personal)personal.hidden=name!=='personal';
  }

  function injectBank(){
    const section=document.querySelector('#questions');
    if(!section||document.querySelector('#publicBank'))return;
    const pageTitle=section.querySelector('.page-title');
    const personal=section.querySelector(':scope > article.panel');
    if(!pageTitle||!personal)return;
    personal.classList.add('personal-bank-panel');
    personal.hidden=true;

    const tabs=document.createElement('div');
    tabs.className='bank-tabs';
    tabs.innerHTML=`<button class="active" type="button" data-bank-tab="public">公开刷题库</button><button type="button" data-bank-tab="personal">我的训练卡</button>`;
    pageTitle.after(tabs);

    const hub=document.createElement('div');
    hub.id='publicBank';
    hub.innerHTML=`
      <section class="bank-hero">
        <div class="bank-scene" aria-hidden="true"><div class="bank-shelf s1"></div><div class="bank-shelf s2"></div><div class="bank-desk"></div><img src="./assets/companion.svg" loading="lazy" decoding="async" alt=""></div>
        <div class="bank-hero-copy">
          <p class="micro">LEGAL ARCHIVE GUILD</p>
          <h3>题库道场</h3>
          <p>397 / 497 主线题继续由你自己的训练卡负责。公开源作为规则调用、案例判断和法律知识广度训练，不冒充法硕真题。</p>
          <div class="bank-stats" id="bankStats"></div>
        </div>
      </section>

      <section class="panel bank-catalog">
        <div class="panel-head"><div><p class="micro">PUBLIC SOURCES</p><h3>公开题源</h3></div><span class="pill">按需载入 · 本机缓存</span></div>
        <div id="bankSources" class="bank-sources"></div>
        <div class="bank-license-note">公开数据的版权与许可仍归原数据集/原始来源约束。本训练营只做按需读取与个人练习，不镜像商业法硕题库。</div>
      </section>

      <section class="panel bank-workbench">
        <div class="bank-controls">
          <label>题源<select id="bankSourceSelect">${SOURCES.map(s=>`<option value="${s.id}">${esc(s.title)}</option>`).join('')}</select></label>
          <label>科目<select id="bankSubject"><option value="core">法硕核心五科</option><option value="民法">民法</option><option value="刑法">刑法</option><option value="法理">法理</option><option value="宪法">宪法</option><option value="法制史">法制史</option><option value="拓展">其他法律</option><option value="all">全部</option></select></label>
          <label>模式<select id="bankMode"><option value="unseen">未做优先</option><option value="random">随机刷题</option><option value="wrong">错题重练</option><option value="starred">收藏题</option><option value="all">全部题目</option></select></label>
          <button type="button" class="btn ghost" id="bankApply">应用筛选</button>
        </div>
        <div class="bank-message" id="bankMessage">公开题源不会在首页自动下载。打开题库页后也只有点击“载入题源”才会请求数据。</div>
        <div id="bankPractice"></div>
      </section>`;
    tabs.after(hub);

    tabs.querySelectorAll('[data-bank-tab]').forEach(b=>b.onclick=()=>switchTab(b.dataset.bankTab));
    document.querySelector('#bankApply').onclick=()=>buildQueue(true);
    document.querySelector('#bankSourceSelect').onchange=async e=>{
      const s=SOURCES.find(x=>x.id===e.target.value);if(s)await loadSource(s);
    };
    pageTitle.querySelector('#addQ')?.addEventListener('click',()=>switchTab('personal'));
    renderSourceCards();renderBankStats();renderPractice();
  }

  injectBank();
})();
