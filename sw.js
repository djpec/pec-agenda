const CACHE='pec-agenda-v5';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon.svg','./mobile-fix.css'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});

async function injectMobileFix(response){
  const html=await response.text();
  const tag='<link rel="stylesheet" href="./mobile-fix.css?v=5">';
  const patched=html.includes('mobile-fix.css')?html:html.replace('</head>',`${tag}</head>`);
  return new Response(patched,{
    status:response.status,
    statusText:response.statusText,
    headers:{'Content-Type':'text/html; charset=utf-8'}
  });
}

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;

  if(event.request.mode==='navigate'){
    event.respondWith((async()=>{
      try{
        const response=await fetch(event.request,{cache:'no-store'});
        const copy=response.clone();
        caches.open(CACHE).then(cache=>cache.put('./index.html',copy));
        return injectMobileFix(response);
      }catch{
        const cached=await caches.match('./index.html');
        return cached?injectMobileFix(cached):Response.error();
      }
    })());
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{
      const copy=response.clone();
      caches.open(CACHE).then(cache=>cache.put(event.request,copy));
      return response;
    }))
  );
});