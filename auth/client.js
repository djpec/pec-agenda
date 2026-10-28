/* Public Supabase key only. Authorization is checked by a server-owned allowlist. */
(()=>{
 'use strict';if(window.ArtistAuth)return;
 const client=window.supabase.createClient('https://qmhyeotvbktdilrudwys.supabase.co','sb_publishable_Yin9aHOMDRYJ0PsuMloVlQ_q8M7iReT');
 const allowed=new Set(['index.html','agenda.html','orcamentos.html','contratos.html','financeiro.html']);
 const base=new URL('.',location.href);
 function destination(raw){try{const url=new URL(raw||'index.html',base);const name=url.pathname.slice(base.pathname.length);if(url.origin!==base.origin||!url.pathname.startsWith(base.pathname)||!allowed.has(name)||url.username||url.password)return new URL('index.html',base).href;url.hash='';return url.href}catch{return new URL('index.html',base).href}}
 async function timeout(promise){let timer;try{return await Promise.race([promise,new Promise((_,reject)=>timer=setTimeout(()=>reject(new Error('verification_unavailable')),9000))])}finally{clearTimeout(timer)}}
 async function verify(){
  const session=await timeout(client.auth.getSession());if(session.error||!session.data.session)return{allowed:false,reason:'login'};
  // A cached or fabricated JWT is not an authorization decision.
  const verified=await timeout(client.auth.getUser());if(verified.error||!verified.data.user)return{allowed:false,reason:'login'};
  const permission=await timeout(client.rpc('app_has_access'));if(permission.error)throw new Error('verification_unavailable');
  return{allowed:permission.data===true,reason:'restricted',user:verified.data.user};
 }
 function loginURL(reason='login'){const url=new URL('login.html',base);url.searchParams.set('next',destination(location.href));if(reason!=='login')url.searchParams.set('estado',reason);return url.href}
 // Temporary local access while the owner prepares documents. Restore true to require login.
 window.ArtistAuth={accessRequired:false,client,verify,destination,loginURL,timeout};
})();
