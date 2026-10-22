// UI regression checks with isolated local data and intercepted cloud requests.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const BASE=process.env.PEC_TEST_URL||'http://127.0.0.1:8765/';
const dateString=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.PEC_BROWSER,args:['--no-sandbox','--disable-dev-shm-usage']});
 const results=[];
 try{
  const now=new Date(),future=new Date(now.getFullYear()+1,1,4);
  const rows=[{id:'future',title:'Evento <teste>',date:dateString(future),timeType:'time',time:'01:00',place:'São Paulo',completed:false},{id:'completed',title:'Concluído',date:'2025-01-01',timeType:'time',time:'23:00',completed:true},{id:'month',title:'Evento do mês',date:dateString(now),timeType:'allnight',completed:false}];
  for(const width of [1440,390,320])for(const theme of ['dark','light']){
   const context=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block'});
   await context.addInitScript(({rows,theme})=>{localStorage.setItem('pec-agenda-v1',JSON.stringify(rows));localStorage.setItem('pec-manager-preferences-v1',JSON.stringify({theme}));localStorage.setItem('pec-manager-pref-migrated','true')},{rows,theme});
   await context.route('https://**.supabase.co/**',r=>r.fulfill({status:200,contentType:'application/json',body:'[]'}));
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   for(const name of ['index.html','agenda.html','orcamentos.html','contratos.html']){
    await page.goto(BASE+name);await page.locator('.bs-topbar').waitFor();
    await page.evaluate(()=>document.fonts.ready);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${name}: horizontal overflow`);
    if(width<700){
     const rect=await page.locator('#pmHeader .pm-nav').boundingBox();
     assert(Math.abs(rect.y+rect.height-1000)<2,`${name}: mobile navigation must be at viewport bottom`);
    }
    if(name==='index.html'){
     await page.waitForFunction(()=>document.querySelector('#pmCompletedCount').textContent==='1');
     assert.equal(await page.locator('#pmMonthCount').textContent(),'1');
     assert.equal(await page.locator('#bsLineup b').last().textContent(),'Evento <teste>');
     assert(await page.evaluate(()=>document.fonts.check('600 16px Manrope')));
    }else if(name==='agenda.html'){
     await page.locator('#pmCreateEvent').click();await page.locator('#modal.open').waitFor();
     assert(await page.locator('#title').evaluate(el=>el===document.activeElement));
     await page.locator('#title').fill('Show de validação');await page.locator('#date').fill(dateString(future));
     await page.locator('#eventForm button.primary').click();
     await page.getByRole('heading',{name:'Show de validação',exact:true}).waitFor();
     await page.locator('[data-view=calendar]').click();await page.locator('.calendar').waitFor();
    }else{
     await page.locator('#bsResume').click();await page.locator('.bs-editor-dialog[open]').waitFor();
     await page.locator('#bsNextStep').click();assert.equal(await page.locator('#bsStepCount').textContent(),name==='orcamentos.html'?'2 de 7':'2 de 9');
     await page.locator('#bsCloseEditor').click();
    }
    results.push(`${name}: ${width}px ${theme} OK`);
   }
   assert.deepEqual(errors,[]);await context.close();
  }
  console.log(results.join('\n'));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
