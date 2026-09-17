(() => {
  const URL='https://qmhyeotvbktdilrudwys.supabase.co';
  const KEY='sb_publishable_Yin9aHOMDRYJ0PsuMloVlQ_q8M7iReT';
  const BG_KEY='pec-manager-background-v1';
  const LEGACY_BG='pec-agenda-bg-v1';
  const PREF_KEY='pec-manager-preferences-v1';
  let client=null,user=null,lastBg=null,syncing=false;

  function safeJson(v,fallback={}){try{return JSON.parse(v)||fallback}catch{return fallback}}
  function localPrefs(){return {...{theme:'auto',background_darkness:88,background_blur:0},...safeJson(localStorage.getItem(PREF_KEY),{})}}
  function saveLocalPrefs(p){localStorage.setItem(PREF_KEY,JSON.stringify({...localPrefs(),...p}))}
  function currentBg(){return localStorage.getItem(BG_KEY)||localStorage.getItem(LEGACY_BG)||''}

  function ensureLayers(){
    if(!document.querySelector('#pecManagerGlobalStyle')){
      const s=document.createElement('style');s.id='pecManagerGlobalStyle';s.textContent=`
        html{background:#08090b!important}
        body{background:transparent!important;isolation:isolate}
        body::before{display:none!important}
        #pecManagerGlobalBg,#pecManagerGlobalShade{position:fixed;inset:-18px;pointer-events:none}
        #pecManagerGlobalBg{z-index:-2;background-size:cover;background-position:center;background-repeat:no-repeat;transform:scale(1.02)}
        #pecManagerGlobalShade{z-index:-1;background:rgba(7,8,10,var(--pec-bg-shade,.88));backdrop-filter:blur(var(--pec-bg-blur,0px));-webkit-backdrop-filter:blur(var(--pec-bg-blur,0px))}
        @media print{#pecManagerGlobalBg,#pecManagerGlobalShade{display:none!important}body{background:#fff!important}}
      `;document.head.appendChild(s);
    }
    let bg=document.querySelector('#pecManagerGlobalBg');if(!bg){bg=document.createElement('div');bg.id='pecManagerGlobalBg';document.body.prepend(bg)}
    let shade=document.querySelector('#pecManagerGlobalShade');if(!shade){shade=document.createElement('div');shade.id='pecManagerGlobalShade';document.body.insertBefore(shade,bg.nextSibling)}
    return {bg,shade};
  }

  function apply(bgValue=currentBg(),prefs=localPrefs()){
    const {bg}=ensureLayers();
    bg.style.backgroundImage=bgValue?`url(${JSON.stringify(bgValue)})`:'none';
    document.documentElement.style.setProperty('--pec-bg-shade',String(Math.max(0,Math.min(100,Number(prefs.background_darkness??88)))/100));
    document.documentElement.style.setProperty('--pec-bg-blur',`${Math.max(0,Math.min(30,Number(prefs.background_blur??0)))}px`);
    lastBg=bgValue;
  }

  function getClient(){
    if(client)return client;
    if(!window.supabase?.createClient)return null;
    client=window.supabase.createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    return client;
  }

  async function upsertPrefs(patch={}){
    const c=getClient();if(!c)return false;
    if(!user){const {data}=await c.auth.getSession();user=data?.session?.user||null}
    if(!user)return false;
    const prefs={...localPrefs(),...patch};
    const row={user_id:user.id,background_image:currentBg()||null,theme:prefs.theme||'auto',background_darkness:Number(prefs.background_darkness??88),background_blur:Number(prefs.background_blur??0),updated_at:new Date().toISOString()};
    const {error}=await c.from('user_preferences').upsert(row,{onConflict:'user_id'});
    return !error;
  }

  window.pecManagerSaveBackground=async data=>{
    if(data){localStorage.setItem(BG_KEY,data);localStorage.setItem(LEGACY_BG,data)}else{localStorage.removeItem(BG_KEY);localStorage.removeItem(LEGACY_BG)}
    apply(data||'',localPrefs());
    await upsertPrefs();
  };
  window.pecManagerRemoveBackground=()=>window.pecManagerSaveBackground('');
  window.pecManagerApplyPreferences=patch=>{saveLocalPrefs(patch);apply(currentBg(),localPrefs());return upsertPrefs(patch)};

  async function syncCloud(){
    if(syncing)return;syncing=true;
    try{
      const c=getClient();if(!c)return;
      const {data:s}=await c.auth.getSession();user=s?.session?.user||null;if(!user)return;
      const {data:remote,error}=await c.from('user_preferences').select('*').eq('user_id',user.id).maybeSingle();
      const local=currentBg();
      if(error)return;
      if(remote){
        const prefs={theme:remote.theme||'auto',background_darkness:remote.background_darkness??88,background_blur:remote.background_blur??0};saveLocalPrefs(prefs);
        if(remote.background_image){localStorage.setItem(BG_KEY,remote.background_image);localStorage.setItem(LEGACY_BG,remote.background_image);apply(remote.background_image,prefs)}
        else if(local){await upsertPrefs(prefs);apply(local,prefs)}
        else apply('',prefs);
      }else if(local){await upsertPrefs();apply(local,localPrefs())}
      else await upsertPrefs();
    }finally{syncing=false}
  }

  const legacy=localStorage.getItem(LEGACY_BG);if(legacy&&!localStorage.getItem(BG_KEY))localStorage.setItem(BG_KEY,legacy);
  apply(currentBg(),localPrefs());
  syncCloud();

  // O seletor de imagem da Agenda já existia e grava no localStorage.
  // Este observador transforma qualquer alteração local em preferência da conta.
  setInterval(()=>{
    const now=currentBg();
    if(now!==lastBg){lastBg=now;apply(now,localPrefs());upsertPrefs()}
  },900);
  addEventListener('storage',e=>{if(e.key===BG_KEY||e.key===LEGACY_BG||e.key===PREF_KEY)apply(currentBg(),localPrefs())});
})();