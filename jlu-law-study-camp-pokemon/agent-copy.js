/* One-click clipboard handoff for daily and weekly study review. */
(function(){
  const TIMEZONE='Asia/Shanghai';
  const EXAM_DATE='2026-12-19';
  const WEEKLY_SCHEMA='jlu-study-weekly-snapshot-v1';
  const num=v=>Number(v||0);
  const round=v=>Math.round(num(v)*100)/100;
  const pad=n=>String(n).padStart(2,'0');

  function shanghaiDate(date=new Date()){
    const parts=new Intl.DateTimeFormat('en-CA',{
      timeZone:TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit'
    }).formatToParts(date).reduce((o,p)=>(o[p.type]=p.value,o),{});
    return `${parts.year}-${parts.month}-${parts.day}`;
  }

  function generatedAt(){
    const parts=new Intl.DateTimeFormat('en-GB',{
      timeZone:TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit',
      hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'
    }).formatToParts(new Date()).reduce((o,p)=>(o[p.type]=p.value,o),{});
    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}+08:00`;
  }

  function parseDate(s){
    const [y,m,d]=String(s).split('-').map(Number);
    return new Date(Date.UTC(y,m-1,d));
  }

  function formatDate(d){
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}`;
  }

  function addDays(s,n){
    const d=parseDate(s);d.setUTCDate(d.getUTCDate()+n);return formatDate(d);
  }

  function daysBetween(from,to){
    return Math.max(0,Math.round((parseDate(to)-parseDate(from))/86400000));
  }

  function weekBounds(date){
    const d=parseDate(date);
    const day=d.getUTCDay();
    const offset=day===0?-6:1-day;
    d.setUTCDate(d.getUTCDate()+offset);
    const start=formatDate(d);
    return {start,end:addDays(start,6),through:date};
  }

  function studyRoutesFor(date){
    const routes=db.dailyRoutes?.[date];
    if(Array.isArray(routes))return routes.filter(item=>item?.kind!=='break');
    const legacy=db.schedule?.[date];
    if(legacy&&typeof legacy==='object'){
      return Object.keys(legacy).sort((a,b)=>Number(a)-Number(b)).map(key=>({done:Boolean(legacy[key])}));
    }
    return [];
  }

  function dayRow(date){
    const r=db.checkins?.[date]||{};
    const routes=studyRoutesFor(date);
    const base397=round(r.base397),comp497=round(r.comp497),english=round(r.english),politics=round(r.politics);
    return {
      date,
      recorded:Boolean(db.checkins?.[date]),
      base397,
      comp497,
      english,
      politics,
      total:round(base397+comp497+english+politics),
      tasks_done:routes.filter(x=>x.done).length,
      tasks_total:routes.length,
      review:r.review||'',
      blocker:r.blocker||'',
      tomorrow:r.tomorrow||''
    };
  }

  function questionStats(){
    const progress=Object.values(db.externalQuestionProgress||{});
    const attempts=progress.reduce((sum,row)=>sum+num(row?.attempts),0);
    const correct=progress.reduce((sum,row)=>sum+num(row?.correctCount),0);
    return {
      scope:'lifetime',
      attempts,
      accuracy:attempts?Math.round((correct/attempts)*10000)/10000:0,
      wrong_current:progress.filter(row=>row?.wrong).length
    };
  }

  function latestMock(){
    const mocks=[...(db.mocks||[])].filter(x=>x?.date).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
    const m=mocks.at(-1);if(!m)return null;
    const total=round(num(m.total)||num(m.politics)+num(m.english)+num(m.base397)+num(m.comp497));
    return {
      date:m.date,
      politics:round(m.politics),
      english:round(m.english),
      base397:round(m.base397),
      comp497:round(m.comp497),
      total,
      gap_to_375:round(total-375),
      gap_to_389:round(total-389),
      notes:m.notes||''
    };
  }

  function currentStage(date){
    const stages=typeof campaignStages!=='undefined'&&Array.isArray(campaignStages)?campaignStages:[];
    if(!stages.length)return null;
    let stage=stages.find(s=>date>=s.start&&date<=s.end);
    if(!stage)stage=date<stages[0].start?stages[0]:stages.at(-1);
    const total=Math.max(1,daysBetween(stage.start,stage.end)+1);
    const elapsed=date<stage.start?0:date>stage.end?total:daysBetween(stage.start,date)+1;
    return {
      lv:stage.lv,
      title:stage.title,
      start:stage.start,
      end:stage.end,
      goal:stage.goal,
      progress_percent:Math.round(elapsed/total*100),
      elapsed_days:elapsed,
      total_days:total,
      remaining_days:Math.max(0,total-elapsed)
    };
  }

  function weeklySnapshot(){
    const todayDate=typeof today==='function'?today():shanghaiDate();
    const bounds=weekBounds(todayDate);
    const days=[];
    for(let d=bounds.start;d<=bounds.through;d=addDays(d,1))days.push(dayRow(d));
    const summary={base397:0,comp497:0,english:0,politics:0,total:0,tasks_done:0,tasks_total:0};
    days.forEach(row=>{
      summary.base397+=row.base397;summary.comp497+=row.comp497;summary.english+=row.english;summary.politics+=row.politics;
      summary.total+=row.total;summary.tasks_done+=row.tasks_done;summary.tasks_total+=row.tasks_total;
    });
    Object.keys(summary).forEach(key=>{if(typeof summary[key]==='number')summary[key]=round(summary[key])});
    summary.checkin_days=days.filter(x=>x.recorded).length;
    summary.study_days=days.filter(x=>x.total>0).length;
    summary.average_per_elapsed_day=days.length?round(summary.total/days.length):0;

    return {
      schema:WEEKLY_SCHEMA,
      reportType:'weekly',
      intent:'weekly_review',
      generated_at:generatedAt(),
      timezone:TIMEZONE,
      week:{start:bounds.start,end:bounds.end,through:bounds.through,elapsed_days:days.length},
      exam:{date:EXAM_DATE,days_left:daysBetween(todayDate,EXAM_DATE)},
      current_stage:currentStage(todayDate),
      summary,
      days,
      question_stats:questionStats(),
      latest_mock:latestMock()
    };
  }

  async function writeClipboard(text){
    if(navigator.clipboard?.writeText){
      try{await navigator.clipboard.writeText(text);return true}catch{}
    }
    const ta=document.createElement('textarea');
    ta.value=text;
    ta.setAttribute('readonly','');
    ta.style.position='fixed';ta.style.opacity='0';ta.style.pointerEvents='none';
    document.body.appendChild(ta);ta.select();ta.setSelectionRange(0,ta.value.length);
    let ok=false;
    try{ok=document.execCommand('copy')}catch{}
    ta.remove();return ok;
  }

  function dailyClipboardText(data){
    return `请根据以下结构化学习数据执行日复盘。优先读取 JSON 中的 schema、reportType、intent 作为任务路由；只依据已有数据分析，缺失字段不要脑补。question_stats.scope=lifetime 时，不要把累计题库统计误判为今日增量。\n\n${JSON.stringify(data,null,2)}`;
  }

  function weeklyClipboardText(data){
    return `请根据以下结构化学习数据执行周复盘。优先读取 JSON 中的 schema、reportType、intent 作为任务路由；明确区分“未记录”和“表现较差”。question_stats.scope=lifetime 时，不要把累计题库统计误判为本周增量。\n\n${JSON.stringify(data,null,2)}`;
  }

  async function copyWithFeedback(button,text,successText){
    const original=button.innerHTML;
    button.disabled=true;
    const ok=await writeClipboard(text);
    if(ok){
      button.classList.add('copied');
      button.innerHTML='<span>✓</span><b>已复制</b><small>打开 Agent 直接粘贴</small>';
      try{toast(successText)}catch{}
      setTimeout(()=>{button.innerHTML=original;button.classList.remove('copied');button.disabled=false},1400);
    }else{
      button.disabled=false;
      try{toast('复制失败，请重试或使用导出文件')}catch{}
    }
  }

  function apply(){
    const actions=document.querySelector('.agent-export-actions');
    if(!actions||document.querySelector('#copyDailyAgent'))return Boolean(actions);

    const daily=document.createElement('button');
    daily.type='button';daily.id='copyDailyAgent';daily.className='btn agent-export-primary agent-export-copy';
    daily.innerHTML='<span>🤖</span><b>复制日复盘给 Agent</b><small>指令 + JSON · 直接粘贴</small>';

    const weekly=document.createElement('button');
    weekly.type='button';weekly.id='copyWeeklyAgent';weekly.className='btn agent-export-primary agent-export-copy';
    weekly.innerHTML='<span>🤖</span><b>复制周复盘给 Agent</b><small>指令 + JSON · 直接粘贴</small>';

    actions.append(daily,weekly);

    daily.onclick=()=>{
      if(typeof window.jluBuildDailySnapshot!=='function'){
        try{toast('日复盘快照还没准备好，请稍后再点')}catch{}
        return;
      }
      const data=window.jluBuildDailySnapshot();
      copyWithFeedback(daily,dailyClipboardText(data),'日复盘已复制，可直接粘贴给 Agent');
    };

    weekly.onclick=()=>{
      const data=weeklySnapshot();
      copyWithFeedback(weekly,weeklyClipboardText(data),'周复盘已复制，可直接粘贴给 Agent');
    };

    const note=document.querySelector('.agent-export-note');
    if(note)note.textContent='导出用于归档；复制用于日常。复制按钮会把一条简短复盘指令与结构化 JSON 一次性写入剪贴板，打开 Agent 直接粘贴即可。';
    return true;
  }

  if(!apply()){
    let tries=0;
    const timer=setInterval(()=>{tries++;if(apply()||tries>50)clearInterval(timer)},100);
  }
})();
