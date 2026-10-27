/* Protected workspaces load only after Auth and the server allowlist agree. */
(async()=>{
 'use strict';const root=document.documentElement,A=window.ArtistAuth;let account=null,busy=false,started=false,leaving=false,generation=0;
 function lock(){root.dataset.wsAccess='pending'}
 function leave(reason){leaving=true;generation++;lock();location.replace(A.loginURL(reason))}
 async function check(){
  if(busy||leaving)return;busy=true;const run=++generation;lock();
  try{const result=await A.verify();if(leaving||run!==generation)return;if(!result.allowed){leave(result.reason);return}if(account&&account!==result.user.id){leave('restricted');return}account=result.user.id;root.dataset.wsAccess='granted';
   if(!started){started=true;const scripts=JSON.parse(document.querySelector('#workspaceScripts').textContent);for(const entry of scripts){if(root.dataset.wsAccess!=='granted')return;await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=entry.src;if(entry.type)script.type=entry.type;script.async=false;script.onload=resolve;script.onerror=reject;document.body.append(script)})}}
  }catch{leave('verificacao')}finally{busy=false}
 }
 A.client.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_OUT'||started&&session?.user?.id!==account){leave('login')}else if(started&&event==='SIGNED_IN'){setTimeout(check,0)}});
 addEventListener('pagehide',lock);addEventListener('pageshow',event=>{if(event.persisted)check()});document.addEventListener('visibilitychange',()=>{if(!document.hidden&&started)check()});
 setInterval(()=>{if(started&&!document.hidden&&navigator.onLine)check()},60000);
 await check();
})();
