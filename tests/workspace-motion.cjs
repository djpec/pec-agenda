// Modal geometry, background blocking, focus, persisted motion preference and OS opt-out.
const {chromium}=require('playwright');const assert=require('node:assert/strict');
const BASE=process.env.PEC_TEST_URL||'http://127.0.0.1:8765/';
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.PEC_BROWSER,args:['--no-sandbox','--disable-dev-shm-usage']});try{
 for(const width of [1440,390])for(const reducedMotion of ['no-preference','reduce']){
  const context=await browser.newContext({viewport:{width,height:1000},hasTouch:width<600,serviceWorkers:'block',reducedMotion});
  await context.addInitScript(width=>document.addEventListener('DOMContentLoaded',()=>{document.documentElement.style.setProperty('--ws-safe-top',width<600?'59px':'0px');document.documentElement.style.setProperty('--ws-safe-bottom',width<600?'34px':'0px')}),width);
  await context.route('https://**.supabase.co/**',r=>r.fulfill({status:200,contentType:'application/json',body:'[]'}));const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(BASE+'agenda.html');await page.waitForFunction(()=>document.documentElement.dataset.workspaceReady==='true');assert.equal(await page.getAttribute('html','data-ws-motion'),reducedMotion==='reduce'?'off':'on');
  await page.locator('#addBtn').click();await page.locator('#modal[open]').waitFor();await page.locator('#modal').evaluate(el=>Promise.all(el.getAnimations().map(a=>a.finished)));
  const rect=await page.locator('#modal').boundingBox();assert(Math.abs(rect.x+rect.width/2-width/2)<2,'Launch window must be centered horizontally');assert(rect.width<width,'Launch window must float inside viewport');assert(rect.y>=(width<600?59:0),'Window must respect status bar');assert(rect.y+rect.height<=1000-(width<600?34:0),'Window must respect bottom safe area');
  const backdrop=await page.locator('#modal').evaluate(el=>getComputedStyle(el,'::backdrop').backdropFilter);assert(backdrop.includes('blur(12px)'),`Background must be blurred, got ${backdrop}`);
  assert(await page.locator('#title').evaluate(el=>el===document.activeElement));
  assert(await page.locator('#modal').evaluate(el=>el.contains(document.elementFromPoint(1,500))),'Native modal must block background interactions');
  assert(await page.locator('#modal').evaluate(el=>el.scrollWidth<=el.clientWidth),'No horizontal overflow inside launch window');
  await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#modal').open&&!document.body.classList.contains('ws-dialog-open'));assert(await page.locator('#addBtn').evaluate(el=>el===document.activeElement));assert(!await page.locator('body').evaluate(el=>el.classList.contains('ws-dialog-open')));
  await page.locator('#addBtn').click();await page.locator('#title').fill('Evento com janela animada');await page.locator('#eventForm [type=submit]').click();await page.waitForFunction(()=>!document.querySelector('#modal').open);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('pec-agenda-v1')).length),1);
  await page.locator('[data-edit]').click();await page.locator('#modal[open]').waitFor();await page.locator('#modal').evaluate(el=>Promise.all(el.getAnimations().map(a=>a.finished)));await page.mouse.click(1,500);await page.waitForFunction(()=>!document.querySelector('#modal').open);
  await page.locator('#pmAppearance').click();await page.locator('#wsMotionToggle').uncheck();assert.equal(await page.getAttribute('html','data-ws-motion'),'off');await page.locator('#pmAppearanceDialog .pm-dialog-head button').click();
  await page.reload();await page.waitForFunction(()=>document.documentElement.dataset.workspaceReady==='true');assert.equal(await page.getAttribute('html','data-ws-motion'),'off');assert.equal(await page.locator('.ws-ambient').evaluate(el=>getComputedStyle(el).display),'none');
  await page.locator('#pmAppearance').click();assert(!await page.locator('#wsMotionToggle').isChecked());await page.locator('#wsMotionToggle').check();await page.locator('#pmAppearanceDialog .pm-dialog-head button').click();assert.equal(await page.getAttribute('html','data-ws-motion'),reducedMotion==='reduce'?'off':'on');
  await page.locator('.ws-nav a[href="./"]').click();await page.waitForFunction(()=>document.documentElement.dataset.workspaceReady==='true'&&document.body.dataset.pmPage==='home');assert.equal(await page.locator('.ws-ambient').evaluate(el=>getComputedStyle(el).pointerEvents),'none');
  if(reducedMotion==='reduce')assert.equal(await page.locator('.ws-heading').evaluate(el=>getComputedStyle(el).animationName),'none');
  assert.deepEqual(errors,[]);console.log(`PASS: ${width}px ${reducedMotion}: centered blur window, save/edit, Escape/backdrop/focus, motion preference and navigation`);await context.close();
 }
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
