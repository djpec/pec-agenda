const CACHE='pec-manager-v21';
const CORE=['./', './index.html', './agenda.html', './orcamentos.html', './contratos.html', './manifest.webmanifest', './icon.svg', './manager-shared.js', './manager-document.js', './cloud-fix.js', './quote-cloud.js', './contract-cloud.js', './contract-print.css', './vendor/supabase-2.116.0.js', './vendor/fonts/manrope-latin.woff2', './ui/workspace.css', './ui/core.js', './ui/shell.js', './ui/home.js', './ui/agenda.js', './ui/agenda-data.js', './ui/documents.js'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('pec-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  // Never cache Auth, Supabase responses or other cross-origin private data.
  if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
  const key=new Request(url.origin+url.pathname);
  event.respondWith((async()=>{
    try{const response=await fetch(event.request);if(response.ok){const cache=await caches.open(CACHE);await cache.put(key,response.clone())}return response}
    catch{return await caches.match(key,{ignoreSearch:true})||Response.error()}
  })());
});
