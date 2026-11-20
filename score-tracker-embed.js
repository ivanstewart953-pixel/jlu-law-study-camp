/* JLU LAW CAMP: native score / loss-budget module. No iframe, dependencies or edits to existing JS. */
(() => {
  'use strict';
  const ROOT_ID = 'jlu-fashuo-score-overlay';
  const ROUTE = '#score-tracker';
  const NAV_TEXT = '失分控制室';
  const HTML = "<style>\n:host{--bg:#0b1020;--bg2:#0e1728;--card:#151d2e;--card2:#1a2538;--ink:#eff6ff;--muted:#96a8bf;--line:#2b394d;--line2:#34475d;--mint:#69dfc2;--blue:#8db6ff;--orange:#ffc58e;--purple:#c6b3ff;--danger:#ff9e9f;--shadow:0 12px 45px rgba(0,0,0,.18);--input:#0e1727;--track:#26364a;--pattern:rgba(141,182,255,.08)}\n:host(.light){--bg:#f5f8fc;--bg2:#eaf0f9;--card:#ffffff;--card2:#f2f6fc;--ink:#17243a;--muted:#53677f;--line:#d8e2ed;--line2:#bdcadb;--mint:#147e68;--blue:#376cbb;--orange:#af641d;--purple:#7660ba;--danger:#c43f50;--shadow:0 12px 30px rgba(42,67,95,.06);--input:#f8fbff;--track:#e2eaf4;--pattern:rgba(55,108,187,.055)}\n*{box-sizing:border-box}:host{scroll-behavior:smooth}.tracker-root{margin:0;min-width:320px;background:radial-gradient(ellipse 60% 32% at 94% -4%,rgba(36,113,113,.13),transparent 90%),radial-gradient(ellipse 45% 25% at 2% 8%,rgba(74,100,165,.10),transparent 90%),var(--bg);color:var(--ink);font:14px/1.6 -apple-system,BlinkMacSystemFont,\"Segoe UI\",\"PingFang SC\",\"Microsoft YaHei\",sans-serif;font-variant-numeric:tabular-nums}button,input,textarea,select{font:inherit}button{cursor:pointer}button:disabled{cursor:not-allowed;opacity:.45}a{color:inherit}.shell{max-width:1360px;padding:0 28px 68px;margin:auto}.masthead{padding:32px 0 28px;display:flex;gap:24px;align-items:flex-start;justify-content:space-between}.eyebrow{font-size:11px;letter-spacing:.19em;text-transform:uppercase;color:var(--mint);font-weight:800}.brandline{display:flex;align-items:center;gap:12px;margin-bottom:14px}.logo{width:33px;height:33px;border:1px solid rgba(105,223,194,.45);background:rgba(105,223,194,.13);border-radius:11px;display:grid;place-items:center;color:var(--mint);font-size:23px;font-weight:700}.brandline b{letter-spacing:.03em;font-size:13px}.masthead h1{margin:0;font-size:clamp(28px,3.25vw,43px);font-weight:800;letter-spacing:-.045em;line-height:1.18}.masthead h1 i{font-style:normal;color:var(--mint)}.masthead p{color:var(--muted);font-size:13px;margin:12px 0 0}.top-actions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:9px;padding-top:8px}.btn{min-height:37px;border:1px solid var(--line2);border-radius:10px;color:var(--ink);background:var(--card);padding:8px 14px;font-size:12px;font-weight:700;transition:background .15s,border-color .15s,transform .15s}.btn:hover{border-color:var(--mint);background:var(--card2)}.btn:active{transform:translateY(1px)}.btn.primary{background:var(--mint);color:var(--bg);border-color:var(--mint)}:host(.light) .btn.primary{color:#fff}.btn.primary:hover{filter:brightness(1.07)}.btn.ghost{background:transparent}.btn.danger:hover{border-color:var(--danger);color:var(--danger)}.btn.small{min-height:31px;padding:5px 10px;font-size:11px}.section-title{display:flex;align-items:center;justify-content:space-between;gap:16px;margin:28px 0 13px}.section-title h2{margin:0;font-size:16px;letter-spacing:-.02em}.section-title .hint{font-size:12px;color:var(--muted)}.card{border:1px solid var(--line);border-radius:17px;background:var(--card);box-shadow:var(--shadow)}.summary-banner{display:grid;grid-template-columns:1.28fr 1fr 1fr;gap:12px}.kpi{padding:24px 26px;min-height:160px;position:relative;overflow:hidden}.kpi.hero{background:linear-gradient(124deg,var(--card),var(--card2))}.kpi.hero:after{content:\"\";position:absolute;right:-65px;top:-75px;width:250px;height:250px;border:1px solid rgba(105,223,194,.20);border-radius:50%;box-shadow:0 0 0 35px rgba(105,223,194,.025),0 0 0 75px rgba(105,223,194,.018);pointer-events:none}.kpi .tiny{color:var(--muted);font-size:11px;font-weight:700;letter-spacing:.07em}.big-number{font-size:43px;line-height:1.1;font-weight:800;letter-spacing:-.055em;margin:11px 0 4px}.big-number .unit{font-size:17px;font-weight:550;color:var(--muted);letter-spacing:0}.kpi .desc{font-size:12px;color:var(--muted);margin:8px 0 0}.kpi .desc strong{color:var(--ink)}.goal-buttons{display:inline-flex;border:1px solid var(--line2);border-radius:10px;padding:3px;gap:4px;margin-top:6px;position:relative;z-index:1}.goal-buttons button,.switch button,.filter button{border:0;color:var(--muted);background:transparent;font-size:12px;font-weight:750;padding:6px 11px;border-radius:7px}.goal-buttons button.active,.switch button.active,.filter button.active{color:var(--ink);background:var(--card2);box-shadow:0 1px 3px rgba(0,0,0,.10)}.metric-track{margin-top:18px;height:7px;border-radius:20px;background:var(--track);overflow:hidden}.metric-track span{height:100%;background:var(--mint);display:block;border-radius:20px;transition:width .3s}.subj-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.subject-card{padding:18px 19px;position:relative;overflow:hidden}.subject-card:before{content:\"\";display:block;position:absolute;top:0;left:18px;right:18px;height:2px;background:var(--subjectColor)}.subject-head{display:flex;justify-content:space-between;gap:8px;align-items:center}.subject-name{font-size:13px;font-weight:750}.subject-max{font-size:11px;color:var(--muted)}.subject-score{margin:20px 0 11px;line-height:1.15;font-weight:800;font-size:28px}.subject-score small{color:var(--muted);font-size:13px;font-weight:500}.subject-target{display:flex;align-items:center;justify-content:space-between;color:var(--muted);font-size:12px;gap:8px}.subject-target input{width:64px;max-width:100%;text-align:right;border:1px solid var(--line);border-radius:7px;color:var(--ink);background:var(--input);padding:4px 7px;outline:0;font-size:13px;font-weight:750}.subject-target input:focus,.control input:focus,.control select:focus,.control textarea:focus{border-color:var(--mint);box-shadow:0 0 0 3px rgba(105,223,194,.09)}.subject-bottom{padding-top:12px;display:flex;gap:8px;justify-content:space-between;flex-wrap:wrap;font-size:11px;color:var(--muted)}.subject-progress{margin-top:13px;height:5px;background:var(--track);border-radius:12px;overflow:hidden}.subject-progress span{display:block;height:100%;background:var(--subjectColor);border-radius:12px}.positive{color:var(--mint)!important}.negative{color:var(--danger)!important}.neutral{color:var(--muted)!important}.layout-two{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(305px,.95fr);gap:14px;align-items:start}.form-card{padding:24px}.calc-card{padding:24px;position:sticky;top:18px}.inner-heading{font-size:13px;letter-spacing:.02em;font-weight:800;margin:0 0 14px;display:flex;justify-content:space-between;align-items:center}.switch,.filter{display:flex;flex-wrap:wrap;gap:5px;background:var(--bg2);border:1px solid var(--line);padding:4px;border-radius:11px}.switch button.active,.filter button.active{background:var(--card)}.switch{margin-bottom:22px}.switch button{flex:1;min-width:60px;padding:10px 8px}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:13px}.control{display:flex;flex-direction:column;gap:6px;min-width:0}.control label{font-size:11px;color:var(--muted);font-weight:750;letter-spacing:.02em}.control input,.control select,.control textarea{background:var(--input);color:var(--ink);border:1px solid var(--line2);border-radius:9px;padding:10px 12px;min-height:42px;width:100%;outline:none;transition:border-color .15s}.control input::placeholder,.control textarea::placeholder{color:var(--muted);opacity:.65}.control textarea{min-height:68px;resize:vertical}.control .subtext{font-size:10px;color:var(--muted)}.form-separator{height:1px;background:var(--line);margin:22px 0}.field-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.score-field{border:1px solid var(--line);border-radius:12px;padding:13px;background:var(--input);min-width:0}.score-field .field-top{display:flex;justify-content:space-between;align-items:center;gap:6px;margin-bottom:9px}.score-field label{font-size:12px;font-weight:700}.score-field .cap{font-size:10px;color:var(--muted);white-space:nowrap}.score-field input{width:100%;background:var(--card);border:1px solid var(--line2);border-radius:8px;padding:9px 11px;color:var(--ink);font-size:19px;font-weight:750;outline:none}.score-field input:focus{border-color:var(--mint)}.score-field .field-help{font-size:10px;color:var(--muted);margin-top:7px;min-height:14px}.mini-toggle{display:flex;align-items:center;gap:9px;font-size:12px;color:var(--muted);user-select:none;cursor:pointer}.mini-toggle input{accent-color:var(--mint);width:16px;height:16px}.form-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:20px}.form-actions .btn{min-height:43px}.form-note{font-size:11px;color:var(--muted);margin-top:10px}.divider{height:1px;background:var(--line);margin:18px 0}.calc-line{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 0;font-size:12px}.calc-line span{color:var(--muted)}.calc-line b{font-size:15px}.calc-total{margin:8px 0 10px;border:1px solid var(--line);background:var(--card2);border-radius:13px;padding:18px}.calc-total .caption{font-size:11px;color:var(--muted);font-weight:700}.calc-total .num{font-size:46px;letter-spacing:-.05em;line-height:1.18;font-weight:850;margin:8px 0 3px}.calc-total .num small{font-size:16px;color:var(--muted);font-weight:500}.calc-total .status{color:var(--muted);font-size:12px}.calc-total .status.good{color:var(--mint)}.tip{font-size:12px;color:var(--muted);line-height:1.8}.tip strong{color:var(--ink)}.target-break{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:14px 0}.target-break>div{border:1px solid var(--line);padding:12px 13px;border-radius:11px}.target-break span{font-size:10px;color:var(--muted)}.target-break strong{display:block;font-size:21px;margin-top:2px}.two-panel{display:grid;grid-template-columns:1.05fr .95fr;gap:14px}.history-panel,.chart-panel{padding:21px;min-height:307px}.chart-filters{display:flex;flex-wrap:wrap;gap:6px;margin:2px 0 15px}.chart-filters button{background:transparent;border:1px solid var(--line);border-radius:6px;color:var(--muted);font-size:11px;padding:5px 9px}.chart-filters button.selected{background:var(--card2);border-color:var(--mint);color:var(--ink)}.chart-wrap{width:100%;min-height:180px}.chart-wrap svg{width:100%;height:auto;display:block}.chart-legend{font-size:11px;color:var(--muted);margin-top:10px}.chart-legend span{display:inline-block;width:15px;border-top:2px dashed var(--orange);vertical-align:middle;margin-right:6px}.history-toolbar{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin:8px 0 14px}.history-toolbar .filter button{padding:6px 9px;font-size:11px}.history-scroll{overflow:auto;max-height:400px;scrollbar-width:thin}.record{padding:13px 2px;border-top:1px solid var(--line);display:grid;grid-template-columns:1fr auto;gap:10px}.record:first-child{border-top:0}.record-title{font-weight:750;font-size:12px;margin-bottom:2px;overflow-wrap:anywhere}.record-meta{font-size:11px;color:var(--muted)}.record-score{font-size:22px;font-weight:800;line-height:1.1;text-align:right}.record-score small{font-size:11px;color:var(--muted);font-weight:500}.record-actions{display:flex;justify-content:flex-end;gap:6px;margin-top:6px}.textbtn{font-size:11px;border:0;color:var(--muted);background:transparent;padding:2px 4px}.textbtn:hover{color:var(--mint)}.textbtn.red:hover{color:var(--danger)}.empty{display:grid;place-items:center;text-align:center;min-height:190px;color:var(--muted);padding:20px}.empty svg{opacity:.6;margin-bottom:12px}.empty strong{color:var(--ink);font-size:13px}.empty p{font-size:12px;line-height:1.7;max-width:250px;margin:6px auto 0}.footer{margin-top:22px;padding:17px 20px;display:flex;gap:12px;flex-wrap:wrap;align-items:center;justify-content:space-between;border:1px solid var(--line);border-radius:13px;background:var(--card)}.footer .footcopy{color:var(--muted);font-size:11px;max-width:600px}.footcopy strong{color:var(--ink)}.footer-actions{display:flex;flex-wrap:wrap;gap:7px}.toast{position:fixed;bottom:28px;left:50%;transform:translate(-50%,22px);background:var(--ink);color:var(--bg);padding:12px 20px;border-radius:10px;box-shadow:0 12px 36px rgba(0,0,0,.25);font-weight:750;z-index:10;opacity:0;pointer-events:none;transition:opacity .25s,transform .25s;max-width:calc(100vw - 32px);text-align:center}.toast.show{opacity:1;transform:translate(-50%,0)}.badge{font-size:10px;font-weight:700;padding:3px 8px;border-radius:50px;background:rgba(141,182,255,.12);color:var(--blue)}.label-row{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:13px}.label-row h3{font-size:14px;margin:0}.indicator{display:inline-flex;align-items:center;gap:7px;font-size:10px;color:var(--muted)}.indicator:before{content:\"\";display:inline-block;width:7px;height:7px;background:var(--mint);border-radius:50%}.indicator.off:before{background:var(--danger)}.instruction{font-size:11px;color:var(--muted);line-height:1.7}.instruction code{color:var(--ink);background:var(--card2);padding:2px 5px;border-radius:3px}\n@media(max-width:1000px){.summary-banner{grid-template-columns:repeat(3,minmax(0,1fr))}.subj-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.layout-two{grid-template-columns:1fr}.calc-card{position:static}.two-panel{grid-template-columns:1fr 1fr}.kpi{padding:20px}.big-number{font-size:36px}}@media(max-width:700px){.shell{padding:0 14px 40px}.masthead{padding:23px 0 20px;flex-direction:column;gap:8px}.masthead h1{font-size:29px}.masthead p{margin-top:9px}.top-actions{justify-content:flex-start;padding:0}.summary-banner,.two-panel{grid-template-columns:1fr}.kpi{min-height:135px}.summary-banner{gap:9px}.subj-grid{gap:9px}.subject-card{padding:15px}.subject-score{font-size:24px;margin:14px 0 10px}.subject-bottom{font-size:10px}.form-card,.calc-card,.history-panel,.chart-panel{padding:17px}.field-grid{grid-template-columns:1fr 1fr}.section-title{margin-top:25px}.section-title .hint{font-size:11px}.footer{padding:16px}.footer-actions{width:100%}.footer-actions .btn{flex:1}.form-actions .btn.primary{flex:1}}@media(max-width:400px){.field-grid{grid-template-columns:1fr}.form-grid{grid-template-columns:1fr}.switch{gap:2px}.switch button{font-size:11px}.subject-target{gap:4px}.subject-target input{width:54px}.subj-grid{grid-template-columns:1fr 1fr}.subject-card{padding:13px 12px}.subject-score{font-size:22px}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition:none!important}}@media print{.tracker-root{background:#fff;color:#111}.shell{max-width:100%}.top-actions,.form-actions,.footer-actions,.history-toolbar button,.record-actions{display:none!important}.card{box-shadow:none}.layout-two,.two-panel{grid-template-columns:1fr 1fr}}\n\n/* Per-section loss ranges and editable allocation */\n.loss-explainer{border:1px solid var(--line);background:var(--card2);padding:12px 16px;border-radius:12px;font-size:12px;color:var(--muted);margin-bottom:13px;line-height:1.8}\n.loss-explainer strong{color:var(--ink)}\n.loss-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;align-items:stretch}\n.loss-card{padding:19px 20px 17px;min-width:0;position:relative;overflow:hidden}\n.loss-card:before{content:\"\";position:absolute;top:0;left:20px;right:20px;height:2px;background:var(--subjectColor)}\n.loss-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px}\n.loss-card-name{font-weight:800;font-size:16px;letter-spacing:-.02em}\n.loss-card-caption{font-size:11px;color:var(--muted);margin-top:2px}\n.loss-card-score{text-align:right;white-space:nowrap;font-size:11px;color:var(--muted)}\n.loss-card-score strong{display:block;font-size:19px;color:var(--ink);line-height:1.35}\n.loss-card-score b{color:var(--subjectColor)}\n.loss-card-bar{height:6px;background:var(--track);border-radius:8px;overflow:hidden;margin:11px 0 7px}\n.loss-card-bar span{display:block;height:100%;background:var(--subjectColor);border-radius:8px;transition:width .2s}\n.loss-card-balance{font-size:11px;color:var(--muted);margin-bottom:14px;display:flex;gap:8px;justify-content:space-between;flex-wrap:wrap}\n.loss-card-balance strong{color:var(--ink)}\n.loss-card-balance .over{color:var(--danger)}\n.loss-card-balance .under{color:var(--orange)}\n.loss-items{display:flex;flex-direction:column;gap:7px}\n.loss-item{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(118px,.86fr) minmax(99px,.73fr);align-items:center;gap:8px;background:var(--input);border:1px solid var(--line);border-radius:11px;padding:11px 12px;min-height:70px}\n.loss-type{min-width:0;font-weight:750;font-size:12px}\n.loss-type small{font-weight:450;font-size:10px;color:var(--muted);display:block;margin-top:3px;line-height:1.45}\n.loss-budget-label{font-size:10px;color:var(--muted);margin-bottom:3px}\n.loss-range{display:flex;align-items:center;gap:5px;font-size:12px;font-weight:700}\n.loss-range input{min-width:0;width:52px;max-width:60px;height:31px;padding:4px 5px;border-radius:7px;background:var(--card);color:var(--ink);border:1px solid var(--line2);text-align:center;font-size:14px;font-weight:800;outline:0}\n.loss-range input:focus{border-color:var(--mint);box-shadow:0 0 0 3px rgba(105,223,194,.1)}\n.loss-actual{text-align:right;min-width:0}\n.loss-actual .actual-score{font-size:14px;font-weight:800;white-space:nowrap}\n.loss-actual .actual-meta{font-size:10px;color:var(--muted);line-height:1.5;min-height:15px}\n.loss-actual .actual-score.ok{color:var(--mint)}\n.loss-actual .actual-score.watch{color:var(--orange)}\n.loss-actual .actual-score.bad{color:var(--danger)}\n.loss-card-actions{margin-top:13px;display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}\n.loss-card-actions .action-note{font-size:10px;color:var(--muted);flex:1;min-width:130px}\n.loss-buttons{display:flex;align-items:center;gap:7px;flex-wrap:wrap}\n.loss-legend{margin-top:11px;display:flex;align-items:center;gap:13px;flex-wrap:wrap;font-size:10px;color:var(--muted)}\n.loss-legend i{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:5px}\n.preview-loss-list{display:flex;flex-direction:column;gap:6px}\n.preview-loss-item{display:flex;align-items:center;justify-content:space-between;gap:9px;font-size:11px;border-bottom:1px solid var(--line);padding-bottom:5px}\n.preview-loss-item:last-child{border:0}\n.preview-loss-item span{color:var(--muted)}\n.preview-loss-item b{white-space:nowrap}\n.preview-loss-item b.ok{color:var(--mint)}\n.preview-loss-item b.watch{color:var(--orange)}\n.preview-loss-item b.bad{color:var(--danger)}\n.preview-loss-note{color:var(--muted);font-size:10px;margin-top:9px}\n@media(max-width:1000px){.loss-grid{grid-template-columns:1fr}}\n@media(max-width:570px){.loss-card{padding:15px 13px}.loss-item{grid-template-columns:minmax(0,1.08fr) minmax(94px,.9fr) minmax(72px,.65fr);padding:9px 8px;gap:5px}.loss-type{font-size:11px}.loss-type small,.loss-card-balance,.loss-actual .actual-meta{font-size:10px}.loss-card-name{font-size:14px}.loss-range input{width:44px;height:30px}.loss-actual .actual-score{font-size:12px}}\n\n:host { display:block; width:100%; color-scheme:dark; }\n:host(.light) { color-scheme:light; }\n.tracker-root { min-height:100%; }\n</style>\n<div class=\"tracker-root\">\n<div class=\"shell\">\n  <header class=\"masthead\">\n    <div>\n      <div class=\"brandline\"><div class=\"logo\" aria-hidden=\"true\">↗</div><div><div class=\"eyebrow\">The final stretch · 2027</div><b>法硕（非法学） · 四科成绩记录</b></div></div>\n      <h1>把 <i id=\"headlineGoal\">380</i> 分，拆成每一分。</h1>\n      <p>实时测算失分预算、保存历次模拟成绩。做过的卷子，不再只剩一个模糊的印象。</p>\n    </div>\n    <div class=\"top-actions\"><button class=\"btn ghost\" id=\"exampleBtn\">↪ 载入肖八第1套</button><button class=\"btn ghost\" id=\"themeBtn\">☼ 切换外观</button><button class=\"btn\" id=\"topExportBtn\">↓ 导出备份</button></div>\n  </header>\n\n  <div class=\"summary-banner\" aria-label=\"总分概览\">\n    <div class=\"card kpi hero\">\n      <div class=\"tiny\">总分目标 · 满分 500</div>\n      <div class=\"big-number\" id=\"goalNumber\">380 <span class=\"unit\">/ 500</span></div>\n      <div class=\"goal-buttons\" aria-label=\"切换目标方案\"><button data-plan=\"380\" class=\"active\">380 方案</button><button data-plan=\"390\">390 方案</button><button data-plan=\"custom\">自定义</button></div>\n      <div class=\"desc\">四科目标可在下方卡片中单独调整</div>\n    </div>\n    <div class=\"card kpi\">\n      <div class=\"tiny\">四科最近一次完整成绩</div>\n      <div class=\"big-number\" id=\"currentTotal\">— <span class=\"unit\">/ 500</span></div>\n      <div class=\"desc\" id=\"filledDesc\">尚无完整模拟记录</div>\n      <div class=\"metric-track\"><span id=\"goalTrack\" style=\"width:0\"></span></div>\n    </div>\n    <div class=\"card kpi\">\n      <div class=\"tiny\">允许总失分 / 目标缺口</div>\n      <div class=\"big-number\" id=\"lossBudget\">120 <span class=\"unit\">分可失</span></div>\n      <div class=\"desc\" id=\"gapDesc\">四科满分 500 − 目标分数 380</div>\n    </div>\n  </div>\n\n  <div class=\"section-title\"><h2>01 / 四科失分账本</h2><span class=\"hint\">可直接修改每科目标分数</span></div>\n  <section class=\"subj-grid\" id=\"subjectSummary\" aria-label=\"各科最新分数与目标\"></section>\n\n\n  <div class=\"section-title\"><h2>02 / 各题型失分区间</h2><span class=\"hint\">四科同时展示 · 可编辑失分上限</span></div>\n  <div class=\"loss-explainer\"><strong>怎么读这张表：</strong>「0～上限」是该题型建议控制的失分范围，旁边的「实失」会对照当前输入或最近一次整卷。<strong>各项上限的合计</strong>应等于这科允许失分总额。预算只是分配方案，不是阅卷标准；个别题型超出预算，不代表整卷必然未达标。</div>\n  <section id=\"lossGrid\" class=\"loss-grid\" aria-label=\"四科各题型允许失分预算\"></section>\n\n  <div class=\"section-title\"><h2>03 / 录入一套试卷</h2><span class=\"hint\">输入后即时计算，点击保存才计入历史成绩</span></div>\n  <div class=\"layout-two\">\n    <section class=\"card form-card\" aria-label=\"录入成绩\">\n      <div class=\"switch\" id=\"subjectTabs\" role=\"tablist\" aria-label=\"选择科目\"></div>\n      <div class=\"form-grid\">\n        <div class=\"control\"><label for=\"paperDate\">练习日期</label><input type=\"date\" id=\"paperDate\" required></div>\n        <div class=\"control\"><label for=\"paperMode\">记录范围</label><select id=\"paperMode\"><option value=\"full\">整卷（计入四科统计）</option><option value=\"objective\">仅客观题（单独记录）</option></select></div>\n        <div class=\"control\" style=\"grid-column:1/-1\"><label for=\"paperTitle\">试卷名称</label><input id=\"paperTitle\" maxlength=\"100\" placeholder=\"如：2024年法基真题 / 肖八第1套\"></div>\n      </div>\n      <div class=\"form-separator\"></div>\n      <div class=\"label-row\"><h3 id=\"scoreFormLabel\">政治 · 分项得分</h3><span class=\"badge\" id=\"maxLabel\">满分 100</span></div>\n      <div class=\"field-grid\" id=\"scoreInputs\"></div>\n      <div class=\"form-separator\"></div>\n      <div class=\"control\"><label for=\"paperNote\">复盘备注（选填）</label><textarea id=\"paperNote\" maxlength=\"1000\" placeholder=\"错因、薄弱点、待二刷的题号……\"></textarea></div>\n      <div style=\"margin-top:14px\"><label class=\"mini-toggle\"><input type=\"checkbox\" id=\"estimateCheck\" checked><span>包含主观题估分（与实际阅卷可能有偏差）</span></label></div>\n      <div class=\"form-actions\"><button class=\"btn primary\" id=\"saveBtn\">＋ 保存成绩</button><button class=\"btn\" id=\"resetBtn\">清空当前输入</button><button class=\"btn ghost\" id=\"cancelEditBtn\" style=\"display:none\">取消修改</button></div>\n      <p class=\"form-note\" id=\"saveHint\">仅保存完整填写的分项；0分也请明确填“0”。</p>\n    </section>\n    <aside class=\"card calc-card\" aria-label=\"实时测算\">\n      <div class=\"label-row\"><h3>实时失分测算</h3><span class=\"indicator\" id=\"previewIndicator\">待录入</span></div>\n      <div class=\"calc-line\"><span>客观题</span><b id=\"previewObjective\">— / 50</b></div>\n      <div class=\"calc-line\" id=\"subjectiveLine\"><span>主观题</span><b id=\"previewSubjective\">— / 50</b></div>\n      <div class=\"calc-total\"><div class=\"caption\">当前试卷测算成绩</div><div class=\"num\" id=\"previewTotal\">— <small>/ 100</small></div><div class=\"status\" id=\"previewStatus\">填写分项后显示实时结果</div></div>\n      <div class=\"target-break\"><div><span>本卷已失分</span><strong id=\"previewLost\">—</strong></div><div><span>该科可失分预算</span><strong id=\"previewAllowed\">27</strong></div></div>\n      <div class=\"divider\"></div>\n      <div class=\"tip\" id=\"previewAdvice\">政治目标 <strong>73/100</strong>。多选每错1道失2分；主观题请按实际写出的采分点谨慎估分。</div>\n      <div class=\"divider\"></div>\n      <div class=\"inner-heading\">逐题型对照 <span class=\"badge\">实失 / 预算</span></div>\n      <div id=\"previewLossRows\" class=\"preview-loss-list\"></div>\n      <div class=\"preview-loss-note\">绿色：理想范围；黄色：在预算内；红色：超出该题型预算。只对已填写的分项计算实失。</div>\n      <div class=\"divider\"></div>\n      <div class=\"instruction\">说明：<strong>仅客观题</strong>的练习单独记录，不会被当成整卷成绩加入四科总分。不同年份、不同卷子的分数不代表同一天的预测总分。</div>\n    </aside>\n  </div>\n\n  <div class=\"section-title\"><h2>04 / 成绩趋势与历史</h2><span class=\"hint\" id=\"historyCount\">0 条记录</span></div>\n  <div class=\"two-panel\">\n    <section class=\"card chart-panel\" aria-label=\"成绩趋势图\"><div class=\"inner-heading\">历次整卷成绩趋势 <span class=\"badge\">只含整卷</span></div><div class=\"chart-filters\" id=\"chartFilters\"></div><div class=\"chart-wrap\" id=\"chartWrap\"></div><div class=\"chart-legend\"><span></span> 虚线为该科目标；实线为历次整卷成绩</div></section>\n    <section class=\"card history-panel\" aria-label=\"历史记录\"><div class=\"inner-heading\">成绩档案 <span class=\"badge\" id=\"recordCountBadge\">0 条</span></div><div class=\"history-toolbar\"><div class=\"filter\" id=\"historyFilters\"></div></div><div id=\"historyList\" class=\"history-scroll\"></div></section>\n  </div>\n\n  <div class=\"footer\">\n    <div class=\"footcopy\"><div><strong id=\"storageTitle\">本地自动保存</strong> · <span id=\"storageStatus\">成绩只保存在当前浏览器中，不上传服务器。</span></div><div style=\"margin-top:5px\">建议定期导出 JSON 备份。换设备、换浏览器、移动 HTML 文件位置或清理网站数据时，原有记录可能无法保留。</div></div>\n    <div class=\"footer-actions\"><button class=\"btn small\" id=\"exportJsonBtn\">导出 JSON</button><button class=\"btn small\" id=\"exportCsvBtn\">导出 CSV</button><button class=\"btn small\" id=\"importBtn\">导入备份</button><button class=\"btn small danger\" id=\"wipeBtn\">清空记录</button><input type=\"file\" id=\"importInput\" accept=\".json,application/json\" hidden></div>\n  </div>\n</div>\n<div class=\"toast\" id=\"toast\" role=\"status\" aria-live=\"polite\"></div>\n</div>";
  let overlay = null;
  let shadow = null;
  let oldOverflow = '';
  let shouldReturn = false;

  function initTrackerModule(root, host) {
    // The score tracker is an existing working standalone application.
    // Route only its selectors and theme toggles into the closed-off ShadowRoot.
    // Deliberately keep its data under the independent localStorage key.
    const document = {
      getElementById: id => root.getElementById(id),
      querySelector: selector => root.querySelector(selector),
      querySelectorAll: selector => root.querySelectorAll(selector),
      documentElement: host,
      createElement: tag => window.document.createElement(tag),
      body: window.document.body
    };
    
(() => {
'use strict';
const KEY = 'fashuo-score-tracker-2027-v1';
const $ = (id) => document.getElementById(id);
const SUBJECTS = {
 politics: {name:'政治',short:'政治',max:100,objectiveMax:50,color:'#69dfc2',fields:[
  {key:'singleWrong',name:'单选错题数',type:'wrong',inputMax:16,weight:1,max:16,objective:true,help:'16道 × 1分；填错题数量'},
  {key:'multiWrong',name:'多选错题数',type:'wrong',inputMax:17,weight:2,max:34,objective:true,help:'17道 × 2分；填错题数量'},
  {key:'analysis',name:'分析题得分',type:'score',max:50,step:0.5,objective:false,help:'5道分析题，共50分'}]},
 english: {name:'英语一',short:'英一',max:100,objectiveMax:60,color:'#8db6ff',fields:[
  {key:'cloze',name:'完形填空',type:'score',max:10,step:0.5,objective:true,help:'20道 × 0.5分'},
  {key:'reading',name:'阅读理解 A',type:'score',max:40,step:2,objective:true,help:'20道 × 2分'},
  {key:'newtype',name:'新题型',type:'score',max:10,step:2,objective:true,help:'5道 × 2分'},
  {key:'translation',name:'英译汉',type:'score',max:10,step:0.5,objective:false,help:'翻译部分，满分10分'},
  {key:'smallEssay',name:'小作文',type:'score',max:10,step:0.5,objective:false,help:'应用文写作，满分10分'},
  {key:'bigEssay',name:'大作文',type:'score',max:20,step:0.5,objective:false,help:'短文写作，满分20分'}]},
 basic: {name:'法基（刑法＋民法）',short:'法基',max:150,objectiveMax:60,color:'#ffc58e',fields:[
  {key:'singleWrong',name:'单选错题数',type:'wrong',inputMax:40,weight:1,max:40,objective:true,help:'40道 × 1分'},
  {key:'multiWrong',name:'多选错题数',type:'wrong',inputMax:10,weight:2,max:20,objective:true,help:'10道 × 2分'},
  {key:'shortAnswer',name:'简答题合计',type:'score',max:40,step:0.5,objective:false,help:'4道，共40分'},
  {key:'article',name:'法条分析合计',type:'score',max:20,step:0.5,objective:false,help:'2道，共20分'},
  {key:'case',name:'案例分析合计',type:'score',max:30,step:0.5,objective:false,help:'2道，共30分'}]},
 comprehensive: {name:'法综（法理＋宪法＋法史）',short:'法综',max:150,objectiveMax:60,color:'#c6b3ff',fields:[
  {key:'singleWrong',name:'单选错题数',type:'wrong',inputMax:40,weight:1,max:40,objective:true,help:'40道 × 1分'},
  {key:'multiWrong',name:'多选错题数',type:'wrong',inputMax:10,weight:2,max:20,objective:true,help:'10道 × 2分'},
  {key:'shortAnswer',name:'简答题合计',type:'score',max:30,step:0.5,objective:false,help:'3道，共30分'},
  {key:'analysis',name:'分析题合计',type:'score',max:30,step:0.5,objective:false,help:'3道，共30分'},
  {key:'discussion',name:'论述题合计',type:'score',max:30,step:0.5,objective:false,help:'2道，共30分'}]}
};
const ORDER = Object.keys(SUBJECTS);
const PLANS = { '380':{politics:73,english:82,basic:113,comprehensive:112}, '390':{politics:75,english:85,basic:115,comprehensive:115} };

// Reference allocations. Sum per course = course maximum minus the subject target.
const LOSS_PLANS = {
 '380':{
  politics:{singleWrong:3,multiWrong:6,analysis:18},
  english:{cloze:3,reading:4,newtype:2,translation:3,smallEssay:2,bigEssay:4},
  basic:{singleWrong:4,multiWrong:6,shortAnswer:8,article:7,case:12},
  comprehensive:{singleWrong:4,multiWrong:6,shortAnswer:8,analysis:9,discussion:11}
 },
 '390':{
  politics:{singleWrong:2,multiWrong:6,analysis:17},
  english:{cloze:2,reading:2,newtype:2,translation:2,smallEssay:2,bigEssay:5},
  basic:{singleWrong:4,multiWrong:6,shortAnswer:7,article:7,case:11},
  comprehensive:{singleWrong:4,multiWrong:6,shortAnswer:7,analysis:8,discussion:10}
 }
};
const ISO_TODAY = () => {const d=new Date(),pad=x=>String(x).padStart(2,'0');return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;};
const escapeHtml = (x) => String(x ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = x => (Number.isInteger(x)?String(x):Number(x).toFixed(1));
let canPersist = true;
let data = {records:[],goals:{...PLANS['380']},budgets:{},theme:'dark',drafts:{},form:{subject:'politics',date:ISO_TODAY(),mode:'full',title:'',note:'',estimated:true},historyFilter:'all',chartSubject:'politics'};
const loaded = (()=>{try{const s=localStorage.getItem(KEY);return s?JSON.parse(s):null;}catch(e){canPersist=false;return null;}})();
if(loaded && typeof loaded==='object') {
 if(Array.isArray(loaded.records)) data.records=loaded.records.map(validRecord).filter(Boolean);
 if(loaded.goals && typeof loaded.goals==='object') for(const id of ORDER){let x=Number(loaded.goals[id]);if(Number.isFinite(x)&&x>=0&&x<=SUBJECTS[id].max)data.goals[id]=x;}
 if(loaded.budgets && typeof loaded.budgets==='object')data.budgets=loaded.budgets;
 if(loaded.theme==='light')data.theme='light';
 if(loaded.drafts && typeof loaded.drafts==='object') data.drafts=loaded.drafts;
 if(loaded.form && typeof loaded.form==='object')data.form={...data.form,...loaded.form};
 if(ORDER.includes(loaded.chartSubject))data.chartSubject=loaded.chartSubject;
}
if(!ORDER.includes(data.form.subject))data.form.subject='politics';
if(!['full','objective'].includes(data.form.mode))data.form.mode='full';
if(!/^\d{4}-\d\d-\d\d$/.test(data.form.date))data.form.date=ISO_TODAY();
let editingId=null;let toastTimer=null;
function persist(){try{localStorage.setItem(KEY,JSON.stringify(data));canPersist=true;}catch(e){canPersist=false;}storageState();}
function storageState(){ $('storageTitle').textContent=canPersist?'本地自动保存':'浏览器存储不可用';$('storageStatus').textContent=canPersist?'成绩只保存在当前浏览器中，不上传服务器。':'本次记录可能在关闭页面后丢失，请立即导出 JSON 备份。'; }
function toast(message){const el=$('toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2600);}
function activeFields(subject,mode){return SUBJECTS[subject].fields.filter(f=>mode==='full'||f.objective);}
function valuesFor(subject){if(!data.drafts[subject]||typeof data.drafts[subject]!=='object')data.drafts[subject]={};return data.drafts[subject];}
function compute(subject,mode,values){if(!SUBJECTS[subject] || !['full','objective'].includes(mode))return null;const fs=activeFields(subject,mode),s=SUBJECTS[subject];let objective=0,subjective=0;
 for(const f of fs){const raw=values[f.key];if(raw===undefined||raw===null||String(raw).trim()==='')return null;const n=Number(raw);const upper=f.type==='wrong'?f.inputMax:f.max;if(!Number.isFinite(n)||n<0||n>upper)return null;if(f.type==='wrong'&&!Number.isInteger(n))return null;if(f.type==='score' && Math.round(n*2)!==n*2)return null;if(f.step===2&&!Number.isInteger(n/2))return null;const score=f.type==='wrong'?f.max-n*f.weight:n;if(f.objective)objective+=score;else subjective+=score;}
 const max=mode==='full'?s.max:s.objectiveMax;return {total:Math.round((objective+subjective)*10)/10,objective,subjective,max,objectiveMax:s.objectiveMax,subjectiveMax:Math.max(0,max-s.objectiveMax)};}
function validRecord(rec){if(!rec || typeof rec!=='object'||!SUBJECTS[rec.subject]||!['full','objective'].includes(rec.mode)||typeof rec.values!=='object'||!rec.values)return null;const c=compute(rec.subject,rec.mode,rec.values);if(!c)return null;const date=String(rec.date||'');if(!/^\d{4}-\d\d-\d\d$/.test(date))return null;return {id:String(rec.id||`${Date.now()}-${Math.random()}`).slice(0,100),date,subject:rec.subject,mode:rec.mode,title:String(rec.title||'未命名试卷').slice(0,100),note:String(rec.note||'').slice(0,1000),estimated:!!rec.estimated,values:Object.fromEntries(activeFields(rec.subject,rec.mode).map(f=>[f.key,Number(rec.values[f.key])])),createdAt:Number.isFinite(Number(rec.createdAt))?Number(rec.createdAt):Date.now()};}
function recScore(rec){return compute(rec.subject,rec.mode,rec.values);}
function sortNew(a,b){return b.date.localeCompare(a.date)||(b.createdAt||0)-(a.createdAt||0);}
function sortOld(a,b){return a.date.localeCompare(b.date)||(a.createdAt||0)-(b.createdAt||0);}
function latestFull(id){return data.records.filter(r=>r.subject===id&&r.mode==='full').sort(sortNew)[0]||null;}

function budgetStep(f){return f.type==='wrong'?f.weight:(f.step===2?2:(f.step===0.5?0.5:1));}
function normalizeBudgetValue(f,x){let v=Number(x);if(!Number.isFinite(v))return null;const step=budgetStep(f);v=Math.round(Math.max(0,Math.min(f.max,v))/step)*step;return Math.round(v*2)/2;}
function budgetSum(b){return Object.values(b).reduce((a,v)=>a+Number(v||0),0);}
function recommendBudget(id,goal){
 const s=SUBJECTS[id],baseline=Math.abs(goal-PLANS['380'][id])<=Math.abs(goal-PLANS['390'][id])?'380':'390';
 const result={...LOSS_PLANS[baseline][id]};
 let remaining=Math.round((s.max-goal-budgetSum(result))*2)/2;
 // Distribute changes gradually across question types, favoring subjective flexibility.
 const priority=[...s.fields.filter(f=>!f.objective),...s.fields.filter(f=>f.objective)];
 let guard=0;
 while(Math.abs(remaining)>0.001 && guard++<500){let moved=false;
  for(const f of priority){const step=budgetStep(f);if(remaining>0&&remaining+1e-7>=step&&result[f.key]+step<=f.max+1e-7){result[f.key]+=step;remaining-=step;moved=true;}
   else if(remaining<0&&-remaining+1e-7>=step&&result[f.key]-step>=-1e-7){result[f.key]-=step;remaining+=step;moved=true;}
   if(Math.abs(remaining)<.001)break;}
  if(!moved)break;
 }
 return result;
}
function ensureBudget(id){
 if(!data.budgets||typeof data.budgets!=='object')data.budgets={};
 const entry=data.budgets[id];const goal=data.goals[id],s=SUBJECTS[id];
 if(entry&&Number(entry.goal)===Number(goal)&&entry.values&&s.fields.every(f=>{const val=Number(entry.values[f.key]),step=budgetStep(f);return Number.isFinite(val)&&val>=0&&val<=f.max&&Math.abs(val/step-Math.round(val/step))<1e-7;}))return entry.values;
 const values=recommendBudget(id,goal);data.budgets[id]={goal,values};return values;
}
function lossForField(f,raw){
 if(raw===undefined||raw===null||String(raw).trim()==='')return null;
 const x=Number(raw);if(!Number.isFinite(x)||x<0||x>(f.type==='wrong'?f.inputMax:f.max))return null;
 if(f.type==='wrong'&&!Number.isInteger(x))return null;
 if(f.type==='score'&&(Math.round(x*2)!==x*2||(f.step===2&&!Number.isInteger(x/2))))return null;
 return Math.round((f.type==='wrong'?x*f.weight:f.max-x)*2)/2;
}
function actualSource(id){
 const draft=data.drafts?.[id]||{};const filled=SUBJECTS[id].fields.some(f=>lossForField(f,draft[f.key])!==null);
 if(filled)return {values:draft,source:'未保存草稿',mode:id===data.form.subject?data.form.mode:'full'};
 const last=latestFull(id);return last?{values:last.values,source:'最近整卷：'+last.date,mode:'full'}:{values:null,source:'暂无实际成绩',mode:'full'};
}
function budgetStatus(loss,cap,ideal){if(loss===null)return {kind:'',label:'尚未填写'};return loss<=ideal+1e-7?{kind:'ok',label:'理想范围'}:loss<=cap+1e-7?{kind:'watch',label:'预算内'}:{kind:'bad',label:'超出 '+fmt(loss-cap)+' 分'};}
function idealCap(f,cap){const step=budgetStep(f);return Math.floor(Math.max(0,cap*.75)/step)*step;}
function renderBudgets(){
 $('lossGrid').innerHTML=ORDER.map(id=>{
  const s=SUBJECTS[id],allocation=ensureBudget(id),allowed=s.max-data.goals[id],used=budgetSum(allocation),gap=Math.round((used-allowed)*2)/2;
  const actual=actualSource(id),hasAny=!!actual.values;
  const items=s.fields.map(f=>{
   const cap=Number(allocation[f.key]),ideal=idealCap(f,cap),lost=hasAny?lossForField(f,actual.values[f.key]):null,st=budgetStatus(lost,cap,ideal);
   const detail=f.type==='wrong'?`最多错 ${Math.floor(cap/f.weight)} 道`:`满分 ${f.max} 分`;
   return `<div class="loss-item"><div class="loss-type">${f.name.replace('错题数','').replace('得分','')}<small>${detail} · 理想失分 ≤${fmt(ideal)}</small></div><div class="loss-budget"><div class="loss-budget-label">允许失分区间</div><div class="loss-range"><span>0～</span><input type="number" data-loss-subject="${id}" data-loss-field="${f.key}" min="0" max="${f.max}" step="${budgetStep(f)}" value="${fmt(cap)}" aria-label="${s.short}${f.name}最高失分"><span>分</span></div></div><div class="loss-actual"><div class="actual-score ${st.kind}">${lost===null?'—':fmt(lost)+' 分'}</div><div class="actual-meta">${st.label}</div></div></div>`;
  }).join('');
  const balanced=Math.abs(gap)<.001;
  const note=balanced?'各题型失分预算已与单科目标对齐':gap>0?`已超分配 ${fmt(gap)} 分`:`还可分配 ${fmt(-gap)} 分`;
  const usedClass=balanced?'positive':gap>0?'over':'under';
  return `<article class="card loss-card" style="--subjectColor:${s.color}"><div class="loss-card-head"><div><div class="loss-card-name">${s.name}</div><div class="loss-card-caption">${actual.source} · 以实际失分作对照</div></div><div class="loss-card-score"><strong>${fmt(used)} <span style="font-size:12px;color:var(--muted);font-weight:500">/ ${fmt(allowed)}</span></strong>已分配 / 可失分</div></div><div class="loss-card-bar"><span style="width:${allowed===0?(used===0?100:0):Math.min(100,used/allowed*100)}%"></span></div><div class="loss-card-balance"><span class="${usedClass}">${note}</span><span>本科目标 <strong>${fmt(data.goals[id])}/${s.max}</strong></span></div><div class="loss-items">${items}</div><div class="loss-card-actions"><div class="action-note">上限之和须等于可失分；可自由调整各题型的分配。</div><div class="loss-buttons"><button class="btn small ghost" data-loss-reset="${id}">恢复推荐</button>${balanced?'':`<button class="btn small" data-loss-sync="${id}">按分配更新目标</button>`}</div></div></article>`;
 }).join('');
}
function renderPreviewLoss(){
 const id=data.form.subject,s=SUBJECTS[id],draft=valuesFor(id),budget=ensureBudget(id);
 const fs=activeFields(id,data.form.mode);
 $('previewLossRows').innerHTML=fs.map(f=>{
  const lost=lossForField(f,draft[f.key]),cap=Number(budget[f.key]),st=budgetStatus(lost,cap,idealCap(f,cap));
  return `<div class="preview-loss-item"><span>${f.name.replace('错题数','').replace('得分','')}</span><b class="${st.kind}">${lost===null?'—':fmt(lost)} / ${fmt(cap)} 分</b></div>`;
 }).join('');
}
function totalGoal(){return ORDER.reduce((acc,id)=>acc+Number(data.goals[id]),0);}
function planName(){for(const [plan,goal] of Object.entries(PLANS)){if(ORDER.every(id=>goal[id]===Number(data.goals[id])))return plan;}return 'custom';}
function renderSummary(){const goal=totalGoal();$('headlineGoal').textContent=fmt(goal);$('goalNumber').innerHTML=`${fmt(goal)} <span class="unit">/ 500</span>`;
 document.querySelectorAll('[data-plan]').forEach(b=>b.classList.toggle('active',b.dataset.plan===planName()));
 $('lossBudget').innerHTML=`${fmt(500-goal)} <span class="unit">分可失</span>`;
 const complete=ORDER.map(id=>latestFull(id));const n=complete.filter(Boolean).length;
 if(!n){$('currentTotal').innerHTML='— <span class="unit">/ 500</span>';$('filledDesc').textContent='尚无完整模拟记录';$('goalTrack').style.width='0%';$('gapDesc').textContent=`四科满分 500 − 目标分数 ${fmt(goal)}`;}
 else {const sum=complete.reduce((acc,r)=>acc+(r?recScore(r).total:0),0);$('currentTotal').innerHTML=`${fmt(sum)} <span class="unit">${n<4?'已录入分':'/ 500'}</span>`;$('filledDesc').textContent=n<4?`已录入 ${n}/4 科整卷，尚不可与总目标直接比较`:`四科最近一次整卷汇总（不同试卷日期）`;$('goalTrack').style.width=`${Math.min(100,sum/500*100)}%`;
 $('gapDesc').textContent=n<4?`尚缺 ${4-n} 科完整记录，不能推算最终总分`:(sum>=goal?`已高出目标 ${fmt(sum-goal)} 分`:`距离目标还差 ${fmt(goal-sum)} 分`);}
 $('subjectSummary').innerHTML=ORDER.map(id=>{const s=SUBJECTS[id],last=latestFull(id),score=last?recScore(last).total:null,target=data.goals[id],lost=score===null?null:s.max-score,delta=score===null?null:score-target;return `<article class="card subject-card" style="--subjectColor:${s.color}"><div class="subject-head"><div class="subject-name">${s.name}</div><div class="subject-max">/ ${s.max}分</div></div><div class="subject-score">${score===null?'—':fmt(score)} <small>/ ${s.max}</small></div><div class="subject-target"><label for="target-${id}">科目目标</label><input type="number" id="target-${id}" data-goal="${id}" min="0" max="${s.max}" step="1" value="${target}" aria-label="${s.name}目标分数"></div><div class="subject-progress"><span style="width:${score===null?0:Math.min(100,score/s.max*100)}%"></span></div><div class="subject-bottom"><span>可失 <b>${fmt(s.max-target)}</b> 分${lost===null?'':' · 实失 '+fmt(lost)}</span><span class="${delta===null?'neutral':delta>=0?'positive':'negative'}">${delta===null?'暂无整卷':delta===0?'刚好达标':delta>0?`高于目标 ${fmt(delta)}`:`差 ${fmt(-delta)} 分`}</span></div></article>`;}).join('');}
function renderTabs(){ $('subjectTabs').innerHTML=ORDER.map(id=>`<button type="button" role="tab" aria-selected="${data.form.subject===id}" class="${data.form.subject===id?'active':''}" data-subject="${id}">${SUBJECTS[id].short}</button>`).join('');}
function renderForm(){const s=SUBJECTS[data.form.subject],mode=data.form.mode;renderTabs();$('paperDate').value=data.form.date;$('paperMode').value=mode;$('paperTitle').value=data.form.title;$('paperNote').value=data.form.note;$('estimateCheck').checked=data.form.estimated;$('estimateCheck').closest('div').style.display=mode==='full'?'':'none';$('scoreFormLabel').textContent=`${s.name} · 分项${mode==='full'?'得分':'客观题'}`;$('maxLabel').textContent=`满分 ${mode==='full'?s.max:s.objectiveMax}`;
 const draft=valuesFor(data.form.subject);
 $('scoreInputs').innerHTML=activeFields(data.form.subject,mode).map(f=>`<div class="score-field"><div class="field-top"><label for="field-${f.key}">${f.name}</label><span class="cap">${f.type==='wrong'?'最多错 '+f.inputMax+' 题':'满分 '+f.max}</span></div><input id="field-${f.key}" type="number" inputmode="decimal" min="0" max="${f.type==='wrong'?f.inputMax:f.max}" step="${f.type==='wrong'?'1':f.step||.5}" data-score-field="${f.key}" value="${draft[f.key]===undefined?'':escapeHtml(draft[f.key])}" placeholder="${f.type==='wrong'?'错几道？':'得了几分？'}" aria-label="${f.name}"><div class="field-help">${f.help}</div></div>`).join('');
 $('saveBtn').textContent=editingId?'✓ 更新这条记录':'＋ 保存成绩';$('cancelEditBtn').style.display=editingId?'':'none';$('saveHint').textContent=mode==='objective'?'客观题专项将单独入档，不参与四科总分统计。':'请填全各分项，0分也请明确填“0”；保存前可随时调整。';renderPreview();}
function renderPreview(){const id=data.form.subject,s=SUBJECTS[id],mode=data.form.mode,c=compute(id,mode,valuesFor(id)),goal=data.goals[id],m=mode==='full'?s.max:s.objectiveMax;const st=$('previewIndicator');st.textContent=c?'已完成测算':'等待填写';st.classList.toggle('off',!c);$('previewObjective').textContent=c?`${fmt(c.objective)} / ${s.objectiveMax}`:`— / ${s.objectiveMax}`;$('subjectiveLine').style.display=mode==='full'?'':'none';$('previewSubjective').textContent=c?`${fmt(c.subjective)} / ${s.max-s.objectiveMax}`:`— / ${s.max-s.objectiveMax}`;$('previewTotal').innerHTML=`${c?fmt(c.total):'—'} <small>/ ${m}</small>`;$('previewLost').textContent=c?`${fmt(m-c.total)} 分`:'—';$('previewAllowed').textContent=mode==='full'?`${fmt(s.max-goal)} 分`:'不适用';let status='填写分项后显示实时结果';if(c){if(mode==='objective')status='仅客观题练习，不计入整卷总分';else if(c.total>=goal)status=`超过本科目标 ${fmt(c.total-goal)} 分`;else status=`距离本科目标还差 ${fmt(goal-c.total)} 分`;}$('previewStatus').textContent=status;$('previewStatus').classList.toggle('good',!!c&&mode==='full'&&c.total>=goal);
 const descriptions={politics:'单选每错1道失1分，多选每错1道失2分；主观题估分应考虑原理是否切题。',english:'阅读A部分每道2分；翻译和作文不宜只凭“感觉写得好”给分。',basic:'法基客观题满分60，主观题满分90；案例分析和法条分析需真实演练。',comprehensive:'法综客观题满分60，主观题满分90；论述题要留意采分点完整度。'};
 $('previewAdvice').innerHTML=`${s.name}的当前目标是 <strong>${goal}/${s.max}</strong>。${descriptions[id]}`;renderPreviewLoss();}
function renderHistory(){const sort=[...data.records].sort(sortNew);$('historyCount').textContent=`${sort.length} 条记录`;$('recordCountBadge').textContent=`${sort.length} 条`;
 $('historyFilters').innerHTML=[['all','全部'],...ORDER.map(id=>[id,SUBJECTS[id].short])].map(([id,label])=>`<button data-hfilter="${id}" class="${data.historyFilter===id?'active':''}">${label}</button>`).join('');
 const shown=sort.filter(r=>data.historyFilter==='all'||r.subject===data.historyFilter);
 if(!shown.length){$('historyList').innerHTML=`<div class="empty"><div><svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="6" width="24" height="31" rx="4" stroke="currentColor" stroke-width="2"/><path d="M16 15h12M16 21h12M16 27h7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><div><strong>还没有成绩记录</strong><p>先在上方录入一张卷子，历史成绩和趋势就会出现在这里。</p></div></div></div>`;return;}
 $('historyList').innerHTML=shown.map(r=>{const c=recScore(r),s=SUBJECTS[r.subject],diff=c.total-data.goals[r.subject];return `<article class="record"><div><div class="record-title">${escapeHtml(r.title)}</div><div class="record-meta">${r.date} · ${s.short} · ${r.mode==='full'?'整卷':'仅客观题'}${r.estimated&&r.mode==='full'?' · 含主观题估分':''}</div><div class="record-meta" style="margin-top:4px">${r.mode==='full'?`客观 ${fmt(c.objective)}＋主观 ${fmt(c.subjective)} · ${diff>=0?'高于目标 '+fmt(diff):'距目标 '+fmt(-diff)} 分`:`客观题满分 ${s.objectiveMax} 分`}</div>${r.note?`<div class="record-meta" style="margin-top:6px;white-space:pre-wrap;overflow-wrap:anywhere">${escapeHtml(r.note)}</div>`:''}</div><div><div class="record-score">${fmt(c.total)} <small>/ ${c.max}</small></div><div class="record-actions"><button class="textbtn" data-edit="${escapeHtml(r.id)}">修改</button><button class="textbtn red" data-remove="${escapeHtml(r.id)}">删除</button></div></div></article>`;}).join('');}
function renderChart(){ $('chartFilters').innerHTML=ORDER.map(id=>`<button data-chart="${id}" class="${data.chartSubject===id?'selected':''}">${SUBJECTS[id].short}</button>`).join('');const id=data.chartSubject,s=SUBJECTS[id],rows=data.records.filter(r=>r.subject===id&&r.mode==='full').sort(sortOld),el=$('chartWrap');
 if(!rows.length){el.innerHTML=`<div class="empty"><div><svg width="48" height="42" viewBox="0 0 48 42" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 36h40M8 30l10-9 9 5 13-17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="40" cy="9" r="3" fill="currentColor"/></svg><div><strong>暂无${s.short}整卷趋势</strong><p>保存至少一次该科的完整模拟成绩后即可查看。</p></div></div></div>`;return;}
 const width=550,height=240,ml=37,mr=17,mt=14,mb=33,plotW=width-ml-mr,plotH=height-mt-mb;const maxY=s.max,minY=0;const y=v=>mt+(maxY-v)/(maxY-minY)*plotH;const x=i=>rows.length===1?ml+plotW/2:ml+plotW*i/(rows.length-1);const pts=rows.map((r,i)=>({x:x(i),y:y(recScore(r).total),val:recScore(r).total,label:r.date+' '+r.title}));
 const bg=[0,.25,.5,.75,1].map(p=>{const val=s.max*(1-p),yy=y(val);return `<line x1="${ml}" y1="${yy}" x2="${width-mr}" y2="${yy}" stroke="var(--line)" stroke-width="1"/><text x="${ml-7}" y="${yy+4}" fill="var(--muted)" font-size="11" text-anchor="end">${fmt(val)}</text>`;}).join('');
 const line=pts.map((pt,i)=>`${i===0?'M':'L'} ${pt.x.toFixed(2)},${pt.y.toFixed(2)}`).join(' ');const area=line+` L ${pts[pts.length-1].x.toFixed(2)},${y(0)} L ${pts[0].x.toFixed(2)},${y(0)} Z`;
 const points=pts.map(p=>`<circle cx="${p.x}" cy="${p.y}" r="4.5" fill="${s.color}" stroke="var(--card)" stroke-width="2"><title>${escapeHtml(p.label)}：${fmt(p.val)} 分</title></circle>`).join('');
 const labelIdx=[0,Math.floor((rows.length-1)/2),rows.length-1].filter((v,i,a)=>a.indexOf(v)===i);const labels=labelIdx.map(i=>`<text x="${x(i)}" y="${height-9}" font-size="11" text-anchor="middle" fill="var(--muted)">${rows[i].date.slice(5)}</text>`).join('');
 const goalY=y(data.goals[id]);el.innerHTML=`<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${s.name}最近${rows.length}次整卷成绩趋势图，目标${data.goals[id]}分"><defs><linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${s.color}" stop-opacity=".23"/><stop offset="1" stop-color="${s.color}" stop-opacity="0"/></linearGradient></defs>${bg}<line x1="${ml}" y1="${goalY}" x2="${width-mr}" y2="${goalY}" stroke="var(--orange)" stroke-width="1.5" stroke-dasharray="5 5"/><text x="${width-mr}" y="${goalY-6}" text-anchor="end" fill="var(--orange)" font-size="10">目标 ${data.goals[id]}</text>${pts.length>1?`<path d="${area}" fill="url(#areaGradient)"/><path d="${line}" stroke="${s.color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`:''}${points}${labels}</svg>`;}
function renderAll(){document.documentElement.classList.toggle('light',data.theme==='light');$('themeBtn').textContent=data.theme==='dark'?'☼ 浅色模式':'☾ 深色模式';renderSummary();renderBudgets();renderForm();renderHistory();renderChart();storageState();}
function normalizeForm(){data.form.date=$('paperDate').value;data.form.title=$('paperTitle').value;data.form.note=$('paperNote').value;data.form.estimated=$('estimateCheck').checked;}
function clearDraft(){data.drafts[data.form.subject]={};data.form.title='';data.form.note='';data.form.estimated=true;editingId=null;data.form.mode='full';data.form.date=ISO_TODAY();persist();renderForm();renderBudgets();}
function saveRecord(){normalizeForm();const f=data.form,s=SUBJECTS[f.subject],values=valuesFor(f.subject),c=compute(f.subject,f.mode,values);
 if(!f.date){toast('请先填写练习日期');$('paperDate').focus();return;}if(!f.title.trim()){toast('请填写试卷名称');$('paperTitle').focus();return;}if(!c){toast('请补齐分项分数，并检查输入范围');return;}
 const record=validRecord({id:editingId||`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,createdAt:editingId?(data.records.find(r=>r.id===editingId)?.createdAt||Date.now()):Date.now(),subject:f.subject,date:f.date,mode:f.mode,title:f.title.trim(),note:f.note,estimated:f.mode==='full'&&f.estimated,values:{...values}});
 if(!record){toast('输入校验失败，请检查所有分项');return;}
 if(editingId){data.records=data.records.map(r=>r.id===editingId?record:r);toast(`已更新：${record.title} ${fmt(c.total)}分`);}else{data.records.push(record);toast(`已保存：${record.title} ${fmt(c.total)}分`);}
 clearDraft();renderAll();}
function editRecord(id){const r=data.records.find(v=>v.id===id);if(!r)return;editingId=r.id;data.form={subject:r.subject,date:r.date,mode:r.mode,title:r.title,note:r.note,estimated:r.estimated};data.drafts[r.subject]={...r.values};renderForm();renderBudgets();document.querySelector('.form-card').scrollIntoView({behavior:'smooth',block:'start'});toast('已载入记录，请修改后点“更新这条记录”');}
function removeRecord(id){const r=data.records.find(v=>v.id===id);if(!r)return;if(!window.confirm(`确认删除「${r.title}」这条成绩记录吗？`))return;data.records=data.records.filter(v=>v.id!==id);if(editingId===id){editingId=null;clearDraft();}persist();renderSummary();renderBudgets();renderHistory();renderChart();toast('已删除记录');}
function exportDownload(filename,mime,content){const blob=new Blob([content],{type:mime});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);}
function exportJson(){const backup={app:'2027-fashuo-score-tracker',version:2,exportedAt:new Date().toISOString(),goals:data.goals,budgets:data.budgets,records:data.records};exportDownload(`法硕四科记分备份_${ISO_TODAY()}.json`,'application/json;charset=utf-8',JSON.stringify(backup,null,2));toast('JSON 备份已导出');}
function csvCell(x){return '"'+String(x??'').replace(/"/g,'""')+'"';}
function exportCsv(){const header=['日期','科目','试卷名称','记录范围','客观题','主观题','本次得分','该次满分','目标分','距离目标','含主观题估分','备注','分项详情'];const rows=data.records.slice().sort(sortNew).map(r=>{const c=recScore(r);return [r.date,SUBJECTS[r.subject].name,r.title,r.mode==='full'?'整卷':'仅客观题',c.objective,r.mode==='full'?c.subjective:'',c.total,c.max,r.mode==='full'?data.goals[r.subject]:'',r.mode==='full'?c.total-data.goals[r.subject]:'',r.estimated?'是':'否',r.note,JSON.stringify(r.values)].map(csvCell).join(',');});exportDownload(`法硕四科成绩表_${ISO_TODAY()}.csv`,'text/csv;charset=utf-8','\ufeff'+[header.map(csvCell).join(','),...rows].join('\r\n'));toast('CSV 成绩表已导出');}
async function importJson(file){if(!file)return;if(file.size>5*1024*1024){toast('备份文件过大，请检查');return;}try{const raw=JSON.parse(await file.text());if(raw.app!=='2027-fashuo-score-tracker'||!Array.isArray(raw.records))throw Error('不是本网页导出的备份');const valid=raw.records.map(validRecord).filter(Boolean);if(!window.confirm(`识别到 ${valid.length} 条有效记录。是否合并到当前档案？（同ID记录以导入文件为准）`))return;const map=new Map(data.records.map(r=>[r.id,r]));for(const r of valid)map.set(r.id,r);data.records=[...map.values()];if(raw.goals && typeof raw.goals==='object')for(const id of ORDER){const x=Number(raw.goals[id]);if(Number.isInteger(x)&&x>=0&&x<=SUBJECTS[id].max)data.goals[id]=x;}if(raw.budgets && typeof raw.budgets==='object')data.budgets=raw.budgets;else data.budgets={};persist();renderAll();toast(`已导入 ${valid.length} 条记录`);}catch(e){toast('导入失败：'+(e.message||'文件格式错误'));}finally{$('importInput').value='';}}
// Interactions

$('lossGrid').addEventListener('change',e=>{
 const el=e.target.closest('[data-loss-field]');if(!el)return;
 const id=el.dataset.lossSubject,f=SUBJECTS[id]?.fields.find(x=>x.key===el.dataset.lossField);if(!f)return;
 const normalized=normalizeBudgetValue(f,el.value);
 if(normalized===null){toast('请输入有效的失分上限');renderBudgets();return;}
 ensureBudget(id)[f.key]=normalized;persist();renderBudgets();if(id===data.form.subject)renderPreview();
});
$('lossGrid').addEventListener('click',e=>{
 const reset=e.target.closest('[data-loss-reset]'),sync=e.target.closest('[data-loss-sync]');
 if(reset){const id=reset.dataset.lossReset;data.budgets[id]={goal:data.goals[id],values:recommendBudget(id,data.goals[id])};persist();renderBudgets();renderPreview();toast('已恢复'+SUBJECTS[id].short+'推荐失分分配');}
 if(sync){const id=sync.dataset.lossSync,s=SUBJECTS[id],values=ensureBudget(id),newGoal=Math.round((s.max-budgetSum(values))*2)/2;
  if(!Number.isInteger(newGoal)||newGoal<0||newGoal>s.max){toast('新的科目目标必须为整数且在满分范围内');return;}
  data.goals[id]=newGoal;data.budgets[id]={goal:newGoal,values:{...values}};persist();renderSummary();renderBudgets();renderPreview();renderHistory();renderChart();toast('已根据失分分配更新'+s.short+'目标为 '+newGoal+' 分');}
});
$('subjectTabs').addEventListener('click',e=>{const b=e.target.closest('[data-subject]');if(!b||!SUBJECTS[b.dataset.subject])return;normalizeForm();editingId=null;data.form.subject=b.dataset.subject;data.form.title='';data.form.note='';data.form.estimated=true;data.form.mode='full';persist();renderForm();renderBudgets();});
$('scoreInputs').addEventListener('input',e=>{const inp=e.target.closest('[data-score-field]');if(!inp)return;valuesFor(data.form.subject)[inp.dataset.scoreField]=inp.value;persist();renderPreview();renderBudgets();});
$('paperDate').addEventListener('change',()=>{normalizeForm();persist();});
$('paperTitle').addEventListener('input',()=>{normalizeForm();persist();});
$('paperNote').addEventListener('input',()=>{normalizeForm();persist();});
$('estimateCheck').addEventListener('change',()=>{normalizeForm();persist();});
$('paperMode').addEventListener('change',e=>{normalizeForm();data.form.mode=e.target.value;persist();renderForm();renderBudgets();});
$('subjectSummary').addEventListener('change',e=>{const el=e.target.closest('[data-goal]');if(!el)return;const id=el.dataset.goal,v=Number(el.value);if(!SUBJECTS[id]||el.value===''||!Number.isInteger(v)||v<0||v>SUBJECTS[id].max){renderSummary();toast('科目目标请输入有效整数');return;}data.goals[id]=v;persist();renderSummary();renderBudgets();renderPreview();renderHistory();renderChart();});
document.querySelector('.goal-buttons').addEventListener('click',e=>{const el=e.target.closest('[data-plan]');if(!el)return;const plan=el.dataset.plan;if(PLANS[plan]){data.goals={...PLANS[plan]};data.budgets={};persist();renderSummary();renderBudgets();renderPreview();renderHistory();renderChart();toast(`已切换到 ${plan} 分方案`);}else{document.getElementById('target-politics').focus();toast('可直接修改下方四科目标，即为自定义方案');}});
$('saveBtn').addEventListener('click',saveRecord);
$('resetBtn').addEventListener('click',()=>{if(editingId && !window.confirm('正在修改已有记录，确定放弃当前编辑吗？'))return;clearDraft();toast('已清空当前科目输入');});
$('cancelEditBtn').addEventListener('click',()=>{clearDraft();toast('已退出编辑');});
$('historyFilters').addEventListener('click',e=>{const el=e.target.closest('[data-hfilter]');if(!el)return;data.historyFilter=el.dataset.hfilter;renderHistory();});
$('historyList').addEventListener('click',e=>{const edit=e.target.closest('[data-edit]'),del=e.target.closest('[data-remove]');if(edit)editRecord(edit.dataset.edit);if(del)removeRecord(del.dataset.remove);});
$('chartFilters').addEventListener('click',e=>{const el=e.target.closest('[data-chart]');if(!el)return;data.chartSubject=el.dataset.chart;persist();renderChart();});
$('themeBtn').addEventListener('click',()=>{data.theme=data.theme==='dark'?'light':'dark';persist();renderAll();});
$('exampleBtn').addEventListener('click',()=>{editingId=null;data.form={subject:'politics',date:'2026-11-20',mode:'full',title:'肖八 · 第1套（自估）',note:'单选错3道，多选错5道；主观题按手写采分点自估37分。',estimated:true};data.drafts.politics={singleWrong:3,multiWrong:5,analysis:37};persist();renderForm();renderBudgets();document.querySelector('.form-card').scrollIntoView({behavior:'smooth',block:'start'});toast('已预填政治74分；核对后点击“保存成绩”');});
$('topExportBtn').addEventListener('click',exportJson);$('exportJsonBtn').addEventListener('click',exportJson);$('exportCsvBtn').addEventListener('click',exportCsv);$('importBtn').addEventListener('click',()=>$('importInput').click());$('importInput').addEventListener('change',e=>importJson(e.target.files[0]));
$('wipeBtn').addEventListener('click',()=>{if(!data.records.length){toast('当前没有可删除的记录');return;}if(!window.confirm(`确定永久删除当前浏览器中全部 ${data.records.length} 条成绩记录？建议先导出 JSON 备份。`))return;data.records=[];persist();renderSummary();renderBudgets();renderHistory();renderChart();toast('已清空历史记录');});
renderAll();
})();

  }

  function installPanel() {
    if (overlay) return overlay;
    overlay = window.document.createElement('div');
    overlay.id = ROOT_ID;
    overlay.hidden = true;
    Object.assign(overlay.style, {
      position:'fixed', inset:'0', zIndex:'2147483000', overflowX:'hidden',
      overflowY:'auto', overscrollBehavior:'contain', background:'#0b1020',
      isolation:'isolate', display:'none', WebkitOverflowScrolling:'touch'
    });
    const host = window.document.createElement('section');
    host.setAttribute('role','region');
    host.setAttribute('aria-label','2027法硕四科失分控制室');
    shadow = host.attachShadow({mode:'open'});
    shadow.innerHTML = HTML;
    const back = window.document.createElement('button');
    back.type='button';
    back.className='btn ghost';
    back.innerHTML='← 返回训练营';
    back.setAttribute('aria-label','返回吉大法硕训练营');
    back.addEventListener('click', leave);
    const bar = shadow.querySelector('.top-actions');
    if (bar) bar.prepend(back);
    overlay.appendChild(host);
    window.document.body.appendChild(overlay);
    initTrackerModule(shadow, host);
    return overlay;
  }

  function renderRoute() {
    const isOpen = window.location.hash === ROUTE;
    if (!isOpen && !overlay) return;
    const panel = installPanel();
    if (isOpen) {
      if (panel.hidden) {
        oldOverflow = window.document.body.style.overflow;
        window.document.body.style.overflow='hidden';
        panel.hidden=false;
        panel.style.display='block';
        panel.scrollTop=0;
      }
    } else if (!panel.hidden) {
      panel.hidden=true;
      panel.style.display='none';
      window.document.body.style.overflow=oldOverflow;
    }
  }

  function enter(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    if (window.location.hash !== ROUTE) {
      shouldReturn=true;
      window.history.pushState({jluScore:true},'',ROUTE);
    }
    renderRoute();
  }

  function leave() {
    if (window.location.hash !== ROUTE) return;
    if (shouldReturn && window.history.length>1) {
      shouldReturn=false;
      window.history.back();
      // If the browser suppresses popstate, return panel stays accessible via browser Back.
    } else {
      window.history.replaceState(null,'',window.location.pathname+window.location.search);
      renderRoute();
    }
  }

  function makeLauncher(reference, isButton) {
    const el=window.document.createElement(isButton?'button':'a');
    if (isButton) el.type='button'; else el.href=ROUTE;
    el.className=reference?.className||'';
    el.textContent=NAV_TEXT;
    el.setAttribute('data-jlu-score-launcher','');
    el.setAttribute('aria-label','打开四科失分预算与成绩档案');
    el.addEventListener('click',enter);
    // Link-like behavior, without requiring changes to the site's tab handler.
    el.style.cursor='pointer';
    return el;
  }

  function ensureLaunchers() {
    // Main site's existing tab is the safest insertion point, no app.js changes.
    const buttons=[...window.document.querySelectorAll('button')].filter(b=>!b.closest('#'+ROOT_ID));
    const boss=buttons.find(b=>/模考\s*Boss/.test(b.textContent||''));
    if (boss && !window.document.querySelector('[data-jlu-score-launcher="nav"]')) {
      const anchor=makeLauncher(boss,true);
      anchor.dataset.jluScoreLauncher='nav';
      boss.insertAdjacentElement('afterend',anchor);
    }
    // Extra shortcut near the existing Boss recording form.
    const bossSave=buttons.find(b=>/保存\s*Boss\s*战报/.test(b.textContent||''));
    if (bossSave && !window.document.querySelector('[data-jlu-score-launcher="boss"]')) {
      const shortcut=makeLauncher(bossSave,true);
      shortcut.textContent='查看四科失分预算 ↗';
      shortcut.dataset.jluScoreLauncher='boss';
      shortcut.style.marginLeft='8px';
      bossSave.insertAdjacentElement('afterend',shortcut);
    }
    if (!boss && !window.document.querySelector('[data-jlu-score-launcher="floating"]')) {
      // Graceful fallback if the host site renames its navigation.
      const fallback=makeLauncher(null,true);
      fallback.dataset.jluScoreLauncher='floating';
      fallback.style.cssText='position:fixed;bottom:16px;right:16px;z-index:1200;background:#183c55;color:#fff;border:1px solid #79b3da;border-radius:999px;padding:10px 15px;box-shadow:0 8px 22px #0002;';
      window.document.body.appendChild(fallback);
    }
  }

  function start() {
    ensureLaunchers();
    window.addEventListener('hashchange',renderRoute);
    window.addEventListener('popstate',renderRoute);
    window.document.addEventListener('keydown',event=>{
      if(event.key==='Escape' && window.location.hash===ROUTE) leave();
    });
    let pending=false;
    const watcher=new MutationObserver(()=>{
      if(pending) return;
      pending=true;
      queueMicrotask(()=>{ pending=false; ensureLaunchers(); });
    });
    // Nav may be rebuilt when the site's training state changes.
    watcher.observe(window.document.body,{childList:true,subtree:true});
    renderRoute();
  }
  if (window.document.readyState==='loading') window.document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
