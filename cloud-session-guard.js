/* Refresh/validate a persisted Supabase session before cloud-sync starts. */
(async function(){
  const SUPABASE_URL='https://lthqhdeuwbsbazvftnpr.supabase.co';
  const SUPABASE_KEY='sb_publishable_6lE-bKpwU-VjejE6gpCcew_c6PW83mI';
  const PROJECT_REF='lthqhdeuwbsbazvftnpr';

  function hasSavedSession(){
    return Object.keys(localStorage).some(k=>k.includes(`sb-${PROJECT_REF}-auth-token`));
  }

  function loadCloudSync(){
    if(document.querySelector('script[data-jlu-cloud-sync]'))return;
    const script=document.createElement('script');
    script.src='./cloud-sync.js';
    script.async=true;
    script.setAttribute('data-jlu-cloud-sync','');
    document.body.appendChild(script);
  }

  if(!hasSavedSession()){
    loadCloudSync();
    return;
  }

  try{
    const mod=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    const sb=mod.createClient(SUPABASE_URL,SUPABASE_KEY,{
      auth:{persistSession:true,autoRefreshToken:false,detectSessionInUrl:false}
    });

    const {data:sessionData,error:sessionError}=await sb.auth.getSession();
    if(sessionError)throw sessionError;

    if(sessionData.session){
      const {data:refreshData,error:refreshError}=await sb.auth.refreshSession();
      if(refreshError)throw refreshError;
      if(!refreshData.session)throw new Error('Cloud session refresh returned no session');
    }
  }catch(err){
    console.warn('Cloud session guard reset an invalid local session:',err);
    try{
      Object.keys(localStorage)
        .filter(k=>k.includes(`sb-${PROJECT_REF}-auth-token`))
        .forEach(k=>localStorage.removeItem(k));
    }catch{}
  }finally{
    loadCloudSync();
  }
})();
