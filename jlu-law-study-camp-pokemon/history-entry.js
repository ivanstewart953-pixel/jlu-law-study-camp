/* Historical study entry editor: replace the old date-only prompt with a full check-in form. */
(function(){
  const FIELDS=['base397','comp497','english','politics'];
  let modal=null;

  function ymd(date){return date.toLocaleDateString('en-CA')}
  function yesterday(){const d=new Date();d.setDate(d.getDate()-1);return ymd(d)}
  function num(v){const n=Number(v);return Number.isFinite(n)&&n>=0?n:0}
  function totalFromForm(form){return FIELDS.reduce((sum,key)=>sum+num(form.elements[key]?.value),0)}

  function ensureModal(){
    if(modal)return modal;
    document.body.insertAdjacentHTML('beforeend',`
      <div class="history-entry-modal" id="historyEntryModal" hidden role="dialog" aria-modal="true" aria-labelledby="historyEntryTitle">
        <div class="history-entry-backdrop" data-history-close></div>
        <article class="history-entry-card">
          <div class="history-entry-head">
            <div><p class="micro">HISTORY CHECK-IN</p><h3 id="historyEntryTitle">补录学习记录</h3></div>
            <button class="history-entry-close" type="button" data-history-close aria-label="关闭">×</button>
          </div>
          <form id="historyEntryForm" class="history-entry-form">
            <label class="history-entry-date">日期
              <input name="date" type="date" required>
            </label>
            <div class="history-entry-hours">
              <label><span>397 法基</span><input name="base397" type="number" min="0" step="0.25" inputmode="decimal" placeholder="0"></label>
              <label><span>497 法综</span><input name="comp497" type="number" min="0" step="0.25" inputmode="decimal" placeholder="0"></label>
              <label><span>英语一</span><input name="english" type="number" min="0" step="0.25" inputmode="decimal" placeholder="0"></label>
              <label><span>政治</span><input name="politics" type="number" min="0" step="0.25" inputmode="decimal" placeholder="0"></label>
            </div>
            <div class="history-entry-total">当天总学习时长 <strong id="historyEntryTotal">0.0h</strong></div>
            <label>当天复盘<textarea name="review" rows="3" placeholder="真正吃透了什么？"></textarea></label>
            <div class="history-entry-two">
              <label>卡住你的地方<textarea name="blocker" rows="3" placeholder="知识、记忆、表达、时间或状态"></textarea></label>
              <label>第二天第一件事<textarea name="tomorrow" rows="3" placeholder="给第二天一个无需思考就能启动的动作"></textarea></label>
            </div>
            <p class="history-entry-note" id="historyEntryNote">选择日期后可以补录或修改当天记录。</p>
            <div class="history-entry-actions">
              <button class="btn ghost" type="button" data-history-close>取消</button>
              <button class="btn" type="submit">保存补录</button>
            </div>
          </form>
        </article>
      </div>`);
    modal=document.querySelector('#historyEntryModal');
    const form=modal.querySelector('#historyEntryForm');
    modal.querySelectorAll('[data-history-close]').forEach(el=>el.addEventListener('click',closeModal));
    form.elements.date.addEventListener('change',()=>fillDate(form.elements.date.value));
    FIELDS.forEach(key=>form.elements[key].addEventListener('input',()=>updateTotal()));
    form.addEventListener('submit',saveEntry);
    return modal;
  }

  function updateTotal(){
    const form=ensureModal().querySelector('#historyEntryForm');
    const el=modal.querySelector('#historyEntryTotal');
    if(el)el.textContent=`${totalFromForm(form).toFixed(1)}h`;
  }

  function fillDate(date){
    const form=ensureModal().querySelector('#historyEntryForm');
    const record=(db.checkins||{})[date]||{};
    FIELDS.forEach(key=>{form.elements[key].value=record[key]??''});
    form.elements.review.value=record.review??'';
    form.elements.blocker.value=record.blocker??'';
    form.elements.tomorrow.value=record.tomorrow??'';
    const note=modal.querySelector('#historyEntryNote');
    const exists=Object.prototype.hasOwnProperty.call(db.checkins||{},date);
    note.textContent=exists?'这一天已有记录。保存后会更新原记录，不会重复新增。':'这一天还没有记录，可以直接补录四科学习时长。';
    updateTotal();
  }

  function openModal(){
    const box=ensureModal();
    const form=box.querySelector('#historyEntryForm');
    form.elements.date.max=today();
    form.elements.date.value=yesterday();
    fillDate(form.elements.date.value);
    box.hidden=false;
    document.body.classList.add('history-entry-open');
    setTimeout(()=>form.elements.date.focus(),0);
  }

  function closeModal(){
    if(!modal)return;
    modal.hidden=true;
    document.body.classList.remove('history-entry-open');
  }

  function saveEntry(event){
    event.preventDefault();
    const form=event.currentTarget;
    const date=form.elements.date.value;
    if(!date){toast('请先选择补录日期');return}
    if(date>today()){toast('不能补录未来日期');return}

    const previous=(db.checkins||{})[date]||{};
    const record={
      ...previous,
      base397:num(form.elements.base397.value),
      comp497:num(form.elements.comp497.value),
      english:num(form.elements.english.value),
      politics:num(form.elements.politics.value),
      review:form.elements.review.value.trim(),
      blocker:form.elements.blocker.value.trim(),
      tomorrow:form.elements.tomorrow.value.trim()
    };
    db.checkins??={};
    db.checkins[date]=record;
    save();
    try{renderData();renderHero();if(date===today())renderToday()}catch{}
    window.dispatchEvent(new CustomEvent('jlu:state-changed',{detail:{source:'history-entry',date}}));
    toast(`已补录 ${date} · ${totalFromForm(form).toFixed(1)}h`);
    closeModal();
  }

  function bindButton(){
    const btn=document.querySelector('#historyBtn');
    if(!btn)return;
    /* app.js used an onclick handler for the old date-only prompt; replace it outright. */
    btn.onclick=null;
    if(btn.dataset.historyEntryBound)return;
    btn.dataset.historyEntryBound='1';
    btn.addEventListener('click',openModal);
  }

  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&modal&&!modal.hidden)closeModal();
  });

  bindButton();
})();
