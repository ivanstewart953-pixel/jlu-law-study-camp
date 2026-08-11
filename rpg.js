(function(){
  function getCurrentStage(){
    if(typeof stageIndex==='function' && Array.isArray(window.campaignStages||campaignStages)){
      const idx=stageIndex();
      return idx<=campaignStages.length?campaignStages[idx-1]:campaignStages[campaignStages.length-1];
    }
    return null;
  }

  function injectOverworld(){
    const todayView=document.querySelector('#today');
    const pageTitle=todayView?.querySelector('.page-title');
    if(!todayView||!pageTitle||document.querySelector('.rpg-overworld'))return;
    const stage=getCurrentStage();
    const stageText=stage?`${stage.lv} · ${stage.title}`:'当前阶段';
    const stageGoal=stage?.goal||'保持今天的节奏，把可控的一格地图点亮。';
    const li=typeof levelInfo==='function'?levelInfo():{lvl:1,rank:'备考新人',x:0};
    const wrap=document.createElement('div');
    wrap.className='rpg-overworld';
    wrap.innerHTML=`
      <section class="rpg-screen" aria-label="训练营冒险场景">
        <div class="pixel-cloud cloud1"></div><div class="pixel-cloud cloud2"></div>
        <div class="mountain m1"></div><div class="mountain m2"></div><div class="mountain m3"></div>
        <div class="path"></div><div class="grass-patch g1"></div><div class="grass-patch g2"></div><div class="grass-patch g3"></div>
        <div class="map-label">长春 · 吉大法硕训练区</div>
        <div class="rpg-trainer" aria-hidden="true"></div>
        <img class="rpg-companion" src="./assets/companion.svg" alt="原创伴学兽：律芽">
        <div class="map-objective"><b>${stageText}</b><br>${stageGoal}</div>
      </section>
      <aside class="trainer-card">
        <p class="micro">TRAINER CARD</p>
        <h3>训练师档案</h3>
        <div class="trainer-stats">
          <div class="trainer-mini"><span class="muted">XP 等级</span><strong>Lv.${li.lvl}</strong></div>
          <div class="trainer-mini"><span class="muted">称号</span><strong style="font-size:14px">${li.rank}</strong></div>
          <div class="trainer-mini"><span class="muted">目标</span><strong>375</strong></div>
          <div class="trainer-mini"><span class="muted">冲刺</span><strong>389</strong></div>
        </div>
        <div class="badge-row" aria-label="阶段徽章">
          ${[1,2,3,4,5,6].map((n)=>`<span class="rpg-badge ${typeof stageIndex==='function'&&n>stageIndex()?'locked':''}">${String(n).padStart(2,'0')}</span>`).join('')}
        </div>
        <div class="dialog-box" style="margin-top:18px">
          <span class="dialog-name">律芽</span>
          <div id="npcQuote">${document.querySelector('#quote')?.textContent||'今天先把眼前这一格地图走稳。'}</div>
        </div>
      </aside>`;
    pageTitle.after(wrap);
  }

  function decoratePanels(){
    const schedulePanel=document.querySelector('#schedule')?.closest('.panel');
    if(schedulePanel){
      schedulePanel.querySelector('h3')?.classList.add('quest-log-title');
    }
    const stagesEl=document.querySelector('#stages');
    const stagePanel=stagesEl?.closest('.panel');
    if(stagePanel && !stagePanel.classList.contains('campaign-board')) stagePanel.classList.add('campaign-board');
  }

  function syncNpc(){
    const q=document.querySelector('#quote');
    const npc=document.querySelector('#npcQuote');
    if(q&&npc)npc.textContent=q.textContent;
  }

  function loadRpgCss(){
    if(document.querySelector('link[data-rpg-css]'))return;
    const l=document.createElement('link');
    l.rel='stylesheet';l.href='./rpg.css';l.dataset.rpgCss='true';document.head.appendChild(l);
  }

  loadRpgCss();
  injectOverworld();
  decoratePanels();
  syncNpc();
  const obs=new MutationObserver(()=>{syncNpc();decoratePanels()});
  obs.observe(document.body,{subtree:true,childList:true,characterData:true});
})();
