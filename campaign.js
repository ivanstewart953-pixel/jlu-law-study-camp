const campaignStages = [
  {
    lv: 'LV.01',
    title: '收尾与背诵启动',
    start: '2026-08-12',
    end: '2026-08-31',
    range: '08-12 至 08-31',
    goal: '完成刑法、民法、宪法学、法制史剩余精读与配套题；已完成内容立即开始短时闭卷回忆，不等待五科全部结束'
  },
  {
    lv: 'LV.02',
    title: '框架与首轮背诵',
    start: '2026-09-01',
    end: '2026-09-30',
    range: '09-01 至 09-30',
    goal: '完成五科首轮背诵，建立可闭卷复述的章级框架'
  },
  {
    lv: 'LV.03',
    title: '强化输出',
    start: '2026-10-01',
    end: '2026-10-25',
    range: '10-01 至 10-25',
    goal: '第二轮背诵、专题辨析、简答案例输出；重点修复民法规则适用'
  },
  {
    lv: 'LV.04',
    title: '真题整卷',
    start: '2026-10-26',
    end: '2026-11-15',
    range: '10-26 至 11-15',
    goal: '397 / 497 整卷与错因分类并行'
  },
  {
    lv: 'LV.05',
    title: '模考提分',
    start: '2026-11-16',
    end: '2026-12-06',
    range: '11-16 至 12-06',
    goal: '每周两次专业课限时模考，滚动修复高频错点'
  },
  {
    lv: 'LV.06',
    title: '最终冲刺',
    start: '2026-12-07',
    end: '2026-12-19',
    range: '12-07 至考试',
    goal: '高频主观题、错题、政治英语定稿与调用速度训练'
  }
];

function campaignDaysInclusive(from, to) {
  const a = new Date(`${from}T00:00:00`);
  const b = new Date(`${to}T00:00:00`);
  return Math.max(0, Math.floor((b - a) / 86400000) + 1);
}

function stageIndex() {
  const d = today();
  const found = campaignStages.findIndex(stage => d >= stage.start && d <= stage.end);
  if (found >= 0) return found + 1;
  if (d < campaignStages[0].start) return 1;
  return campaignStages.length + 1;
}

function renderStages() {
  const current = stageIndex();
  const currentDate = today();

  $('#stages').innerHTML = campaignStages.map((stage, index) => {
    const position = index + 1;
    const isDone = position < current;
    const isNow = position === current;
    const remaining = isNow ? campaignDaysInclusive(currentDate, stage.end) : 0;
    const status = isDone
      ? '已通过'
      : isNow
        ? `当前 · 剩余 ${remaining} 天`
        : '未解锁';

    return `
      <div class="stage ${isDone ? 'done' : ''} ${isNow ? 'now' : ''}">
        <span class="stage-dot">${String(position).padStart(2, '0')}</span>
        <span>
          <b>${stage.lv} · ${stage.title}</b>
          <small>
            <span style="display:inline-block;margin:3px 0 4px;font-weight:800;color:#557582">${stage.range}</span><br>
            ${stage.goal}
          </small>
        </span>
        <span class="mini-score">${status}</span>
      </div>`;
  }).join('');

  if (current <= campaignStages.length) {
    const stage = campaignStages[current - 1];
    const remaining = campaignDaysInclusive(currentDate, stage.end);
    $('#stageNow').textContent = `${stage.lv} · ${stage.title} · ${remaining}天`;
  } else {
    $('#stageNow').textContent = '六阶段路线完成';
  }
}

function loadEnhancements() {
  if (!document.querySelector('link[data-jlu-polish]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './polish.css';
    link.dataset.jluPolish = 'true';
    document.head.appendChild(link);
  }

  if (!document.querySelector('script[data-jlu-flexible-routes]')) {
    const script = document.createElement('script');
    script.src = './flexible-tasks.js';
    script.defer = true;
    script.dataset.jluFlexibleRoutes = 'true';
    document.body.appendChild(script);
  }
}

renderStages();
loadEnhancements();
