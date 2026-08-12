/* Exact daily Agent snapshot schema requested by the study workflow. */
(function(){
  const SCHEMA='jlu-study-snapshot-v1';
  const TIMEZONE='Asia/Shanghai';
  const num=v=>Number(v||0);
  const round=v=>Math.round(num(v)*100)/100;
  const pad=n=>String(n).padStart(2,'0');

  function localDate(){
    try{return typeof today==='function'?today():shanghaiDate(new Date())}catch{return shanghaiDate(new Date())}
  }

  function shanghaiDate(date){
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

  function addDays(s,n){
    const d=parseDate(s);
    d.setUTCDate(d.getUTCDate()+n);
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}`;
  }

  function studyRoutesFor(date){
    const routes=db.dailyRoutes?.[date];
    if(Array.isArray(routes)){
      const study=routes.filter(item=>item?.kind!=='break');
      return study.map(item=>({done:Boolean(item.done)}));
    }
    const legacy=db.schedule?.[date];
    if(legacy&&typeof legacy==='object'){
      return Object.keys(legacy).sort((a,b)=>Number(a)-Number(b)).map(key=>({done:Boolean(legacy[key])}));
    }
    return [];
  }

  function compactDay(date,withText=false){
    const r=db.checkins?.[date]||{};
    const base397=round(r.base397);
    const comp497=round(r.comp497);
    const english=round(r.english);
    const politics=round(r.politics);
    const total=round(base397+comp497+english+politics);
    const routes=studyRoutesFor(date);
    const item={date,base397,comp497,english,politics,total};
    if(withText){
      item.tasks_done=routes.filter(x=>x.done).length;
      item.tasks_total=routes.length;
      item.review=r.review||'';
      item.blocker=r.blocker||'';
      item.tomorrow=r.tomorrow||'';
    }
    return item;
  }

  function last7Days(date){
    const out=[];
    for(let offset=7;offset>=1;offset--){
      const d=addDays(date,-offset);
      if(db.checkins?.[d])out.push(compactDay(d,false));
    }
    return out;
  }

  function questionStats(){
    const progress=Object.values(db.externalQuestionProgress||{});
    const attempts=progress.reduce((sum,row)=>sum+num(row?.attempts),0);
    const correct=progress.reduce((sum,row)=>sum+num(row?.correctCount),0);
    return {
      attempts,
      accuracy:attempts?Math.round((correct/attempts)*10000)/10000:0,
      wrong_current:progress.filter(row=>row?.wrong).length
    };
  }

  function latestMock(){
    const mocks=[...(db.mocks||[])].filter(x=>x?.date).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
    const m=mocks.at(-1);
    if(!m)return null;
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

  function snapshot(){
    const date=localDate();
    return {
      schema:SCHEMA,
      generated_at:generatedAt(),
      timezone:TIMEZONE,
      today:compactDay(date,true),
      last7days:last7Days(date),
      question_stats:questionStats(),
      latest_mock:latestMock()
    };
  }

  function downloadJson(filename,data){
    const blob=new Blob(['\ufeff',JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;
    a.download=filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
  }

  function apply(){
    const button=document.querySelector('#exportDailyAgent');
    if(!button)return false;
    button.innerHTML='<span>DAY</span><b>导出日复盘快照</b><small>.json · jlu-study-snapshot-v1</small>';
    button.onclick=()=>{
      const data=snapshot();
      downloadJson(`JLU-Study-Snapshot-${data.today.date}.json`,data);
      try{toast('日复盘 JSON 已导出')}catch{}
    };

    const note=document.querySelector('.agent-export-note');
    if(note)note.textContent='日导出严格使用 jlu-study-snapshot-v1 JSON，便于 Agent 稳定读取；周导出继续保留完整 Markdown 周报。';
    return true;
  }

  if(!apply()){
    let tries=0;
    const timer=setInterval(()=>{
      tries++;
      if(apply()||tries>50)clearInterval(timer);
    },100);
  }
})();
