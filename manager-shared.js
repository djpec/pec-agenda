/* Shared account, appearance and durable drafts. No document/print styles. */
(() => {
  'use strict';
  if (window.PM) return;
  const client = window.supabase?.createClient('https://qmhyeotvbktdilrudwys.supabase.co','sb_publishable_Yin9aHOMDRYJ0PsuMloVlQ_q8M7iReT');
  const read=(key,fallback=null)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
  const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}};
  const clone=value=>structuredClone(value);
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const today=()=>{const d=new Date();return new Date(d-d.getTimezoneOffset()*60000).toISOString().slice(0,10)};
  const shiftDate=(date,days)=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(date||''))return '';const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10)};
  const parseTime=value=>{const m=/(?:^|\s)([01]?\d|2[0-3])(?:[:h]([0-5]\d)|h\b)/i.exec(String(value||''));return m?`${m[1].padStart(2,'0')}:${m[2]||'00'}`:''};
  const money=value=>{if(typeof value==='number')return Number.isFinite(value)?value:null;const m=String(value??'').match(/-?\d[\d.,]*/);if(!m)return null;let s=m[0];if(s.includes(','))s=s.replace(/\./g,'').replace(',','.');else if(/^\d{1,3}(\.\d{3})+$/.test(s))s=s.replace(/\./g,'');const n=Number(s);return Number.isFinite(n)?n:null};
  const currency=value=>Number(value||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const dbPromise=new Promise((resolve,reject)=>{const r=indexedDB.open('pec-manager-v12',1);r.onupgradeneeded=()=>r.result.createObjectStore('items');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
  const db=async(action,key,value)=>{const connection=await dbPromise;return new Promise((resolve,reject)=>{const tx=connection.transaction('items',action==='get'?'readonly':'readwrite'),s=tx.objectStore('items');const r=action==='get'?s.get(key):action==='put'?s.put(value,key):s.delete(key);tx.oncomplete=()=>resolve(r.result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)})};
  let user=null;
  const defaults={theme:'auto',background_image:null,background_darkness:88,background_blur:0};
  let prefs={...defaults,...read('pec-manager-preferences-v1',{})};
  const oldTheme=localStorage.getItem('pec-manager-ui-theme')||localStorage.getItem('pec-manager-theme');
  if(oldTheme&&!read('pec-manager-pref-migrated'))prefs.theme=oldTheme==='system'?'auto':oldTheme;
  if(!Object.hasOwn(read('pec-manager-preferences-v1',{}),'background_image'))prefs.background_image=localStorage.getItem('pec-manager-background-v1')||localStorage.getItem('pec-agenda-bg-v1')||null;
  let dirty=read('pec-manager-prefs-pending:local',{}),prefBusy=false;
  const PM=window.PM={client,read,write,clone,esc,today,shiftDate,parseTime,money,currency,db,
    get user(){return user},get scope(){return user?.id||'local'},get preferences(){return clone(prefs)},
    uid:prefix=>`${prefix}-${crypto.randomUUID()}`,
    notify:(name,detail)=>dispatchEvent(new CustomEvent(name,{detail})),
    async session(){const r=await client?.auth.getSession();return r?.data?.session||null}
  };
  const prefKey=()=>`pec-manager-prefs:${PM.scope}`,pendingKey=()=>`pec-manager-prefs-pending:${PM.scope}`;
  function status(message){const el=document.querySelector('#pmAppearanceState');if(el)el.textContent=message}
  function applyPreferences(){
    const mode=['auto','dark','light'].includes(prefs.theme)?prefs.theme:'auto';
    document.documentElement.dataset.pmTheme=mode==='auto'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):mode;
    document.documentElement.dataset.pmMode=mode;
    document.documentElement.style.setProperty('--pm-background',prefs.background_image?`url(${JSON.stringify(prefs.background_image)})`:'none');
    document.documentElement.style.setProperty('--pm-shade',String(Math.min(100,Math.max(0,prefs.background_darkness))/100));
    document.documentElement.style.setProperty('--pm-blur',`${Math.min(30,Math.max(0,prefs.background_blur))}px`);
    write(prefKey(),prefs);write('pec-manager-preferences-v1',prefs);write('pec-manager-pref-migrated',true);
    for(const key of ['pec-manager-background-v1','pec-agenda-bg-v1']){try{if(prefs.background_image)localStorage.setItem(key,prefs.background_image);else localStorage.removeItem(key)}catch{}}
    const theme=document.querySelector('#pmTheme');if(theme)theme.value=mode;
    for(const[id,key]of[['pmDarkness','background_darkness'],['pmBlur','background_blur']]){const input=document.querySelector('#'+id);if(input)input.value=prefs[key]}
  }
  async function syncPreferences(){
    if(prefBusy||!user||!client||!navigator.onLine)return;prefBusy=true;const account=user.id;
    try{
      const{data:remote,error}=await client.from('user_preferences').select('*').eq('user_id',account).maybeSingle();if(error)throw error;if(user?.id!==account)return;
      const patch=clone(dirty);
      if(Object.keys(patch).length){
        const row={...defaults,...remote,...patch,user_id:account,updated_at:new Date().toISOString()};
        const{error:saveError}=await client.from('user_preferences').upsert(row,{onConflict:'user_id'});if(saveError)throw saveError;if(user?.id!==account)return;
        for(const key of Object.keys(patch))if(dirty[key]===patch[key])delete dirty[key];
        write(pendingKey(),dirty);prefs={...row,...dirty};
      }else if(remote)prefs={...defaults,...remote};
      applyPreferences();status(Object.keys(dirty).length?'Alterações aguardando sincronização.':'Aparência sincronizada.');
    }catch{status('Aparência salva neste aparelho; sincronização pendente.')}
    finally{prefBusy=false}
  }
  async function setPreferences(patch){prefs={...prefs,...patch};dirty={...dirty,...patch};write(pendingKey(),dirty);applyPreferences();status(user?'Sincronizando aparência…':'Salvo neste aparelho. Entre na conta para sincronizar.');await syncPreferences()}
  PM.syncPreferences=syncPreferences;PM.setPreferences=setPreferences;
  window.pecManagerSaveBackground=background_image=>setPreferences({background_image:background_image||null});
  window.pecManagerRemoveBackground=()=>window.pecManagerSaveBackground(null);
  window.pecManagerApplyPreferences=setPreferences;
  async function chooseImage(file){
    if(!file||!file.type.startsWith('image/'))return;const url=URL.createObjectURL(file);
    try{const img=new Image();img.src=url;await img.decode();const scale=Math.min(1,1600/Math.max(img.width,img.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);await setPreferences({background_image:canvas.toDataURL('image/jpeg',.8)})}
    catch{status('Não foi possível abrir essa imagem.')}finally{URL.revokeObjectURL(url)}
  }
  function updateHeaderAccount(){
    const link=document.querySelector('#pmAccountLink'),label=document.querySelector('#pmConnection');
    if(!link||!label)return;
    const state=!navigator.onLine?'offline':user?'connected':'local';
    const text=state==='offline'?'Sem conexão':state==='connected'?'Conta conectada':'Entrar na nuvem';
    link.dataset.connection=state;label.textContent=text;
    link.setAttribute('aria-label','Conta e nuvem · '+text);link.title='Conta e nuvem · '+text;
  }
  function shell(){
    document.body.dataset.pmPage=document.querySelector('.editor')?'quote':document.querySelector('.sidebar')?'contract':location.pathname.endsWith('agenda.html')?'agenda':'home';
    const backdrop=document.createElement('div');backdrop.id='pmBackdrop';backdrop.setAttribute('aria-hidden','true');document.body.prepend(backdrop);
    const icons={
      home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>',
      agenda:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18m-14 4h3m4 0h3m-10 3h3"/>',
      quote:'<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Zm0 0v6h6M8 13h8m-8 4h5"/>',
      contract:'<path d="M12 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7m-9 3 1-4 7-7a2.1 2.1 0 0 1 3 3l-7 7-4 1Zm6-9 3 3M8 17h5"/>',
      appearance:'<path d="M3 6h4m4 0h10M3 12h10m4 0h4M3 18h4m4 0h10"/><circle cx="9" cy="6" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="9" cy="18" r="2"/>',
      cloud:'<path d="M6 19a5 5 0 0 1-1-9.9A7 7 0 0 1 18.5 8a5.5 5.5 0 0 1-.5 11Z"/>'
    };
    const icon=name=>`<svg class="pm-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${icons[name]}</svg>`;
    const pages=[['home','./','Início'],['agenda','./agenda.html','Agenda'],['quote','./orcamentos.html','Orçamentos'],['contract','./contratos.html','Contratos']];
    const header=document.createElement('header');header.id='pmHeader';header.className='pm-header';
    header.innerHTML=`<div class="pm-header-inner"><a class="pm-brand" href="./" aria-label="pec Manager · Início"><span class="pm-brand-logo" aria-hidden="true">pec</span><span class="pm-brand-copy"><b>pec <span>Manager</span></b><small>Sua central de eventos</small></span></a><nav class="pm-nav" aria-label="Navegação principal">${pages.map(([page,href,label])=>`<a href="${href}" data-pm-route="${page}"${page===document.body.dataset.pmPage?' aria-current="page"':''}>${icon(page)}<span>${label}</span></a>`).join('')}</nav><div class="pm-header-actions"><button class="pm-header-action pm-appearance" type="button" id="pmAppearance" aria-label="Aparência" aria-controls="pmAppearanceDialog" aria-haspopup="dialog" title="Aparência">${icon('appearance')}<span class="pm-action-label">Aparência</span></button><a class="pm-header-action pm-account" id="pmAccountLink" href="./agenda.html?account=1"><span class="pm-account-icon">${icon('cloud')}<i class="pm-connection-dot" aria-hidden="true"></i></span><span class="pm-account-copy"><span>Conta &amp; nuvem</span><small id="pmConnection">Entrar na nuvem</small></span></a></div></div>`;
    document.body.prepend(header);
    document.querySelector('#pmAccountLink').addEventListener('click',event=>{
      if(document.body.dataset.pmPage==='agenda'&&typeof window.openAccount==='function'){event.preventDefault();window.openAccount()}
    });
    updateHeaderAccount();
    addEventListener('pm:account',updateHeaderAccount);
    addEventListener('online',updateHeaderAccount);addEventListener('offline',updateHeaderAccount);
    const dialog=document.createElement('dialog');dialog.id='pmAppearanceDialog';dialog.className='pm-dialog';
    dialog.innerHTML='<form method="dialog"><div class="pm-dialog-head"><h2>Aparência</h2><button aria-label="Fechar" value="close">×</button></div></form><div class="pm-dialog-body"><label>Tema<select id="pmTheme"><option value="auto">Automático</option><option value="light">Claro</option><option value="dark">Escuro</option></select></label><label>Imagem de fundo<input id="pmBackgroundFile" type="file" accept="image/*"></label><div class="pm-actions"><button type="button" id="pmRemoveBackground">Remover fundo</button></div><label>Intensidade da sobreposição<input id="pmDarkness" type="range" min="0" max="100" step="1"></label><label>Desfoque<input id="pmBlur" type="range" min="0" max="30" step="1"></label><p id="pmAppearanceState" role="status">A aparência é compartilhada entre os módulos e dispositivos da sua conta.</p><a href="./agenda.html?account=1">Minha conta</a></div>';
    document.body.append(dialog);document.querySelector('#pmAppearance').onclick=()=>dialog.showModal();
    document.querySelector('#pmTheme').onchange=e=>setPreferences({theme:e.target.value});
    document.querySelector('#pmBackgroundFile').onchange=e=>chooseImage(e.target.files?.[0]);
    document.querySelector('#pmRemoveBackground').onclick=()=>setPreferences({background_image:null});
    document.querySelector('#pmDarkness').onchange=e=>setPreferences({background_darkness:Number(e.target.value)});
    document.querySelector('#pmBlur').onchange=e=>setPreferences({background_blur:Number(e.target.value)});applyPreferences();
  }
  let resolveReady;PM.ready=new Promise(resolve=>resolveReady=resolve);
  async function accountChanged(session){
    const previous=user?.id||null,next=session?.user?.id||null;user=session?.user||null;
    if(previous!==next){const stored=read(prefKey());if(stored)prefs={...defaults,...stored};else if(previous)prefs={...defaults};dirty=read(pendingKey(),{});applyPreferences();PM.notify('pm:account',{user})}
    await syncPreferences();resolveReady();
  }
  shell();(async()=>{try{await accountChanged(await PM.session())}catch{resolveReady()}})();
  client?.auth.onAuthStateChange((event,session)=>{setTimeout(()=>accountChanged(session),0)});
  addEventListener('online',()=>{syncPreferences();PM.notify('pm:refresh')});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){syncPreferences();PM.notify('pm:refresh')}});
  addEventListener('storage',event=>{if(event.key===prefKey()){prefs={...defaults,...read(prefKey(),{})};dirty=read(pendingKey(),{});applyPreferences()}});
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change',applyPreferences);
  setInterval(()=>{if(!document.hidden){syncPreferences();PM.notify('pm:refresh')}},20000);
  if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('./sw.js'));
})();
