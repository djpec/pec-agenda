const{authorize}=require('./access-fixture.cjs');
// Simulate a native status-bar hit area; viewport emulation alone has zero safe insets.
const {chromium}=require('playwright');const assert=require('node:assert/strict');
const BASE=process.env.PEC_TEST_URL||'http://127.0.0.1:8765/';
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.PEC_BROWSER,args:['--no-sandbox','--disable-dev-shm-usage']});try{
 for(const width of [320,390,430])for(const inset of [0,59]){
  const context=await browser.newContext({viewport:{width,height:900},hasTouch:true,isMobile:true,serviceWorkers:'block',locale:'pt-BR'});
  await context.addInitScript(inset=>document.addEventListener('DOMContentLoaded',()=>{
   document.documentElement.style.setProperty('--ws-safe-top',inset+'px');document.documentElement.style.setProperty('--ws-safe-bottom',inset?'34px':'0px');
   const native=document.createElement('div');native.id='testNativeStatusBar';native.style.cssText=`position:fixed;top:0;left:0;right:0;height:${inset}px;z-index:2147483647;pointer-events:auto;background:#444;`;document.body.append(native);
  }),inset);
  await context.route('https://**.supabase.co/**',r=>r.fulfill({status:200,contentType:'application/json',body:'[]'}));await authorize(context);const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const file of ['index.html','agenda.html','orcamentos.html','contratos.html']){
   await page.goto(BASE+file);await page.waitForFunction(()=>document.documentElement.dataset.workspaceReady==='true');
   assert(await page.locator('.ws-nav a').first().evaluate(el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}),'Bottom navigation must remain above page content');
   const selectors=['.ws-theme-toggle','#pmAppearance','#pmAccountLink'];const boxes=[];
   for(const selector of selectors){const box=await page.locator(selector).boundingBox();assert(box.y>=inset,`${file}: ${selector} under native status bar`);assert(box.width>=44&&box.height>=44,`${selector}: touch target too small`);assert(box.x>=0&&box.x+box.width<=width,`${selector}: outside screen`);boxes.push(box);
    assert(await page.locator(selector).evaluate(el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}),`${selector}: blocked by another element`);
   }
   for(let i=0;i<boxes.length-1;i++)assert(boxes[i].x+boxes[i].width<=boxes[i+1].x,'Header controls overlap');
   await page.locator('#pmAppearance').tap();await page.locator('#pmAppearanceDialog[open]').waitFor();
   const close=page.locator('#pmAppearanceDialog .pm-dialog-head button'),closeBox=await close.boundingBox();assert(closeBox.y>=inset,'Settings close button under status bar');await close.tap();await page.waitForFunction(()=>!document.querySelector('#pmAppearanceDialog').open);
   const previous=await page.getAttribute('html','data-pm-theme');await page.locator('.ws-theme-toggle').tap();await page.waitForFunction(previous=>document.documentElement.dataset.pmTheme!==previous,previous);
   if(file==='agenda.html'){await page.locator('#pmAccountLink').tap();await page.locator('#accountModal[open]').waitFor();assert((await page.locator('#accountClose').boundingBox()).y>=inset);await page.locator('#accountClose').tap();
    await page.locator('#addBtn').tap();await page.locator('#modal[open]').waitFor();assert((await page.locator('#closeBtn').boundingBox()).y>=inset);await page.locator('#closeBtn').tap();
   }
  }
  // Returning to the desktop layout must preserve the same account link and listeners.
  await page.setViewportSize({width:1440,height:1000});await page.locator('.ws-rail-bottom #pmAccountLink').waitFor({state:'attached'});assert.equal(await page.locator('.ws-rail-bottom #pmAccountLink').count(),1);await page.setViewportSize({width,height:900});await page.locator('.ws-topbar-actions #pmAccountLink').waitFor({state:'attached'});assert.equal(await page.locator('.ws-topbar-actions #pmAccountLink').count(),1);
  assert.deepEqual(errors,[]);console.log(`PASS: four pages, ${width}px, safe top ${inset}px: settings/theme/account touch controls accessible`);await context.close();
 }
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
