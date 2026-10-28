const CACHE='pec-manager-v37';
const CORE=['./ui/availability-preferences.js','./ui/availability-holidays.mjs','./ui/availability.js','./ui/availability-model.mjs','./finance/quick-entry.js','./finance/local-store.js','./finance/backup.mjs','./financeiro.html','./finance/model.mjs','./finance/store.js','./finance/app.js','./finance/style.css','./', './index.html', './login.html', './auth/client.js', './auth/access.js', './auth/protected.css', './auth/login.css', './auth/login.js', './marketing/brand-icon.svg', './marketing/apple-icon.png', './agenda.html', './orcamentos.html', './contratos.html', './manifest.webmanifest', './icon.svg', './assets/brand/pec-logo-white.svg', './assets/brand/pec-logo-badge.svg', './assets/brand/favicon-32.png', './assets/brand/apple-touch-icon.png', './assets/brand/icon-192.png', './assets/brand/icon-512.png', './assets/brand/icon-maskable-512.png', './manager-shared.js', './manager-document.js', './cloud-fix.js', './quote-cloud.js', './contract-cloud.js', './contract-print.css', './vendor/supabase-2.116.0.js', './vendor/fonts/manrope-latin.woff2', './ui/boot.css', './ui/boot.js', './ui/workspace.css', './ui/core.js', './ui/shell.js', './ui/home.js', './ui/agenda.js', './ui/agenda-data.js', './ui/documents.js'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE.map(url=>new Request(url,{cache:'reload'})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('pec-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  // Never cache Auth, Supabase responses or other cross-origin private data.
  if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
  const key=new Request(url.origin+url.pathname);
  event.respondWith((async()=>{
    try{const response=await fetch(event.request,{cache:'no-cache'});if(response.ok){const cache=await caches.open(CACHE);await cache.put(key,response.clone())}return response}
    catch{return await caches.match(key,{ignoreSearch:true})||Response.error()}
  })());
});
