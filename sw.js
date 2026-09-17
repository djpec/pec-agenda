const CACHE='pec-manager-v10';
const CORE=['./','./index.html','./agenda.html','./orcamentos.html','./contratos.html','./manifest.webmanifest','./icon.svg','./mobile-fix.css','./cloud-fix.js','./enhancements-v7.js','./manager-module.js','./manager-shared.js'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)));self.skipWaiting()});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
async function patchPage(response,key){
  const html=await response.text();let patched=html;
  const sharedTag='<script src="./manager-shared.js?v=10"></script>';
  const managerTag='<script src="./manager-module.js?v=10"></script>';
  if(!patched.includes('manager-shared.js'))patched=patched.replace('</body>',`${sharedTag}</body>`);
  if(!patched.includes('manager-module.js'))patched=patched.replace('</body>',`${managerTag}</body>`);
  if(key==='./agenda.html'){
    const styleTag='<link rel="stylesheet" href="./mobile-fix.css?v=10">';
    const cloudTag='<script src="./cloud-fix.js?v=10"></script>';
    const enhanceTag='<script src="./enhancements-v7.js?v=10"></script>';
    if(!patched.includes('mobile-fix.css'))patched=patched.replace('</head>',`${styleTag}</head>`);
    if(!patched.includes('cloud-fix.js'))patched=patched.replace('</body>',`${cloudTag}</body>`);
    if(!patched.includes('enhancements-v7.js'))patched=patched.replace('</body>',`${enhanceTag}</body>`);
  }
  return new Response(patched,{status:response.status,statusText:response.statusText,headers:{'Content-Type':'text/html; charset=utf-8'}});
}
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(event.request.mode==='navigate'){
    event.respondWith((async()=>{
      const key=url.pathname.endsWith('/agenda.html')?'./agenda.html':url.pathname.endsWith('/orcamentos.html')?'./orcamentos.html':url.pathname.endsWith('/contratos.html')?'./contratos.html':'./index.html';
      try{
        const response=await fetch(event.request,{cache:'no-store'});const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(key,copy));
        return key==='./index.html'?response:patchPage(response,key);
      }catch{
        const cached=await caches.match(key);if(!cached)return Response.error();return key==='./index.html'?cached:patchPage(cached,key);
      }
    })());return;
  }
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response})));
});