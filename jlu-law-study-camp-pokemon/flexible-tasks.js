/* Original fixed daily schedule from the first study-camp version. */
const ROUTE_PRESET_ID = 'initial-fixed-v1';
const ROUTE_DEFAULTS = [
  { preset: ROUTE_PRESET_ID, time: '08:30–12:00', title: '397 法律硕士专业基础', tag: '主线学习', kind: 'study', start: 510, end: 720 },
  { preset: ROUTE_PRESET_ID, time: '12:00–14:00', title: '午餐 / 午休 / 走动', tag: '休息恢复', kind: 'break', start: 720, end: 840 },
  { preset: ROUTE_PRESET_ID, time: '14:00–17:30', title: '497 法律硕士综合', tag: '主线学习', kind: 'study', start: 840, end: 1050 },
  { preset: ROUTE_PRESET_ID, time: '17:30–19:30', title: '晚餐 / 休息', tag: '恢复时段', kind: 'break', start: 1050, end: 1170 },
  { preset: ROUTE_PRESET_ID, time: '19:30–21:00', title: '英语一 / 思想政治理论', tag: '晚间训练', kind: 'study', start: 1170, end: 1260 },
  { preset: ROUTE_PRESET_ID, time: '21:00–22:00', title: '专业课复盘', tag: '回收当天知识', kind: 'study', start: 1260, end: 1320 },
  { preset: ROUTE_PRESET_ID, time: '睡前 20–30 分钟', title: '众合课程被动听课', tag: '轻量输入', kind: 'study', start: 1320, end: 1440 }
];

function oldDoneState(existing, legacy, studyIndex) {
  const oldIndexMap = [0, 1, 2, 3, 4];
  const oldIndex = oldIndexMap[studyIndex];
  if (existing?.[oldIndex] && typeof existing[oldIndex].done === 'boolean') return existing[oldIndex].done;
  if (legacy && Object.prototype.hasOwnProperty.call(legacy, oldIndex)) return Boolean(legacy[oldIndex]);
  return false;
}

function buildOriginalRoutes(existing = [], legacy = {}) {
  let studyIndex = 0;
  return ROUTE_DEFAULTS.map((item, index) => {
    const isStudy = item.kind === 'study';
    const done = isStudy ? oldDoneState(existing, legacy, studyIndex++) : false;
    return {
      id: `${today()}-${ROUTE_PRESET_ID}-${index}`,
      ...item,
      done
    };
  });
}

function routeStore() {
  db.dailyRoutes ??= {};
  const key = today();
  const existing = db.dailyRoutes[key];
  const isOriginal = Array.isArray(existing)
    && existing.length === ROUTE_DEFAULTS.length
    && existing.every((item, index) => item?.preset === ROUTE_PRESET_ID && item?.title === ROUTE_DEFAULTS[index].title);

  if (!isOriginal) {
    db.dailyRoutes[key] = buildOriginalRoutes(Array.isArray(existing) ? existing : [], db.schedule?.[key] || {});
    syncLegacySchedule(false);
    save();
  }
  return db.dailyRoutes[key];
}

function studyRoutes(routes = routeStore()) {
  return routes.filter(item => item.kind === 'study');
}

function syncLegacySchedule(ensure = true) {
  const key = today();
  db.schedule ??= {};
  db.schedule[key] = {};
  const routes = ensure ? routeStore() : db.dailyRoutes[key] || [];
  studyRoutes(routes).forEach((item, index) => {
    db.schedule[key][index] = Boolean(item.done);
  });
}

function ensureRouteControls() {
  const schedule = $('#schedule');
  if (!schedule) return;
  const panel = schedule.closest('.panel');
  const head = panel?.querySelector('.panel-head');
  if (!head) return;

  head.querySelector('.route-toolbar')?.remove();
  head.querySelector('.pill')?.remove();

  const toolbar = document.createElement('div');
  toolbar.className = 'route-toolbar';
  toolbar.innerHTML = '<button class="btn ghost" id="routeResetBtn" type="button">重置今日勾选</button>';
  head.appendChild(toolbar);

  panel.querySelector('.route-helper')?.remove();
  const helper = document.createElement('div');
  helper.className = 'route-helper';
  helper.textContent = '恢复初版作息：397 → 午间休息 → 497 → 晚间英语/政治 → 专业课复盘 → 睡前 20–30 分钟众合课程。临时调整不用改表，实际投入仍以当天打卡为准。';
  schedule.before(helper);

  $('#routeResetBtn').onclick = () => {
    if (!confirm('清空今天这张作息表的完成勾选？学习时长和复盘记录不会被删除。')) return;
    routeStore().forEach(item => { if (item.kind === 'study') item.done = false; });
    syncLegacySchedule();
    save();
    renderSchedule();
    renderToday();
    renderHero();
    try { toast('今日作息勾选已重置'); } catch {}
  };
}

function currentRouteIndex(routes) {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  return routes.findIndex(item => Number.isFinite(item.start) && Number.isFinite(item.end) && minutes >= item.start && minutes < item.end);
}

renderSchedule = function () {
  ensureRouteControls();
  const routes = routeStore();
  const current = currentRouteIndex(routes);

  $('#schedule').innerHTML = routes.map((item, index) => {
    const active = index === current ? 'current' : '';
    if (item.kind === 'break') {
      return `
        <div class="schedule-item route-break ${active}">
          <span class="route-rest-mark" aria-hidden="true">·</span>
          <span class="schedule-time">${safe(item.time)}</span>
          <span><b>${safe(item.title)}</b><small class="muted" style="display:block;margin-top:2px">${safe(item.tag)}</small></span>
          <span class="quest-tag">${index === current ? '休息中' : '休息'}</span>
        </div>`;
    }

    return `
      <label class="schedule-item ${item.done ? 'done' : ''} ${active}">
        <input type="checkbox" data-route-check="${index}" ${item.done ? 'checked' : ''}>
        <span class="schedule-time">${safe(item.time)}</span>
        <span><b>${safe(item.title)}</b><small class="muted" style="display:block;margin-top:2px">${safe(item.tag)}</small></span>
        <span class="quest-tag">${item.done ? '完成' : index === current ? '进行中' : '待办'}</span>
      </label>`;
  }).join('');

  $$('[data-route-check]').forEach(el => el.onchange = () => {
    const item = routes[Number(el.dataset.routeCheck)];
    if (!item || item.kind !== 'study') return;
    item.done = el.checked;
    syncLegacySchedule();
    save();
    renderSchedule();
    renderToday();
    renderHero();
    window.dispatchEvent(new CustomEvent('jlu:state-changed'));
    try { toast(el.checked ? '这一项完成了' : '已恢复为待办'); } catch {}
  });
};

const previousRenderToday = renderToday;
renderToday = function () {
  previousRenderToday();
  const routes = studyRoutes(routeStore());
  const completed = routes.filter(item => item.done).length;
  $('#questProgress').textContent = `${completed}/${routes.length}`;
};

ensureRouteControls();
renderSchedule();
renderToday();
