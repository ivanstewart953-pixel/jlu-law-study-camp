/* Offline-first cloud sync. Supabase is loaded only when needed. */
(function(){
  const SUPABASE_URL='https://lthqhdeuwbsbazvftnpr.supabase.co';
  const SUPABASE_KEY='sb_publishable_6lE-bKpwU-VjejE6gpCcew_c6PW83mI';
  const PROJECT_REF='lthqhdeuwbsbazvftnpr';
  const LAST_SNAPSHOT='jluCloudLastSnapshot';
  const LAST_SYNC_AT='jluCloudLastSyncAt';
  let client=null;
  let session=null;
  let loadingClient=null;
  let syncTimer=null;
  let syncBusy=false;

  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));

  function hasSavedSession(){
    return Object.keys(localStorage).some(k=>k.includes(`sb-${PROJECT_REF}-auth-token`));
  }

  async function getClient(){
    if(client)return client;
    if(loadingClient)return loadingClient;
    loadingClient=import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm')
      .then(mod=>{
        client=mod.createClient(SUPABASE_URL,SUPABASE_KEY,{
          auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
        });
        return client;
      })
      .catch(err=>{loadingClient=null;throw err});
    return loadingClient;
  }

  function injectUi(){
    const backup=document.querySelector('#backup');
    if(!backup||document.querySelector('#cloudPanel'))return;
    const title=backup.querySelector('.page-title');
    const panel=document.createElement('article');
    panel.id='cloudPanel';
    panel.className='panel cloud-panel';
    panel.innerHTML=`
      <div class="cloud-head">
        <div>
          <p class="micro">CLOUD SAVE</p>
          <h3>跨设备存档</h3>
          <p class="muted">本地优先。未登录、断网或云端暂不可用时，打卡和题库仍照常工作。</p>
        </div>
        <span class="cloud-status local" id="cloudStatus">LOCAL</span>
      </div>
      <div id="cloudSignedOut" class="cloud-auth">
        <div class="cloud-auth-fields">
          <label>邮箱<input id="cloudEmail" type="email" autocomplete="email" placeholder="你的邮箱"></label>
          <label>密码<input id="cloudPassword" type="password" autocomplete="current-password" minlength="8" placeholder="至少 8 位"></label>
        </div>
        <div class="row">
          <button class="btn" id="cloudLogin" type="button">登录云存档</button>
          <button class="btn ghost" id="cloudSignup" type="button">创建账号</button>
        </div>
        <p class="cloud-message" id="cloudAuthMessage">首次注册如开启邮件确认，需要先到邮箱完成验证。</p>
      </div>
      <div id="cloudSignedIn" class="cloud-signed" hidden>
        <div class="cloud-user-row">
          <div><span class="muted">当前存档</span><strong id="cloudUser">--</strong></div>
          <div><span class="muted">最近同步</span><strong id="cloudLastSync">尚未同步</strong></div>
        </div>
        <div class="cloud-actions">
          <button class="btn" id="cloudSyncNow" type="button">同步现在</button>
          <button class="btn ghost" id="cloudPush" type="button">本机覆盖云端</button>
          <button class="btn ghost" id="cloudPull" type="button">云端恢复到本机</button>
          <button class="btn ghost" id="cloudMigratePhotos" type="button">迁移本机照片</button>
          <button class="btn danger" id="cloudLogout" type="button">退出登录</button>
        </div>
        <p class="cloud-message" id="cloudMessage">登录后会在操作完成后延迟同步，避免每次输入都请求网络。</p>
      </div>`;
    title.after(panel);

    const photos=document.querySelector('#photos');
    if(photos&&!document.querySelector('#cloudGalleryWrap')){
      const wrap=document.createElement('article');
      wrap.id='cloudGalleryWrap';
      wrap.className='panel cloud-gallery-wrap';
      wrap.innerHTML=`<div class="panel-head"><div><p class="micro">CLOUD ALBUM</p><h3>云端照片墙</h3></div><span class="pill" id="cloudPhotoCount">未登录</span></div><p class="muted" id="cloudPhotoHint">登录后，这里会显示手机和电脑共享的私有照片。</p><div class="cloud-gallery" id="cloudGallery"></div>`;
      photos.appendChild(wrap);
    }

    const xp=document.querySelector('.xp-strip');
    if(xp&&!document.querySelector('#heroCloudState')){
      const badge=document.createElement('span');
      badge.id='heroCloudState';badge.className='hero-cloud-state';badge.textContent='LOCAL';badge.title='当前使用本地存档';xp.appendChild(badge);
    }
    bindUi();
  }

  function setStatus(kind,text){
    const el=document.querySelector('#cloudStatus');
    const hero=document.querySelector('#heroCloudState');
    if(el){el.className=`cloud-status ${kind}`;el.textContent=text}
    if(hero){hero.className=`hero-cloud-state ${kind}`;hero.textContent=text;hero.title=text==='CLOUD'?'已连接云存档':'当前使用本地存档'}
  }

  function message(text,error=false){
    const el=document.querySelector('#cloudMessage')||document.querySelector('#cloudAuthMessage');
    if(el){el.textContent=text;el.classList.toggle('error',error)}
  }

  function localState(){
    try{return JSON.parse(localStorage.getItem('jluCampV3')||'{}')}catch{return {}}
  }
  function stateString(state){return JSON.stringify(state||{})}
  function meaningful(state){
    return Boolean(Object.keys(state?.checkins||{}).length || (state?.mocks||[]).length || Object.keys(state?.mastery||{}).length || Object.keys(state?.dailyRoutes||{}).length);
  }
  function setLastSnapshot(state){localStorage.setItem(LAST_SNAPSHOT,stateString(state));localStorage.setItem(LAST_SYNC_AT,new Date().toISOString());updateLastSync()}
  function updateLastSync(){
    const el=document.querySelector('#cloudLastSync');if(!el)return;
    const raw=localStorage.getItem(LAST_SYNC_AT);el.textContent=raw?new Date(raw).toLocaleString():'尚未同步';
  }

  async function refreshSession(){
    try{
      const sb=await getClient();
      const {data,error}=await sb.auth.getSession();
      if(error)throw error;
      session=data.session;
      renderAuth();
      return session;
    }catch(err){setStatus('local','LOCAL');message('云端暂不可用，本地模式不受影响。',true);return null}
  }

  function renderAuth(){
    const out=document.querySelector('#cloudSignedOut'),inside=document.querySelector('#cloudSignedIn');
    if(!out||!inside)return;
    out.hidden=Boolean(session);inside.hidden=!session;
    if(session){
      document.querySelector('#cloudUser').textContent=session.user.email||session.user.id;
      setStatus('cloud','CLOUD');updateLastSync();
      renderCloudPhotos();
    }else{
      setStatus('local','LOCAL');
      const count=document.querySelector('#cloudPhotoCount');if(count)count.textContent='未登录';
      const gallery=document.querySelector('#cloudGallery');if(gallery)gallery.innerHTML='';
    }
  }

  async function fetchCloudState(){
    const sb=await getClient();
    const {data,error}=await sb.from('study_states').select('state,updated_at').eq('user_id',session.user.id).maybeSingle();
    if(error)throw error;return data;
  }
  async function pushState(state=localState()){
    const sb=await getClient();
    const {error}=await sb.from('study_states').upsert({user_id:session.user.id,state,updated_at:new Date().toISOString()},{onConflict:'user_id'});
    if(error)throw error;setLastSnapshot(state);message('本机存档已写入云端。');return state;
  }
  async function pullState(cloudRow=null){
    const row=cloudRow||await fetchCloudState();
    if(!row?.state){message('云端还没有学习存档。');return null}
    localStorage.setItem('jluCampV3',JSON.stringify(row.state));
    setLastSnapshot(row.state);
    try{db=Object.assign(defaultData(),row.state,{version:3});renderAll()}catch{}
    message('云端存档已恢复到本机。');return row.state;
  }

  async function smartSync(){
    if(!session||syncBusy)return;
    syncBusy=true;setStatus('syncing','SYNC');
    try{
      const local=localState();
      const row=await fetchCloudState();
      if(!row){await pushState(local);return}
      const cloud=row.state||{};
      const last=localStorage.getItem(LAST_SNAPSHOT);
      const l=stateString(local),c=stateString(cloud);
      if(l===c){setLastSnapshot(local);message('本机与云端已经一致。');return}
      if(last&&l===last){await pullState(row);return}
      if(last&&c===last){await pushState(local);return}
      if(!last){
        if(meaningful(local)&&!meaningful(cloud)){await pushState(local);return}
        if(!meaningful(local)&&meaningful(cloud)){await pullState(row);return}
      }
      message('检测到两台设备都改过存档。请手动选择“本机覆盖云端”或“云端恢复到本机”。',true);
    }catch(err){message(`同步失败：${err.message||err}`,true)}
    finally{syncBusy=false;setStatus(session?'cloud':'local',session?'CLOUD':'LOCAL')}
  }

  function scheduleSync(){
    if(!session)return;
    clearTimeout(syncTimer);syncTimer=setTimeout(()=>smartSync(),4500);
  }

  async function signup(){
    const email=document.querySelector('#cloudEmail').value.trim(),password=document.querySelector('#cloudPassword').value;
    if(!email||password.length<8){message('请输入有效邮箱和至少 8 位密码。',true);return}
    try{
      setStatus('syncing','WAIT');const sb=await getClient();
      const {data,error}=await sb.auth.signUp({email,password});if(error)throw error;
      session=data.session;
      if(session){renderAuth();await smartSync()}else{message('账号已创建。请到邮箱完成确认，然后回来登录。')}
    }catch(err){message(`注册失败：${err.message||err}`,true)}finally{if(!session)setStatus('local','LOCAL')}
  }
  async function login(){
    const email=document.querySelector('#cloudEmail').value.trim(),password=document.querySelector('#cloudPassword').value;
    if(!email||!password){message('请输入邮箱和密码。',true);return}
    try{
      setStatus('syncing','WAIT');const sb=await getClient();
      const {data,error}=await sb.auth.signInWithPassword({email,password});if(error)throw error;
      session=data.session;renderAuth();await smartSync();
    }catch(err){setStatus('local','LOCAL');message(`登录失败：${err.message||err}`,true)}
  }
  async function logout(){
    try{const sb=await getClient();await sb.auth.signOut()}catch{}
    session=null;localStorage.removeItem(LAST_SNAPSHOT);renderAuth();message('已退出云存档，本地数据仍保留。');
  }

  function ext(name,type){
    const byName=String(name||'').split('.').pop().toLowerCase();
    if(['jpg','jpeg','png','webp','avif'].includes(byName))return byName==='jpeg'?'jpg':byName;
    return type==='image/png'?'png':type==='image/webp'?'webp':type==='image/avif'?'avif':'jpg';
  }

  async function uploadCloudPhoto(file,date,caption){
    if(!session)return;
    const sb=await getClient();
    const path=`${session.user.id}/${date||today()}/${crypto.randomUUID()}.${ext(file.name,file.type)}`;
    const {error:upErr}=await sb.storage.from('study-photos').upload(path,file,{contentType:file.type,cacheControl:'3600',upsert:false});
    if(upErr)throw upErr;
    const {error:metaErr}=await sb.from('study_photos').insert({user_id:session.user.id,storage_path:path,taken_on:date||today(),caption:caption||''});
    if(metaErr){await sb.storage.from('study-photos').remove([path]);throw metaErr}
  }

  async function renderCloudPhotos(){
    const gallery=document.querySelector('#cloudGallery'),count=document.querySelector('#cloudPhotoCount'),hint=document.querySelector('#cloudPhotoHint');
    if(!gallery||!session)return;
    gallery.innerHTML='<div class="cloud-loading">读取云端照片…</div>';
    try{
      const sb=await getClient();
      const {data,error}=await sb.from('study_photos').select('id,storage_path,taken_on,caption,created_at').order('created_at',{ascending:false});
      if(error)throw error;
      count.textContent=`${data.length} 张`;hint.textContent='私有云端相册，只在登录后生成临时访问地址。';
      if(!data.length){gallery.innerHTML='<div class="empty">云端还没有照片。手机或电脑上传后都会出现在这里。</div>';return}
      const cards=[];
      for(const photo of data){
        const {data:signed}=await sb.storage.from('study-photos').createSignedUrl(photo.storage_path,3600);
        if(!signed?.signedUrl)continue;
        cards.push(`<figure class="cloud-photo"><img loading="lazy" decoding="async" src="${signed.signedUrl}" alt="云端学习照片"><figcaption><b>${esc(photo.taken_on)}</b><span>${esc(photo.caption||'')}</span></figcaption></figure>`);
      }
      gallery.innerHTML=cards.join('')||'<div class="empty">照片暂时无法生成预览。</div>';
    }catch(err){gallery.innerHTML=`<div class="empty">云端照片读取失败：${esc(err.message||err)}</div>`}
  }

  async function migrateLocalPhotos(){
    if(!session){message('请先登录。',true);return}
    const btn=document.querySelector('#cloudMigratePhotos');btn.disabled=true;btn.textContent='迁移中…';
    try{
      const d=await openPhotoDB();
      const photos=await new Promise((resolve,reject)=>{const tx=d.transaction('photos'),r=tx.objectStore('photos').getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});d.close();
      if(!photos.length){message('本机照片墙还是空的。');return}
      let done=0;
      for(const p of photos){
        const blob=await fetch(p.data).then(r=>r.blob());
        const file=new File([blob],`local-${p.id}.${ext('',blob.type)}`,{type:blob.type});
        try{await uploadCloudPhoto(file,p.date,p.caption);done++;message(`正在迁移 ${done}/${photos.length}…`)}catch{}
        await sleep(80);
      }
      message(`迁移完成：${done}/${photos.length} 张已进入云端。`);await renderCloudPhotos();
    }catch(err){message(`迁移失败：${err.message||err}`,true)}finally{btn.disabled=false;btn.textContent='迁移本机照片'}
  }

  function bindPhotoSync(){
    const form=document.querySelector('#photoForm');if(!form||form.dataset.cloudBound)return;form.dataset.cloudBound='1';
    form.addEventListener('submit',async()=>{
      if(!session)return;
      const files=[...document.querySelector('#photoFiles').files].slice(0,12);
      const date=document.querySelector('#photoDate').value||today(),caption=document.querySelector('#photoCaption').value;
      if(!files.length)return;
      message(`正在同步 ${files.length} 张照片到云端…`);
      let done=0;
      for(const file of files){
        if(file.size>10*1024*1024)continue;
        try{await uploadCloudPhoto(file,date,caption);done++}catch(err){console.warn('cloud photo upload failed',err)}
      }
      message(`${done}/${files.length} 张照片已同步到云端。`);renderCloudPhotos();
    },true);
  }

  function bindUi(){
    document.querySelector('#cloudLogin').onclick=login;
    document.querySelector('#cloudSignup').onclick=signup;
    document.querySelector('#cloudSyncNow').onclick=smartSync;
    document.querySelector('#cloudPush').onclick=async()=>{if(confirm('确定用本机学习数据覆盖云端存档？')){try{await pushState()}catch(err){message(err.message,true)}}};
    document.querySelector('#cloudPull').onclick=async()=>{if(confirm('确定用云端学习数据覆盖本机存档？本机未同步改动会丢失。')){try{await pullState()}catch(err){message(err.message,true)}}};
    document.querySelector('#cloudLogout').onclick=logout;
    document.querySelector('#cloudMigratePhotos').onclick=migrateLocalPhotos;
    bindPhotoSync();
    document.addEventListener('submit',e=>{if(e.target.id!=='cloudPanel')scheduleSync()},true);
    document.addEventListener('change',e=>{if(e.target.matches('[data-route-check],#range'))scheduleSync()},true);
    document.addEventListener('click',e=>{if(e.target.matches('.mastery,#addQ,[data-route-delete],#routeResetBtn'))scheduleSync()},true);
    window.addEventListener('pagehide',()=>{if(session)smartSync()});
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&session)smartSync()});
  }

  async function initSavedSession(){
    if(!hasSavedSession())return;
    const s=await refreshSession();if(s){await smartSync();setInterval(()=>{if(document.visibilityState==='visible')smartSync()},60000)}
  }

  injectUi();
  if(hasSavedSession()){
    if('requestIdleCallback' in window)requestIdleCallback(initSavedSession,{timeout:1800});
    else setTimeout(initSavedSession,900);
  }
})();