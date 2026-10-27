const{authorize}=require('./access-fixture.cjs');
// Real touch scroll gestures must move form content, never the window or the page behind it.
const {chromium}=require('playwright');const assert=require('node:assert/strict');
const BASE=process.env.PEC_TEST_URL||'http://127.0.0.1:8765/';
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.PEC_BROWSER,args:['--no-sandbox','--disable-dev-shm-usage']});try{
 const c=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 await c.addInitScript(()=>document.addEventListener('DOMContentLoaded',()=>{document.documentElement.style.setProperty('--ws-safe-top','59px');document.documentElement.style.setProperty('--ws-safe-bottom','34px')}));
 await c.route('https://**.supabase.co/**',r=>r.fulfill({status:200,contentType:'application/json',body:'[]'}));await authorize(c);const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(BASE+'agenda.html');await p.waitForFunction(()=>document.documentElement.dataset.workspaceReady==='true');
 const before=await p.evaluate(()=>{window.scrollTo(0,300);const before={scrollY:window.scrollY,mainTop:document.querySelector('#workspace').getBoundingClientRect().top};document.querySelector('#addBtn').focus({preventScroll:true});AgendaStore.open();return before});
 await p.locator('#modal').evaluate(el=>Promise.all(el.getAnimations().map(a=>a.finished)));
 const initial=await p.locator('#modal').boundingBox(),heading=await p.locator('#modal .ws-drawer-heading').boundingBox(),footer=await p.locator('#modal .ws-form-footer').boundingBox();
 assert.equal(await p.locator('#modal').evaluate(el=>getComputedStyle(el).overflowY),'hidden');assert.equal(await p.locator('#modal .ws-form-body').evaluate(el=>getComputedStyle(el).touchAction),'pan-y');assert.equal(await p.locator('#modal').evaluate(el=>getComputedStyle(el).transform),'none');
 assert(Math.abs(await p.locator('#workspace').evaluate(el=>el.getBoundingClientRect().top)-before.mainTop)<2,'Opening window must preserve the background position');
 assert(await p.locator('#modal .ws-form-body').evaluate(el=>el.scrollHeight>el.clientHeight),'Phone form must have an inner scrolling area');
 const body=await p.locator('#modal .ws-form-body').boundingBox(),cdp=await c.newCDPSession(p);
 let maximumScroll=0;
 for(const gesture of [{dx:0,dy:-180},{dx:70,dy:-120},{dx:-70,dy:100}]){
  const start={x:gesture.dx<0?body.x+body.width-4:body.x+4,y:body.y+body.height*.65};
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[start]});
  for(let step=1;step<=12;step++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:start.x+gesture.dx*step/12,y:start.y+gesture.dy*step/12}]});await p.waitForTimeout(16)}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));maximumScroll=Math.max(maximumScroll,await p.locator('#modal .ws-form-body').evaluate(el=>el.scrollTop));
  const rect=await p.locator('#modal').boundingBox(),head=await p.locator('#modal .ws-drawer-heading').boundingBox(),foot=await p.locator('#modal .ws-form-footer').boundingBox();
  for(const key of ['x','y','width','height'])assert(Math.abs(rect[key]-initial[key])<1.5,`Window ${key} changed during touch scroll`);
  assert(Math.abs(head.y-heading.y)<1.5,'Window heading moved');assert(Math.abs(foot.y-footer.y)<1.5,'Window footer moved');assert.equal(await p.evaluate(()=>window.scrollY),0,'Locked page must not scroll');
 }
 assert(maximumScroll>0,'Touch gesture must actually scroll the fields');
 await p.locator('#closeBtn').click();await p.waitForFunction(()=>!document.querySelector('#modal').open&&!document.body.classList.contains('ws-dialog-open'));assert(Math.abs(await p.evaluate(()=>window.scrollY)-before.scrollY)<2,'Closing window must restore page scroll');
 assert((await p.locator('.ws-aurora>i').count())===3);assert((await p.locator('.ws-particles>i').count())===16);assert((await p.locator('.ws-background-equalizer>i').count())===24);
 const aurora=await p.locator('.ws-aurora>i').first().evaluate(el=>getComputedStyle(el).transform);await p.waitForTimeout(350);assert.notEqual(await p.locator('.ws-aurora>i').first().evaluate(el=>getComputedStyle(el).transform),aurora,'Aurora must visibly move');
 assert.equal(await p.locator('#workspace').evaluate(el=>getComputedStyle(el).viewTransitionName),'none','Page snapshots must not capture pre-upgrade markup');
 assert.deepEqual(errors,[]);await c.close();
 // Hold the new module back: original document controls must never paint while booting.
 for(const [file,selector]of [['orcamentos.html','.editor'],['contratos.html','.sidebar']]){
  const context=await browser.newContext({serviceWorkers:'block'});await context.route('https://**.supabase.co/**',r=>r.fulfill({status:200,contentType:'application/json',body:'[]'}));await authorize(context);let release;const gate=new Promise(resolve=>release=resolve);
  await context.route('**/ui/documents.js*',async route=>{await gate;await route.continue()});const page=await context.newPage();await page.goto(BASE+file,{waitUntil:'commit'});await page.locator(selector).waitFor({state:'attached'});
  assert.equal(await page.getAttribute('html','data-ws-boot'),'pending');assert.equal(await page.locator(selector).evaluate(el=>getComputedStyle(el).visibility),'hidden',`${file}: legacy editor flashed before workspace setup`);
  release();await page.waitForFunction(()=>document.documentElement.dataset.workspaceReady==='true'&&document.documentElement.dataset.wsBoot==='ready');assert(!await page.locator(selector).isVisible());await page.locator('.ws-heading').waitFor({state:'visible'});await context.close();
 }
 console.log('PASS: vertical and diagonal touch scroll keep the mobile window/header/footer fixed; page scroll restored; animated aurora/particles/equalizer; legacy editors hidden before first workspace paint.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
