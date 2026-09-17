const CACHE='pec-agenda-v6';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon.svg','./mobile-fix.css','./cloud-fix.js'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});

async function patchHtml(response){
  const html=await response.text();
  const styleTag='<link rel="stylesheet" href="./mobile-fix.css?v=6">';
  const scriptTag='<script src="./cloud-fix.js?v=6"></script>';
  let patched=html;
  if(!patched.includes('mobile-fix.css')) patched=patched.replace('</head>',`${styleTag}</head>`);
  if(!patched.includes('cloud-fix.js')) patched=patched.replace('</body>',`${scriptTag}</body>`);
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
        return patchHtml(response);
      }catch{
        const cached=await caches.match('./index.html');
        return cached?patchHtml(cached):Response.error();
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