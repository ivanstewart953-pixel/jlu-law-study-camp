/* Agent-ready daily and weekly reports. Loaded only when Battle Report is opened. */
(function(){
  const EXAM_DATE='2026-12-19';
  const SUBJECTS=[
    ['base397','397 法律硕士专业基础'],
    ['comp497','497 法律硕士综合'],
    ['english','英语一'],
    ['politics','思想政治理论']
  ];

  const num=v=>Number(v||0);
  const round=v=>Math.round(Number(v||0)*100)/100;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const pad=n=>String(n).padStart(2,'0');
  const iso=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const parse=s=>{const [y,m,d]=String(s).split('-').map(Number);return new Date(y,m-1,d)};
  const addDays=(s,n)=>{const d=parse(s);d.setDate(d.getDate()+n);return iso(d)};
  const daysInclusive=(a,b)=>Math.max(0,Math.round((parse(b)-parse(a))/86400000)+1);
  const minDate=(a,b)=>a<b?a:b;
  const maxDate=(a,b)=>a>b?a:b;
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));

  function reportToday(){
    try{return typeof today==='function'?today():iso(new Date())}catch{return iso(new Date())}
  }

  function examDaysLeft(date=reportToday()){
    return Math.max(0,Math.round((parse(EXAM_DATE)-parse(date))/86400000));
  }

  function stageData(date=reportToday()){
    const stages=typeof campaignStages!=='undefined'&&Array.isArray(campaignStages)?campaignStages:[];
    if(!stages.length)return null;
    let index=stages.findIndex(s=>date>=s.start&&date<=s.end);
    if(index<0)index=date<stages[0].start?0:stages.length-1;
    const stage=stages[index];
    const total=daysInclusive(stage.start,stage.end);
    const elapsed=date<stage.start?0:date>stage.end?total:daysInclusive(stage.start,date);
    const remaining=Math.max(0,total-elapsed);
    return {
      index:index+1,
      totalStages:stages.length,
      lv:stage.lv,
      title:stage.title,
      start:stage.start,
      end:stage.end,
      range:stage.range,
      goal:stage.goal,
      elapsedDays:elapsed,
      totalDays:total,
      remainingDays:remaining,
      progressPercent:total?Math.round(elapsed/total*100):0
    };
  }

  function latestMock(){
    const mocks=[...(db.mocks||[])].filter(m=>m&&m.date);
    mocks.sort((a,b)=>String(a.date).localeCompare(String(b.date)));
    return mocks.at(-1)||null;
  }

  function mockSummary(mock){
    if(!mock)return null;
    const total=num(mock.total)||num(mock.politics)+num(mock.english)+num(mock.base397)+num(mock.comp497);
    return {
      date:mock.date,
      total,
      politics:num(mock.politics),
      english:num(mock.english),
      base397:num(mock.base397),
      comp497:num(mock.comp497),
      gapTo375:total-375,
      gapTo389:total-389,
      notes:mock.notes||''
    };
  }

  function routeFor(date){
    const flexible=db.dailyRoutes?.[date];
    if(Array.isArray(flexible))return flexible.map((r,index)=>({
      index:index+1,
      time:r.time||'',
      title:r.title||'',
      tag:r.tag||'',
      done:Boolean(r.done)
    }));
    const legacy=db.schedule?.[date];
    if(legacy&&typeof legacy==='object')return Object.keys(legacy).map((key,index)=>({
      index:index+1,time:'',title:`任务 ${index+1}`,tag:'旧版日程',done:Boolean(legacy[key])
    }));
    return [];
  }

  function questionSnapshot(){
    const values=Object.values(db.mastery||{});
    const external=Object.values(db.externalQuestionProgress||{});
    return {
      personalQuestionCount:(db.questions||[]).length,
      mastery:{
        mastered:values.filter(v=>v==='会').length,
        fuzzy:values.filter(v=>v==='模糊').length,
        unknown:values.filter(v=>v==='不会').length,
        evaluated:values.length
      },
      external:{
        attempted:external.filter(v=>v?.seen).length,
        wrong:external.filter(v=>v?.wrong).length,
        starred:external.filter(v=>v?.starred).length,
        totalAttempts:external.reduce((s,v)=>s+num(v?.attempts),0),
        totalCorrect:external.reduce((s,v)=>s+num(v?.correctCount),0)
      }
    };
  }

  function dailyHoursTarget(){
    const value=num(db.settings?.dailyHoursTarget);
    return value>0?value:null;
  }

  function dayRecord(date){
    const r=db.checkins?.[date]||{};
    const hours={};
    SUBJECTS.forEach(([key])=>hours[key]=num(r[key]));
    const total=Object.values(hours).reduce((s,v)=>s+v,0);
    const routes=routeFor(date);
    return {
      date,
      saved:Boolean(db.checkins?.[date]),
      hours,
      totalHours:round(total),
      review:r.review||'',
      blocker:r.blocker||'',
      tomorrow:r.tomorrow||'',
      routes,
      routeDone:routes.filter(x=>x.done).length,
      routeTotal:routes.length
    };
  }

  function weekBounds(date=reportToday()){
    const d=parse(date);
    const jsDay=d.getDay();
    const offset=jsDay===0?-6:1-jsDay;
    d.setDate(d.getDate()+offset);
    const monday=iso(d);
    return {monday,sunday:addDays(monday,6),through:minDate(date,addDays(monday,6))};
  }

  function gapText(value,target){
    if(value===null||value===undefined)return '暂无数据';
    const gap=round(value-target);
    if(gap===0)return `已达到 ${target}`;
    return gap>0?`高于 ${target}：+${gap}`:`距离 ${target}：${Math.abs(gap)}`;
  }

  function hoursGap(total,target){
    if(!target)return null;
    return round(total-target);
  }

  function dailyPayload(date=reportToday()){
    const record=dayRecord(date);
    const stage=stageData(date);
    const mock=mockSummary(latestMock());
    const target=dailyHoursTarget();
    return {
      reportType:'daily',
      generatedAt:new Date().toISOString(),
      date,
      exam:{date:EXAM_DATE,daysLeft:examDaysLeft(date)},
      stage,
      study:{...record,dailyHoursTarget:target,hoursGap:hoursGap(record.totalHours,target)},
      latestMock:mock,
      scoreTargets:{primary:375,sprint:389},
      questions:questionSnapshot()
    };
  }

  function weeklyPayload(date=reportToday()){
    const bounds=weekBounds(date);
    const dates=[];
    for(let d=bounds.monday;d<=bounds.through;d=addDays(d,1))dates.push(d);
    const records=dates.map(dayRecord);
    const totals={base397:0,comp497:0,english:0,politics:0};
    records.forEach(r=>SUBJECTS.forEach(([key])=>totals[key]+=num(r.hours[key])));
    Object.keys(totals).forEach(k=>totals[k]=round(totals[k]));
    const totalHours=round(Object.values(totals).reduce((s,v)=>s+v,0));
    const checkinDays=records.filter(r=>r.saved).length;
    const studyDays=records.filter(r=>r.totalHours>0).length;
    const routesDone=records.reduce((s,r)=>s+r.routeDone,0);
    const routesTotal=records.reduce((s,r)=>s+r.routeTotal,0);
    const mocks=(db.mocks||[]).filter(m=>m.date>=bounds.monday&&m.date<=bounds.through).map(mockSummary);
    const latest=mockSummary(latestMock());
    const dailyTarget=dailyHoursTarget();
    const elapsedDays=dates.length;
    return {
      reportType:'weekly',
      generatedAt:new Date().toISOString(),
      week:{monday:bounds.monday,sunday:bounds.sunday,through:bounds.through,elapsedDays},
      exam:{date:EXAM_DATE,daysLeft:examDaysLeft(date)},
      stageStart:stageData(bounds.monday),
      stageCurrent:stageData(bounds.through),
      study:{
        totalHours,
        subjectHours:totals,
        checkinDays,
        studyDays,
        averagePerRecordedDay:checkinDays?round(totalHours/checkinDays):0,
        averagePerElapsedDay:elapsedDays?round(totalHours/elapsedDays):0,
        routesDone,routesTotal,
        dailyHoursTarget:dailyTarget,
        elapsedTargetHours:dailyTarget?round(dailyTarget*elapsedDays):null,
        elapsedTargetGap:dailyTarget?round(totalHours-dailyTarget*elapsedDays):null,
        days:records
      },
      mocksInWeek:mocks,
      latestMock:latest,
      scoreTargets:{primary:375,sprint:389},
      questions:questionSnapshot()
    };
  }

  function dailyMarkdown(payload){
    const s=payload.study,stage=payload.stage,m=payload.latestMock;
    const targetLine=s.dailyHoursTarget
      ? `今日 ${s.totalHours.toFixed(1)} 小时，日目标 ${s.dailyHoursTarget} 小时，${s.hoursGap>=0?`超出 ${s.hoursGap.toFixed(1)}`:`还差 ${Math.abs(s.hoursGap).toFixed(1)}`} 小时。`
      : `今日学习 ${s.totalHours.toFixed(1)} 小时；尚未设置日学习时长目标。`;
    const mockLine=m?`最近模考 ${m.total} 分（${m.date}），${gapText(m.total,375)}，距 389 还差 ${Math.max(0,389-m.total)} 分。`:'暂无模考数据，暂时无法计算与 375 / 389 的分差。';
    const routeLine=s.routeTotal?`今日路线完成 ${s.routeDone}/${s.routeTotal}。`:'今日未记录自定路线。';
    const stageLine=stage?`${stage.lv}「${stage.title}」第 ${stage.elapsedDays}/${stage.totalDays} 天，阶段推进约 ${stage.progressPercent}%`:'暂无阶段数据';
    const subjectRows=SUBJECTS.map(([key,label])=>`| ${label} | ${num(s.hours[key]).toFixed(2)} |`).join('\n');
    const routes=s.routes.length?s.routes.map(r=>`- [${r.done?'x':' '}] ${r.time?`${r.time} · `:''}${r.title||'未命名任务'}${r.tag?` · ${r.tag}`:''}`).join('\n'):'- 未记录';
    return `# 吉大法硕训练营 · 日报\n\n> 用途：交给分析 Agent 做学习复盘。请优先依据记录本身分析，不要把未记录内容当作已完成。\n\n- 报告日期：${payload.date}\n- 距 2027 考研初试：**${payload.exam.daysLeft} 天**\n- 当前阶段：**${stageLine}**\n\n## 一句话状态\n\n${targetLine}${routeLine}${mockLine}\n\n## 今日四科投入\n\n| 科目 | 小时 |\n|---|---:|\n${subjectRows}\n| **合计** | **${s.totalHours.toFixed(2)}** |\n\n## 今日自定路线\n\n${routes}\n\n## 今日复盘\n\n- 真正吃透：${s.review||'未记录'}\n- 主要卡点：${s.blocker||'未记录'}\n- 明天第一步：${s.tomorrow||'未记录'}\n\n## 当前阶段任务\n\n${stage?`- 阶段：${stage.lv} ${stage.title}\n- 日期：${stage.range}\n- 推进：${stage.elapsedDays}/${stage.totalDays} 天（${stage.progressPercent}%）\n- 剩余：${stage.remainingDays} 天\n- 阶段目标：${stage.goal}`:'暂无阶段数据'}\n\n## 最近模考与分数目标\n\n${m?`- 最近模考：${m.date} · ${m.total} 分\n- 政治 ${m.politics} / 英语 ${m.english} / 397 ${m.base397} / 497 ${m.comp497}\n- 375 主目标差值：${m.gapTo375>=0?'+':''}${m.gapTo375}\n- 389 冲刺差值：${m.gapTo389>=0?'+':''}${m.gapTo389}\n- 模考复盘：${m.notes||'未记录'}`:'暂无模考记录'}\n\n## 题库快照\n\n- 我的训练卡：${payload.questions.personalQuestionCount} 道\n- 掌握度：会 ${payload.questions.mastery.mastered} / 模糊 ${payload.questions.mastery.fuzzy} / 不会 ${payload.questions.mastery.unknown}\n- 公开刷题：已做 ${payload.questions.external.attempted} 道 / 当前错题 ${payload.questions.external.wrong} 道 / 收藏 ${payload.questions.external.starred} 道\n\n## 给分析 Agent 的建议关注点\n\n请重点判断：\n1. 今日四科投入是否符合当前阶段重点。\n2. 时长、任务完成和“真正吃透”的内容是否匹配，避免只看总小时数。\n3. 当前阶段剩余时间与未解决卡点是否存在进度风险。\n4. 结合最近模考与 375 / 389 的差距，给出明日最值得优先修复的 1–3 项。\n\n## Machine-readable JSON\n\n\`\`\`json\n${JSON.stringify(payload,null,2)}\n\`\`\`\n`;
  }

  function weeklyMarkdown(payload){
    const s=payload.study,stage=payload.stageCurrent,m=payload.latestMock;
    const targetLine=s.dailyHoursTarget
      ? `截至今日，本周累计 ${s.totalHours.toFixed(1)} 小时；按日目标 ${s.dailyHoursTarget} 小时计算，当前应累计 ${s.elapsedTargetHours.toFixed(1)} 小时，${s.elapsedTargetGap>=0?`超出 ${s.elapsedTargetGap.toFixed(1)}`:`还差 ${Math.abs(s.elapsedTargetGap).toFixed(1)}`} 小时。`
      : `截至今日，本周累计 ${s.totalHours.toFixed(1)} 小时；尚未设置日学习时长目标。`;
    const mockLine=m?`最近模考 ${m.total} 分，距 375 ${m.gapTo375>=0?`高 ${m.gapTo375}`:`差 ${Math.abs(m.gapTo375)}`} 分。`:'本周/当前暂无可用于比较的模考记录。';
    const subjectRows=SUBJECTS.map(([key,label])=>`| ${label} | ${num(s.subjectHours[key]).toFixed(2)} |`).join('\n');
    const dayRows=s.days.map(r=>`| ${r.date} | ${r.totalHours.toFixed(2)} | ${r.routeTotal?`${r.routeDone}/${r.routeTotal}`:'--'} | ${String(r.review||'').replace(/\|/g,'\\|')||'--'} |`).join('\n');
    const stageStart=payload.stageStart,transition=stageStart&&stage&&stageStart.lv!==stage.lv?`${stageStart.lv} → ${stage.lv}`:stage?.lv||'暂无';
    return `# 吉大法硕训练营 · 本周周报\n\n> 用途：交给分析 Agent 做周复盘与下周校准。请优先依据记录本身，不要把缺失记录推断为已完成。\n\n- 本周：${payload.week.monday} 至 ${payload.week.sunday}\n- 数据截至：${payload.week.through}\n- 距 2027 考研初试：**${payload.exam.daysLeft} 天**\n- 本周阶段轨迹：**${transition}**\n\n## 一句话状态\n\n${targetLine} 本周打卡 ${s.checkinDays}/${s.elapsedDays} 天，日均（按已记录日）${s.averagePerRecordedDay.toFixed(1)} 小时。${mockLine}\n\n## 本周四科投入\n\n| 科目 | 小时 |\n|---|---:|\n${subjectRows}\n| **合计** | **${s.totalHours.toFixed(2)}** |\n\n- 打卡天数：${s.checkinDays}\n- 有学习时长的天数：${s.studyDays}\n- 按已记录日平均：${s.averagePerRecordedDay.toFixed(2)} 小时\n- 按本周已过去自然日平均：${s.averagePerElapsedDay.toFixed(2)} 小时\n- 路线任务完成：${s.routesDone}/${s.routesTotal||0}\n\n## 每日记录\n\n| 日期 | 总时长 | 路线 | 当日吃透/复盘 |\n|---|---:|---:|---|\n${dayRows}\n\n## 当前阶段推进\n\n${stage?`- 当前：${stage.lv} ${stage.title}\n- 阶段周期：${stage.range}\n- 推进：${stage.elapsedDays}/${stage.totalDays} 天（${stage.progressPercent}%）\n- 剩余：${stage.remainingDays} 天\n- 阶段目标：${stage.goal}`:'暂无阶段数据'}\n\n## 本周模考\n\n${payload.mocksInWeek.length?payload.mocksInWeek.map(x=>`- ${x.date}：${x.total} 分；375 差值 ${x.gapTo375>=0?'+':''}${x.gapTo375}；389 差值 ${x.gapTo389>=0?'+':''}${x.gapTo389}；${x.notes||'未写复盘'}`).join('\n'):'- 本周没有模考记录'}\n\n## 题库快照\n\n- 我的训练卡：${payload.questions.personalQuestionCount} 道\n- 掌握度：会 ${payload.questions.mastery.mastered} / 模糊 ${payload.questions.mastery.fuzzy} / 不会 ${payload.questions.mastery.unknown}\n- 公开刷题：已做 ${payload.questions.external.attempted} 道 / 当前错题 ${payload.questions.external.wrong} 道 / 收藏 ${payload.questions.external.starred} 道\n\n## 给分析 Agent 的建议关注点\n\n请重点判断：\n1. 本周四科时间分配是否匹配当前阶段任务。\n2. 哪几天出现明显掉速，是否能从卡点和复盘中找到原因。\n3. 路线完成率、学习时长与实际产出是否一致。\n4. 结合阶段剩余天数和最新模考差距，为下一周给出 3 个优先修复项与建议时间配比。\n5. 明确区分“数据缺失”和“表现较差”，不要把没记录直接当作没学习。\n\n## Machine-readable JSON\n\n\`\`\`json\n${JSON.stringify(payload,null,2)}\n\`\`\`\n`;
  }

  function download(filename,text){
    const blob=new Blob(['\ufeff',text],{type:'text/markdown;charset=utf-8'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
  }

  function renderPreview(){
    const el=document.querySelector('#agentExportPreview');if(!el)return;
    const p=dailyPayload();
    const s=p.study,stage=p.stage,m=p.latestMock,target=s.dailyHoursTarget;
    const hourStatus=target?(s.hoursGap>=0?`+${s.hoursGap.toFixed(1)}h`:`${s.hoursGap.toFixed(1)}h`):'未设目标';
    el.innerHTML=`
      <div><span>今日学习</span><strong>${s.totalHours.toFixed(1)}h</strong><small>${target?`目标 ${target}h · 差值 ${hourStatus}`:'可设置日目标'}</small></div>
      <div><span>距初试</span><strong>${p.exam.daysLeft}</strong><small>天</small></div>
      <div><span>阶段推进</span><strong>${stage?stage.progressPercent:0}%</strong><small>${stage?`${stage.lv} · ${stage.elapsedDays}/${stage.totalDays}天`:'暂无'}</small></div>
      <div><span>距 375</span><strong>${m?`${m.gapTo375>=0?'+':''}${m.gapTo375}`:'--'}</strong><small>${m?`最近 ${m.total} 分`:'暂无模考'}</small></div>`;
  }

  function inject(){
    const view=document.querySelector('#data');
    if(!view||document.querySelector('#agentExportPanel'))return;
    const pageTitle=view.querySelector('.page-title');if(!pageTitle)return;
    const panel=document.createElement('article');
    panel.id='agentExportPanel';
    panel.className='panel agent-export-panel';
    panel.innerHTML=`
      <div class="agent-export-head">
        <div><p class="micro">AGENT HANDOFF</p><h3>学习报告导出终端</h3><p class="muted">一键生成 Markdown + 结构化 JSON，直接喂给复盘 Agent。导出只读取你的现有记录，不上传到第三方。</p></div>
        <div class="agent-target"><label>日时长目标 <input id="agentDailyTarget" type="number" min="0" max="24" step="0.25" inputmode="decimal" placeholder="可选"></label></div>
      </div>
      <div class="agent-export-preview" id="agentExportPreview"></div>
      <div class="agent-export-actions">
        <button class="btn agent-export-primary" id="exportDailyAgent" type="button"><span>DAY</span><b>导出今日日报</b><small>.md · 今日完整快照</small></button>
        <button class="btn agent-export-primary" id="exportWeeklyAgent" type="button"><span>WEEK</span><b>导出本周周报</b><small>.md · 周一至今日</small></button>
      </div>
      <div class="agent-export-note">报告会包含距考试天数、当前六阶段进度、四科学时、路线完成、复盘、题库快照和最近模考分差。没有记录的字段会明确写“未记录”，不会替你脑补。</div>`;
    pageTitle.after(panel);

    const input=document.querySelector('#agentDailyTarget');
    const current=dailyHoursTarget();if(current)input.value=current;
    input.onchange=()=>{
      db.settings??={};
      const v=num(input.value);
      if(v>0)db.settings.dailyHoursTarget=v;else delete db.settings.dailyHoursTarget;
      try{save()}catch{}
      window.dispatchEvent(new CustomEvent('jlu:state-changed'));
      renderPreview();
    };
    document.querySelector('#exportDailyAgent').onclick=()=>{
      const p=dailyPayload();download(`JLU-Law-Daily-${p.date}.md`,dailyMarkdown(p));
      try{toast('今日日报已导出')}catch{}
    };
    document.querySelector('#exportWeeklyAgent').onclick=()=>{
      const p=weeklyPayload();download(`JLU-Law-Weekly-${p.week.monday}_to_${p.week.through}.md`,weeklyMarkdown(p));
      try{toast('本周周报已导出')}catch{}
    };
    renderPreview();
  }

  inject();
  document.querySelector('#nav')?.addEventListener('click',e=>{
    if(e.target.closest('button[data-view="data"]'))setTimeout(renderPreview,80);
  });
  document.addEventListener('submit',()=>setTimeout(renderPreview,120),true);
  document.addEventListener('change',()=>setTimeout(renderPreview,120),true);
  window.addEventListener('jlu:state-changed',()=>setTimeout(renderPreview,50));
})();
