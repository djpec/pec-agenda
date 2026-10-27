const{authorize}=require('./access-fixture.cjs');
// Fresh visits must open directly, with readable white brand assets and native app icons.
const{chromium}=require('playwright');const assert=require('node:assert/strict');const fs=require('node:fs');
const BASE=process.env.PEC_TEST_URL||'http://127.0.0.1:8765/';
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.PEC_BROWSER,args:['--no-sandbox','--disable-dev-shm-usage']});try{
 for(const theme of ['light','dark']){
  const c=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});await c.addInitScript(theme=>{if(location.protocol==='http:')localStorage.setItem('pec-manager-preferences-v1',JSON.stringify({theme}))},theme);
  await c.route('https://**.supabase.co/**',r=>r.fulfill({status:200,contentType:'application/json',body:'[]'}));await authorize(c);const p=await c.newPage(),errors=[],media=[];p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(/pec-intro|\.mp4/.test(r.url()))media.push(r.url())});
  for(const file of ['index.html','agenda.html','orcamentos.html','contratos.html']){
   await p.goto(BASE+file);await p.waitForFunction(()=>document.documentElement.dataset.workspaceReady==='true');assert.equal(await p.locator('video,#wsBrandIntro,dialog[open]').count(),0,'Fresh visit must open directly');
   assert(await p.locator('.ws-wordmark img').evaluate(async image=>{await image.decode();return image.naturalWidth>0&&image.src.endsWith('pec-logo-white.svg')}));
   assert.equal(await p.locator('link[rel=apple-touch-icon]').count(),1);assert.equal(await p.locator('link[rel=manifest]').count(),1);
   if(file==='contratos.html'||file==='orcamentos.html'){
    const selector=file==='contratos.html'?'.paper .pmark img':'.doc .ws-quote-wordmark';assert.equal(await p.locator(selector).count(),3);assert(await p.locator(selector).first().evaluate(async i=>{await i.decode();return i.src.endsWith('pec-logo-badge.svg')}));
    await p.emulateMedia({media:'print'});assert.equal(await p.locator(selector).first().evaluate(i=>getComputedStyle(i).filter),'none');await p.emulateMedia({media:'screen'});
   }
  }
  assert.deepEqual(errors,[]);assert.deepEqual(media,[]);await p.locator('#pmAppearance').click();await p.waitForSelector('#pmAppearanceDialog[open]');
  for(const file of ['assets/brand/favicon-32.png','assets/brand/apple-touch-icon.png','assets/brand/icon-192.png','assets/brand/icon-512.png','assets/brand/icon-maskable-512.png']){
   const colors=await p.evaluate(async url=>{const image=new Image();image.src=url;await image.decode();const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;let white=0,yellow=0;for(let i=0;i<pixels.length;i+=4){if(pixels[i]>225&&pixels[i+1]>225&&pixels[i+2]>225)white++;if(pixels[i]>170&&pixels[i+1]>140&&pixels[i+2]<90)yellow++}return{white,yellow}},BASE+file);
   assert(colors.white>5,'Icon must contain the white wordmark');assert.equal(colors.yellow,0,'Icon must not retain the yellow logo');
  }
  await c.close();console.log(`PASS: ${theme}: direct startup, no intro requests, brand/print assets, settings and white phone/favicon pixels`);
 }
 const manifest=JSON.parse(fs.readFileSync('manifest.webmanifest'));for(const icon of manifest.icons){const buffer=fs.readFileSync(icon.src.split('?')[0]),size=Number(icon.sizes.split('x')[0]);assert.equal(buffer.readUInt32BE(16),size);assert.equal(buffer.readUInt32BE(20),size)}assert(manifest.icons.some(i=>i.purpose==='maskable'));
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
