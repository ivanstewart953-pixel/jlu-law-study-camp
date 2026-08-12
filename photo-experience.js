/* Photo wall V2: device cache for private cloud photos + full-screen lightbox. */
(function(){
  const DB_NAME='jluCloudPhotoCacheV2';
  const DB_VERSION=1;
  const STORE='photos';
  const PROJECT_REF='lthqhdeuwbsbazvftnpr';
  const MAX_CACHE_ITEMS=80;
  const MAX_CACHE_BYTES=250*1024*1024;
  let dbPromise=null;
  let observer=null;
  let activeObjectUrls=new Map();
  let lightboxItems=[];
  let lightboxIndex=0;
  let touchStartX=0;

  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));

  function openCacheDB(){
    if(dbPromise)return dbPromise;
    dbPromise=new Promise((resolve,reject)=>{
      const req=indexedDB.open(DB_NAME,DB_VERSION);
      req.onupgradeneeded=()=>{
        const db=req.result;
        if(!db.objectStoreNames.contains(STORE)){
          const store=db.createObjectStore(STORE,{keyPath:'path'});
          store.createIndex('cachedAt','cachedAt');
        }
      };
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error);
    });
    return dbPromise;
  }

  async function cacheGet(path){
    try{
      const db=await openCacheDB();
      return await new Promise((resolve,reject)=>{
        const req=db.transaction(STORE,'readonly').objectStore(STORE).get(path);
        req.onsuccess=()=>resolve(req.result||null);
        req.onerror=()=>reject(req.error);
      });
    }catch{return null}
  }

  async function cacheAll(){
    try{
      const db=await openCacheDB();
      return await new Promise((resolve,reject)=>{
        const req=db.transaction(STORE,'readonly').objectStore(STORE).getAll();
        req.onsuccess=()=>resolve(req.result||[]);
        req.onerror=()=>reject(req.error);
      });
    }catch{return []}
  }

  async function cachePut(row){
    try{
      const db=await openCacheDB();
      await new Promise((resolve,reject)=>{
        const req=db.transaction(STORE,'readwrite').objectStore(STORE).put(row);
        req.onsuccess=()=>resolve();req.onerror=()=>reject(req.error);
      });
      pruneCache();
      return true;
    }catch{return false}
  }

  async function cacheDelete(path){
    try{
      const db=await openCacheDB();
      await new Promise((resolve,reject)=>{
        const req=db.transaction(STORE,'readwrite').objectStore(STORE).delete(path);
        req.onsuccess=()=>resolve();req.onerror=()=>reject(req.error);
      });
    }catch{}
  }

  async function pruneCache(){
    const rows=(await cacheAll()).sort((a,b)=>(b.cachedAt||0)-(a.cachedAt||0));
    let bytes=0;
    for(let i=0;i<rows.length;i++){
      const size=Number(rows[i].size||rows[i].blob?.size||0);
      bytes+=size;
      if(i>=MAX_CACHE_ITEMS||bytes>MAX_CACHE_BYTES)await cacheDelete(rows[i].path);
    }
  }

  function currentUserId(){
    try{
      const key=Object.keys(localStorage).find(k=>k.includes(`sb-${PROJECT_REF}-auth-token`));
      if(!key)return null;
      const raw=JSON.parse(localStorage.getItem(key)||'null');
      return raw?.user?.id||raw?.currentSession?.user?.id||raw?.session?.user?.id||null;
    }catch{return null}
  }

  function stablePath(src){
    try{
      if(!src||src.startsWith('blob:')||src.startsWith('data:'))return null;
      const url=new URL(src,location.href);
      const markers=['/storage/v1/object/sign/study-photos/','/storage/v1/object/authenticated/study-photos/','/storage/v1/object/public/study-photos/'];
      const marker=markers.find(m=>url.pathname.includes(m));
      if(!marker)return null;
      return decodeURIComponent(url.pathname.split(marker)[1]||'');
    }catch{return null}
  }

  function objectUrl(path,blob){
    if(activeObjectUrls.has(path))return activeObjectUrls.get(path);
    const url=URL.createObjectURL(blob);activeObjectUrls.set(path,url);return url;
  }

  function cloudMeta(figure,path,blob=null){
    return {
      path,
      userId:path.split('/')[0]||'',
      date:figure?.querySelector('figcaption b')?.textContent?.trim()||'',
      caption:figure?.querySelector('figcaption span')?.textContent?.trim()||'',
      blob,
      size:blob?.size||0,
      cachedAt:Date.now()
    };
  }

  function photoViewActive(){return document.querySelector('#photos.view.active')!==null}

  async function cacheCloudImage(img){
    if(!img||img.dataset.photoCacheBusy==='1')return;
    const remote=img.dataset.remoteSrc||img.getAttribute('src')||'';
    const path=img.dataset.cachePath||stablePath(remote);
    if(!path)return;
    img.dataset.cachePath=path;
    img.dataset.remoteSrc=remote;
    img.dataset.photoCacheBusy='1';
    const figure=img.closest('.cloud2-photo');
    const cached=await cacheGet(path);
    if(cached?.blob){
      img.src=objectUrl(path,cached.blob);
      img.dataset.cached='1';
      img.dataset.photoCacheBusy='0';
      updateCacheHint();
      return;
    }
    img.dataset.photoCacheBusy='0';
    if(!photoViewActive())return;
    img.dataset.photoCacheBusy='1';
    try{
      const res=await fetch(remote,{cache:'force-cache',credentials:'omit'});
      if(!res.ok)throw new Error(`HTTP ${res.status}`);
      const blob=await res.blob();
      if(!blob.size)throw new Error('empty image');
      const ok=await cachePut(cloudMeta(figure,path,blob));
      if(ok){img.src=objectUrl(path,blob);img.dataset.cached='1';updateCacheHint()}
    }catch(e){console.warn('photo cache skipped',e)}
    finally{img.dataset.photoCacheBusy='0'}
  }

  async function processCloudGallery(){
    const gallery=document.querySelector('#cloudGallery');if(!gallery)return;
    const images=[...gallery.querySelectorAll('.cloud2-photo img')];
    for(const img of images)cacheCloudImage(img);
  }

  async function hydrateCachedGallery(){
    const gallery=document.querySelector('#cloudGallery');if(!gallery)return;
    const uid=currentUserId();if(!uid)return;
    const rows=(await cacheAll()).filter(r=>r.userId===uid&&r.blob).sort((a,b)=>(b.cachedAt||0)-(a.cachedAt||0));
    if(!rows.length)return;
    const figures=gallery.querySelectorAll('.cloud2-photo');
    if(figures.length){processCloudGallery();return}
    gallery.innerHTML=rows.map(row=>`<figure class="cloud2-photo cached-cloud-photo" data-cache-path="${esc(row.path)}"><img loading="eager" decoding="async" data-cache-path="${esc(row.path)}" data-cached="1" src="${objectUrl(row.path,row.blob)}" alt="缓存的学习照片"><figcaption><b>${esc(row.date||'')}</b><span>${esc(row.caption||'')}</span></figcaption></figure>`).join('');
    const count=document.querySelector('#cloudPhotoCount');if(count)count.textContent=`${rows.length} 张缓存`;
    updateCacheHint(rows.length);
  }

  async function updateCacheHint(knownCount=null){
    const uid=currentUserId();if(!uid)return;
    const count=knownCount??(await cacheAll()).filter(r=>r.userId===uid&&r.blob).length;
    const hint=document.querySelector('#cloudPhotoHint');
    if(hint&&count)hint.textContent=`本机已缓存 ${count} 张，进入相册优先秒开；云端更新会在后台补齐。`;
  }

  function observeCloudGallery(){
    const gallery=document.querySelector('#cloudGallery');if(!gallery||observer)return;
    observer=new MutationObserver(()=>{if(photoViewActive())setTimeout(processCloudGallery,0)});
    observer.observe(gallery,{childList:true,subtree:true});
  }

  function ensureLightbox(){
    if(document.querySelector('#photoLightbox'))return;
    document.body.insertAdjacentHTML('beforeend',`
      <div class="photo-lightbox" id="photoLightbox" hidden role="dialog" aria-modal="true" aria-label="照片大图">
        <button class="photo-lightbox-close" type="button" aria-label="关闭">×</button>
        <button class="photo-lightbox-nav prev" type="button" aria-label="上一张">‹</button>
        <figure class="photo-lightbox-stage">
          <img id="photoLightboxImage" alt="照片大图">
          <figcaption><b id="photoLightboxDate"></b><span id="photoLightboxCaption"></span><small id="photoLightboxCount"></small></figcaption>
        </figure>
        <button class="photo-lightbox-nav next" type="button" aria-label="下一张">›</button>
      </div>`);
    const box=document.querySelector('#photoLightbox');
    box.querySelector('.photo-lightbox-close').onclick=closeLightbox;
    box.querySelector('.photo-lightbox-nav.prev').onclick=e=>{e.stopPropagation();moveLightbox(-1)};
    box.querySelector('.photo-lightbox-nav.next').onclick=e=>{e.stopPropagation();moveLightbox(1)};
    box.addEventListener('click',e=>{if(e.target===box)closeLightbox()});
    box.addEventListener('touchstart',e=>{touchStartX=e.changedTouches[0]?.clientX||0},{passive:true});
    box.addEventListener('touchend',e=>{const dx=(e.changedTouches[0]?.clientX||0)-touchStartX;if(Math.abs(dx)>55)moveLightbox(dx>0?-1:1)},{passive:true});
  }

  function collectLightboxItems(){
    const nodes=[...document.querySelectorAll('#gallery .photo img, #cloudGallery .cloud2-photo img')];
    return nodes.map(img=>{
      const local=img.closest('.photo');const cloud=img.closest('.cloud2-photo');
      return {
        node:img,
        src:img.currentSrc||img.src,
        date:local?.querySelector('.caption b')?.textContent?.trim()||cloud?.querySelector('figcaption b')?.textContent?.trim()||'',
        caption:local?.querySelector('.caption')?.textContent?.replace(local?.querySelector('.caption b')?.textContent||'','')?.trim()||cloud?.querySelector('figcaption span')?.textContent?.trim()||''
      };
    });
  }

  function openLightbox(img){
    ensureLightbox();
    lightboxItems=collectLightboxItems();
    lightboxIndex=Math.max(0,lightboxItems.findIndex(x=>x.node===img));
    const box=document.querySelector('#photoLightbox');box.hidden=false;document.body.classList.add('photo-lightbox-open');renderLightbox();
  }

  function renderLightbox(){
    if(!lightboxItems.length)return closeLightbox();
    const item=lightboxItems[lightboxIndex];
    const image=document.querySelector('#photoLightboxImage');image.src=item.src;
    document.querySelector('#photoLightboxDate').textContent=item.date||'';
    document.querySelector('#photoLightboxCaption').textContent=item.caption||'';
    document.querySelector('#photoLightboxCount').textContent=`${lightboxIndex+1} / ${lightboxItems.length}`;
    const showNav=lightboxItems.length>1;
    document.querySelector('.photo-lightbox-nav.prev').hidden=!showNav;
    document.querySelector('.photo-lightbox-nav.next').hidden=!showNav;
  }

  function moveLightbox(delta){
    if(!lightboxItems.length)return;
    lightboxIndex=(lightboxIndex+delta+lightboxItems.length)%lightboxItems.length;renderLightbox();
  }

  function closeLightbox(){
    const box=document.querySelector('#photoLightbox');if(box)box.hidden=true;document.body.classList.remove('photo-lightbox-open');
    const image=document.querySelector('#photoLightboxImage');if(image)image.removeAttribute('src');
  }

  function bindGlobal(){
    document.addEventListener('click',e=>{
      const nav=e.target.closest('button[data-view="photos"]');
      if(nav)setTimeout(()=>{observeCloudGallery();hydrateCachedGallery();processCloudGallery()},80);
      const img=e.target.closest('#gallery .photo img, #cloudGallery .cloud2-photo img');
      if(img){e.preventDefault();openLightbox(img)}
    });
    document.addEventListener('keydown',e=>{
      const box=document.querySelector('#photoLightbox');if(!box||box.hidden)return;
      if(e.key==='Escape')closeLightbox();
      if(e.key==='ArrowLeft')moveLightbox(-1);
      if(e.key==='ArrowRight')moveLightbox(1);
    });
    window.addEventListener('beforeunload',()=>{for(const url of activeObjectUrls.values())URL.revokeObjectURL(url);activeObjectUrls.clear()});
  }

  ensureLightbox();bindGlobal();
  if(photoViewActive())setTimeout(()=>{observeCloudGallery();hydrateCachedGallery();processCloudGallery()},100);
})();
