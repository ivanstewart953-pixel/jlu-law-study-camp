/* Cloud Sync V2: deterministic cross-device sync + mobile-first login in Backup and Photos. */
(function(){
  const SUPABASE_URL='https://lthqhdeuwbsbazvftnpr.supabase.co';
  const SUPABASE_KEY='sb_publishable_6lE-bKpwU-VjejE6gpCcew_c6PW83mI';
  const STORE='jluCampV3';
  const BASE='jluCloudBaseline:';
  const LAST_SYNC='jluCloudLastSyncAt';
  let sb=null,session=null,syncBusy=false,syncTimer=null;

  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#039;'}[m]));
  const state=()=>{try{return JSON.parse(localStorage.getItem(STORE)||'{}')}catch{return {}}};
  const same=(a,b)=>JSON.stringify(a||{})===JSON.stringify(b||{});
  const baselineKey=()=>session?BASE+session.user.id:null;
  const getBaseline=()=>{try{return JSON.parse(localStorage.getItem(baselineKey())||'null')}catch{return null}};
  const setBaseline=s=>{if(!session)return;localStorage.setItem(baselineKey(),JSON.stringify(s||{}));localStorage.setItem(LAST_SYNC,new Date().toISOString());renderStatus()};

  function authored(s){
    const checkins=Object.values(s?.checkins||{});
    const hasCheckin=checkins.some(r=>Number(r?.base397||0)+Number(r?.comp497||0)+Number(r?.english||0)+Number(r?.politics||0)>0 || String(r?.review||'').trim() || String(r?.blocker||'').trim() || String(r?.tomorrow||'').trim());
    return Boolean(hasCheckin || (s?.mocks||[]).length || Object.keys(s?.mastery||{}).length || Object.keys(s?.externalQuestionProgress||{}).length);
  }

  async function client(){
    if(sb)return sb;
    const mod=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    sb=mod.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    return sb;
  }

  function panelMarkup(mode){
    return `<article class="panel cloud2-panel" data-cloud-panel="${mode}">
      <div class="cloud2-head"><div><p class="micro">CLOUD LINK</p><h3>${mode==='photos'?'云相册与账号':'跨设备云存档'}</h3><p class="muted">同一账号同步手机与电脑。断网时本地功能仍可正常使用。</p></div><span class="cloud2-status" data-cloud-status>LOCAL</span></div>
      <div data-cloud-out>
        <div class="cloud2-login-grid"><label>邮箱<input type="email" data-cloud-email autocomplete="email" placeholder="邮箱"></label><label>密码<input type="password" data-cloud-password autocomplete="current-password" placeholder="密码"></label></div>
        <div class="cloud2-actions"><button class="btn" type="button" data-cloud-login>登录并同步</button><button class="btn ghost" type="button" data-cloud-signup>创建账号</button></div>
        <p class="cloud2-message" data-cloud-message>登录后，新设备如果没有真实学习记录，会自动恢复云端进度。</p>
      </div>
      <div data-cloud-in hidden>
        <div class="cloud2-user"><span>已登录</span><strong data-cloud-user>--</strong><small data-cloud-last>尚未同步</small></div>
        <div class="cloud2-actions"><button class="btn" type="button" data-cloud-sync>立即同步</button><button class="btn ghost" type="button" data-cloud-pull>云端恢复本机</button><button class="btn ghost" type="button" data-cloud-push>本机覆盖云端</button>${mode==='photos'?'<button class="btn ghost" type="button" data-cloud-migrate>迁移本机照片</button>':''}<button class="btn danger" type="button" data-cloud-logout>退出</button></div>
        <p class="cloud2-message" data-cloud-message>已连接云端。</p>
      </div>
    </article>`;
  }

  function inject(){
    const backup=document.querySelector('#backup');
    if(backup&&!backup.querySelector('[data-cloud-panel="backup"]')){
      const title=backup.querySelector('.page-title');
      title?.insertAdjacentHTML('afterend',panelMarkup('backup'));
    }
    const photos=document.querySelector('#photos');
    if(photos&&!photos.querySelector('[data-cloud-panel="photos"]')){
      const title=photos.querySelector('.page-title');
      title?.insertAdjacentHTML('afterend',panelMarkup('photos'));
      if(!photos.querySelector('#cloudGalleryWrap')){
        photos.insertAdjacentHTML('beforeend','<article class="panel cloud2-gallery-wrap" id="cloudGalleryWrap"><div class="panel-head"><div><p class="micro">CLOUD ALBUM</p><h3>云端照片墙</h3></div><span class="pill" id="cloudPhotoCount">未登录</span></div><p class="muted" id="cloudPhotoHint">登录后显示电脑和手机共享的私有照片。</p><div class="cloud2-gallery" id="cloudGallery"></div></article>');
      }
    }
    document.querySelectorAll('[data-cloud-panel]').forEach(bindPanel);
    bindPhotoForm();
    renderStatus();
  }

  function bindPanel(panel){
    if(panel.dataset.bound)return;panel.dataset.bound='1';
    panel.querySelector('[data-cloud-login]')?.addEventListener('click',()=>login(panel));
    panel.querySelector('[data-cloud-signup]')?.addEventListener('click',()=>signup(panel));
    panel.querySelector('[data-cloud-sync]')?.addEventListener('click',()=>smartSync(true));
    panel.querySelector('[data-cloud-pull]')?.addEventListener('click',()=>{if(confirm('用云端学习进度覆盖本机？'))pull()});
    panel.querySelector('[data-cloud-push]')?.addEventListener('click',()=>{if(confirm('用本机学习进度覆盖云端？'))push()});
    panel.querySelector('[data-cloud-logout]')?.addEventListener('click',logout);
    panel.querySelector('[data-cloud-migrate]')?.addEventListener('click',migrateLocalPhotos);
  }

  function msg(text,error=false){document.querySelectorAll('[data-cloud-message]').forEach(x=>{x.textContent=text;x.classList.toggle('error',error)})}
  function renderStatus(){
    const last=localStorage.getItem(LAST_SYNC);
    document.querySelectorAll('[data-cloud-panel]').forEach(panel=>{
      panel.querySelector('[data-cloud-out]').hidden=Boolean(session);
      panel.querySelector('[data-cloud-in]').hidden=!session;
      const badge=panel.querySelector('[data-cloud-status]');
      if(badge){badge.textContent=session?(syncBusy?'SYNC':'CLOUD'):'LOCAL';badge.className='cloud2-status '+(session?'cloud':'local')}
      if(session){panel.querySelector('[data-cloud-user]').textContent=session.user.email||session.user.id;panel.querySelector('[data-cloud-last]').textContent=last?`最近同步 ${new Date(last).toLocaleString()}`:'尚未同步'}
    });
    const count=document.querySelector('#cloudPhotoCount');if(count&&!session)count.textContent='未登录';
  }

  async function login(panel){
    const email=panel.querySelector('[data-cloud-email]')?.value.trim();const password=panel.querySelector('[data-cloud-password]')?.value||'';
    if(!email||!password){msg('请输入邮箱和密码。',true);return}
    try{msg('正在登录…');const c=await client();const {data,error}=await c.auth.signInWithPassword({email,password});if(error)throw error;session=data.session;renderStatus();await smartSync(true);await renderCloudPhotos()}catch(e){msg(`登录失败：${e.message||e}`,true)}
  }
  async function signup(panel){
    const email=panel.querySelector('[data-cloud-email]')?.value.trim();const password=panel.querySelector('[data-cloud-password]')?.value||'';
    if(!email||password.length<8){msg('请输入有效邮箱和至少 8 位密码。',true);return}
    try{const c=await client();const {data,error}=await c.auth.signUp({email,password});if(error)throw error;session=data.session;if(session){renderStatus();await smartSync(true)}else msg('账号已创建，请先去邮箱完成验证。')}catch(e){msg(`注册失败：${e.message||e}`,true)}
  }
  async function logout(){try{(await client()).auth.signOut()}catch{}session=null;renderStatus();msg('已退出云账号，本机数据仍保留。')}

  async function cloudRow(){const {data,error}=await (await client()).from('study_states').select('state,updated_at').eq('user_id',session.user.id).maybeSingle();if(error)throw error;return data}
  async function push(){if(!session)return;const local=state();syncBusy=true;renderStatus();try{const {error}=await (await client()).from('study_states').upsert({user_id:session.user.id,state:local,updated_at:new Date().toISOString()},{onConflict:'user_id'});if(error)throw error;setBaseline(local);msg('本机进度已同步到云端。')}catch(e){msg(`同步失败：${e.message||e}`,true)}finally{syncBusy=false;renderStatus()}}
  async function pull(row=null){if(!session)return;syncBusy=true;renderStatus();try{const r=row||await cloudRow();if(!r?.state){msg('云端还没有学习进度。');return}localStorage.setItem(STORE,JSON.stringify(r.state));setBaseline(r.state);try{db=Object.assign(defaultData(),r.state,{version:3});renderAll()}catch{}msg('已恢复云端进度到这台设备。')}catch(e){msg(`恢复失败：${e.message||e}`,true)}finally{syncBusy=false;renderStatus()}}

  async function smartSync(manual=false){
    if(!session||syncBusy)return;
    syncBusy=true;renderStatus();
    try{
      const local=state(),row=await cloudRow();
      if(!row){syncBusy=false;await push();return}
      const cloud=row.state||{},base=getBaseline();
      if(same(local,cloud)){setBaseline(local);msg('手机与电脑进度已经一致。');return}
      if(base){
        if(same(local,base)&&!same(cloud,base)){syncBusy=false;await pull(row);return}
        if(same(cloud,base)&&!same(local,base)){syncBusy=false;await push();return}
        msg('两台设备都修改过进度，请选择“云端恢复本机”或“本机覆盖云端”。',true);return;
      }
      if(!authored(local)&&authored(cloud)){syncBusy=false;await pull(row);return}
      if(authored(local)&&!authored(cloud)){syncBusy=false;await push();return}
      if(!authored(local)&&!authored(cloud)){setBaseline(cloud);return}
      msg(manual?'检测到本机和云端都有真实记录，请手动选择保留哪一份。':'存在未确认的双端记录，暂未自动覆盖。',true);
    }catch(e){msg(`同步失败：${e.message||e}`,true)}finally{syncBusy=false;renderStatus()}
  }

  function scheduleSync(){if(!session)return;clearTimeout(syncTimer);syncTimer=setTimeout(()=>smartSync(false),1600)}

  function ext(file){const n=String(file?.name||'').toLowerCase();if(n.endsWith('.png'))return'png';if(n.endsWith('.webp'))return'webp';if(n.endsWith('.avif'))return'avif';if(n.endsWith('.heic'))return'heic';if(n.endsWith('.heif'))return'heif';return'jpg'}
  async function uploadPhoto(file,date,caption){
    if(!session)return false;
    const allowed=['image/jpeg','image/png','image/webp','image/avif','image/heic','image/heif',''];
    if(!allowed.includes(file.type)||file.size>10*1024*1024)return false;
    const path=`${session.user.id}/${date||today()}/${crypto.randomUUID()}.${ext(file)}`;const c=await client();
    const {error:up}=await c.storage.from('study-photos').upload(path,file,{contentType:file.type||'image/jpeg',cacheControl:'3600'});if(up)throw up;
    const {error:meta}=await c.from('study_photos').insert({user_id:session.user.id,storage_path:path,taken_on:date||today(),caption:caption||''});if(meta){await c.storage.from('study-photos').remove([path]);throw meta}return true;
  }

  function bindPhotoForm(){const form=document.querySelector('#photoForm');if(!form||form.dataset.cloud2)return;form.dataset.cloud2='1';form.addEventListener('submit',async()=>{if(!session)return;const input=document.querySelector('#photoFiles');const files=[...(input?.files||[])].slice(0,12);if(!files.length)return;const date=document.querySelector('#photoDate')?.value||today(),caption=document.querySelector('#photoCaption')?.value||'';let done=0;msg(`正在上传云端照片 0/${files.length}…`);for(const f of files){try{if(await uploadPhoto(f,date,caption))done++}catch(e){console.warn(e)}msg(`正在上传云端照片 ${done}/${files.length}…`)}msg(`${done}/${files.length} 张照片已进入云端。`,done!==files.length);renderCloudPhotos()},true)}

  async function renderCloudPhotos(){
    const gallery=document.querySelector('#cloudGallery');if(!gallery)return;if(!session){gallery.innerHTML='';return}
    gallery.innerHTML='<div class="cloud2-loading">读取云端照片…</div>';
    try{const c=await client();const {data,error}=await c.from('study_photos').select('id,storage_path,taken_on,caption,created_at').order('created_at',{ascending:false});if(error)throw error;document.querySelector('#cloudPhotoCount').textContent=`${data.length} 张`;document.querySelector('#cloudPhotoHint').textContent='同账号手机与电脑共享，照片本身保存在私有 Storage。';if(!data.length){gallery.innerHTML='<div class="empty">云端还没有照片。现在从任一设备上传即可同步。</div>';return}const cards=[];for(const p of data){const {data:signed}=await c.storage.from('study-photos').createSignedUrl(p.storage_path,3600);if(!signed?.signedUrl)continue;cards.push(`<figure class="cloud2-photo"><img loading="lazy" decoding="async" src="${signed.signedUrl}" alt="学习照片"><figcaption><b>${esc(p.taken_on)}</b><span>${esc(p.caption||'')}</span></figcaption></figure>`)}gallery.innerHTML=cards.join('')||'<div class="empty">照片已保存，但当前浏览器暂时无法预览这些格式。</div>'}catch(e){gallery.innerHTML=`<div class="empty">读取失败：${esc(e.message||e)}</div>`}
  }

  async function migrateLocalPhotos(){
    if(!session){msg('请先登录。',true);return}
    try{const d=await openPhotoDB();const photos=await new Promise((ok,no)=>{const r=d.transaction('photos').objectStore('photos').getAll();r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});d.close();if(!photos.length){msg('这台设备没有本地照片需要迁移。');return}let done=0;for(const p of photos){try{const blob=await fetch(p.data).then(r=>r.blob());const file=new File([blob],`local-${p.id}.${blob.type.includes('png')?'png':'jpg'}`,{type:blob.type});if(await uploadPhoto(file,p.date,p.caption))done++}catch{}msg(`迁移本机照片 ${done}/${photos.length}…`)}msg(`迁移完成：${done}/${photos.length} 张。`);renderCloudPhotos()}catch(e){msg(`迁移失败：${e.message||e}`,true)}
  }

  async function init(){
    inject();
    try{const c=await client();const {data}=await c.auth.getSession();session=data.session;if(session){try{const {data:r}=await c.auth.refreshSession();if(r?.session)session=r.session}catch{}renderStatus();await smartSync(false);await renderCloudPhotos()}else renderStatus();c.auth.onAuthStateChange((_event,s)=>{session=s;renderStatus();if(session){setTimeout(()=>smartSync(false),300);setTimeout(renderCloudPhotos,500)}})}catch(e){msg('云端模块暂不可用，本地学习不受影响。',true)}
    document.addEventListener('submit',scheduleSync,true);document.addEventListener('change',scheduleSync,true);document.addEventListener('click',e=>{if(e.target.closest('[data-route-check],.mastery,#addQ,#routeResetBtn'))scheduleSync()},true);
    setInterval(()=>{if(session&&document.visibilityState==='visible')smartSync(false)},45000);
    document.addEventListener('visibilitychange',()=>{if(session&&document.visibilityState==='visible'){smartSync(false);renderCloudPhotos()}});
  }
  init();
})();