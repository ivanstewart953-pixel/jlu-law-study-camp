/* Flexible daily route board. Campaign stages guide direction, not today's exact tasks. */
const ROUTE_DEFAULTS = [
  { time: '08:30–12:00', title: '上午主任务', tag: '自由安排' },
  { time: '14:00–17:30', title: '下午主任务', tag: '自由安排' },
  { time: '19:30–21:00', title: '晚间任务', tag: '自由安排' },
  { time: '21:00–22:00', title: '回顾 / 收尾', tag: '自由安排' }
];

let routeEditing = false;

function routeStore() {
  db.dailyRoutes ??= {};
  const key = today();
  if (!Array.isArray(db.dailyRoutes[key])) {
    db.dailyRoutes[key] = ROUTE_DEFAULTS.map((item, index) => ({
      id: `${key}-${index}-${Date.now()}`,
      ...item,
      done: Boolean(db.schedule?.[key]?.[index])
    }));
    save();
  }
  return db.dailyRoutes[key];
}

function syncLegacySchedule() {
  const key = today();
  db.schedule ??= {};
  db.schedule[key] = {};
  routeStore().forEach((item, index) => { db.schedule[key][index] = Boolean(item.done); });
}

function ensureRouteControls() {
  const schedule = $('#schedule');
  if (!schedule) return;
  const panel = schedule.closest('.panel');
  const head = panel?.querySelector('.panel-head');
  if (!head) return;

  const oldPill = head.querySelector('.pill');
  if (oldPill) oldPill.remove();

  if (!head.querySelector('.route-toolbar')) {
    const toolbar = document.createElement('div');
    toolbar.className = 'route-toolbar';
    toolbar.innerHTML = `
      <button class="btn ghost" id="routeEditBtn" type="button">编辑日程</button>
      <button class="btn ghost" id="routeAddBtn" type="button">＋ 加一条</button>
      <button class="btn ghost" id="routeResetBtn" type="button">恢复默认</button>`;
    head.appendChild(toolbar);
  }

  if (!panel.querySelector('.route-helper')) {
    const helper = document.createElement('div');
    helper.className = 'route-helper';
    helper.textContent = '这里只是你的今日工作台。阶段路线给方向，具体学什么、学多久、先后顺序都由你当天决定。';
    schedule.before(helper);
  }

  $('#routeEditBtn').onclick = () => {
    routeEditing = !routeEditing;
    $('#routeEditBtn').textContent = routeEditing ? '保存并退出' : '编辑日程';
    renderSchedule();
  };

  $('#routeAddBtn').onclick = () => {
    routeStore().push({
      id: `${today()}-${Date.now()}`,
      time: '自定时间',
      title: '新任务',
      tag: '自由安排',
      done: false
    });
    routeEditing = true;
    $('#routeEditBtn').textContent = '保存并退出';
    save();
    renderSchedule();
  };

  $('#routeResetBtn').onclick = () => {
    if (!confirm('把今天的日程恢复成四个默认时间块？今日完成状态也会重置。')) return;
    db.dailyRoutes[today()] = ROUTE_DEFAULTS.map((item, index) => ({
      id: `${today()}-${index}-${Date.now()}`,
      ...item,
      done: false
    }));
    syncLegacySchedule();
    save();
    renderSchedule();
    renderToday();
    toast('今日路线已恢复默认');
  };
}

function currentRouteIndex(routes) {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const parse = text => {
    const match = String(text).match(/(\d{1,2}):(\d{2})\s*[–—-]\s*(\d{1,2}):(\d{2})/);
    if (!match) return null;
    return [Number(match[1]) * 60 + Number(match[2]), Number(match[3]) * 60 + Number(match[4])];
  };
  return routes.findIndex(item => {
    const range = parse(item.time);
    return range && minutes >= range[0] && minutes < range[1];
  });
}

renderSchedule = function () {
  ensureRouteControls();
  const routes = routeStore();
  const current = currentRouteIndex(routes);

  if (!routes.length) {
    $('#schedule').innerHTML = '<div class="route-empty">今天还没有任务。点“加一条”随手写下你现在真正要做的事。</div>';
    return;
  }

  if (routeEditing) {
    $('#schedule').innerHTML = routes.map((item, index) => `
      <div class="schedule-item editing ${item.done ? 'done' : ''}">
        <input type="checkbox" data-route-check="${index}" ${item.done ? 'checked' : ''} aria-label="完成状态">
        <input class="route-field route-time" data-route-time="${index}" value="${safe(item.time)}" placeholder="时间">
        <input class="route-field title route-title" data-route-title="${index}" value="${safe(item.title)}" placeholder="任务内容">
        <input class="route-field route-tag" data-route-tag="${index}" value="${safe(item.tag || '')}" placeholder="标签">
        <button class="route-delete" data-route-delete="${index}" type="button" aria-label="删除任务">×</button>
      </div>`).join('');

    $$('[data-route-time]').forEach(el => el.oninput = () => { routes[Number(el.dataset.routeTime)].time = el.value; save(); });
    $$('[data-route-title]').forEach(el => el.oninput = () => { routes[Number(el.dataset.routeTitle)].title = el.value; save(); });
    $$('[data-route-tag]').forEach(el => el.oninput = () => { routes[Number(el.dataset.routeTag)].tag = el.value; save(); });
    $$('[data-route-check]').forEach(el => el.onchange = () => {
      routes[Number(el.dataset.routeCheck)].done = el.checked;
      syncLegacySchedule(); save(); renderToday(); renderHero();
    });
    $$('[data-route-delete]').forEach(el => el.onclick = () => {
      routes.splice(Number(el.dataset.routeDelete), 1);
      syncLegacySchedule(); save(); renderSchedule(); renderToday();
    });
    return;
  }

  $('#schedule').innerHTML = routes.map((item, index) => `
    <label class="schedule-item ${item.done ? 'done' : ''} ${index === current ? 'current' : ''}">
      <input type="checkbox" data-route-check="${index}" ${item.done ? 'checked' : ''}>
      <span class="schedule-time">${safe(item.time)}</span>
      <span><b>${safe(item.title)}</b><small class="muted" style="display:block;margin-top:2px">${safe(item.tag || '自由安排')}</small></span>
      <span class="quest-tag">${item.done ? '完成' : index === current ? '进行中' : '待办'}</span>
    </label>`).join('');

  $$('[data-route-check]').forEach(el => el.onchange = () => {
    const item = routes[Number(el.dataset.routeCheck)];
    item.done = el.checked;
    syncLegacySchedule();
    save();
    renderSchedule();
    renderToday();
    renderHero();
    toast(el.checked ? '这一项完成了' : '已恢复为待办');
  });
};

const previousRenderToday = renderToday;
renderToday = function () {
  previousRenderToday();
  const routes = routeStore();
  const completed = routes.filter(item => item.done).length;
  $('#questProgress').textContent = `${completed}/${routes.length}`;
};

ensureRouteControls();
renderSchedule();
renderToday();
