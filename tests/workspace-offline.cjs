// Fresh-browser precache test: pages never opened online must still open offline.
const{chromium}=require('playwright');const assert=require('node:assert/strict');
const BASE=process.env.PEC_TEST_URL||'http://127.0.0.1:8765/';
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.PEC_BROWSER,args:['--no-sandbox','--disable-dev-shm-usage']});try{
 const context=await browser.newContext({viewport:{width:390,height:900}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(BASE+'manifest.webmanifest');await page.evaluate(()=>caches.open('pec-manager-v25'));
 await page.goto(BASE);await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>navigator.serviceWorker.controller);
 const keys=await page.evaluate(()=>caches.keys());assert(keys.includes('pec-manager-v26'));assert(!keys.includes('pec-manager-v25'));
 await context.setOffline(true);
 for(const file of ['agenda.html','orcamentos.html','contratos.html','index.html']){
  await page.goto(BASE+file);await page.waitForFunction(()=>document.documentElement.dataset.workspaceReady==='true');
  assert(await page.locator('.ws-wordmark img').evaluate(async image=>{await image.decode();return image.naturalWidth>0}),'Brand must load offline');
  assert(await page.evaluate(()=>document.fonts.load('600 16px Manrope').then(fonts=>fonts.length>0)));
  if(file==='agenda.html'){
   await page.locator('#addBtn').click();await page.locator('#title').fill('Criado sem internet');await page.locator('#eventForm [type=submit]').click();await page.waitForFunction(()=>!document.querySelector('#modal').open);
   assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('pec-agenda-v1'))[0].title),'Criado sem internet');
  }
  if(file==='orcamentos.html'){
   await page.locator('#wsResumeDocument').click();await page.locator('#wsSaveDocument').click();await page.waitForFunction(()=>document.querySelector('#pmDocumentState').textContent.includes('Salvo no histórico deste aparelho'));
  }
 }
 assert.deepEqual(errors,[]);console.log('PASS: obsolete cache removed; all four screens and local font precached; event creation and document saving work offline.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
