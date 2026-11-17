const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const {storyEvents}=await import('../ui/story-art.mjs');
 for(const [date,last] of [['2026-02-15','2026-02-28'],['2028-02-15','2028-02-29'],['2026-12-15','2026-12-31']]){
  const first=date.slice(0,7)+'-01';
  const events=[{id:'last',date:last},{id:'first',date:first},{id:'before',date:'2025-12-31'},{id:'after',date:'2029-01-01'},{id:'done',date:first,completed:true}];
  assert.deepEqual(storyEvents(events,date,'month').map(e=>e.id),['first','last']);
 }
 const fixtures=Array.from({length:13},(_,i)=>({id:'m'+i,date:'2026-11-'+String(i*2+1).padStart(2,'0'),title:'Show mensal '+i,place:'Local',timeType:'time',time:'23:00'}));
 fixtures.push({id:'outside',date:'2026-12-01',title:'Outro mês'},{id:'done',date:'2026-11-30',title:'Concluído',completed:true});
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block',acceptDownloads:true});
  await context.addInitScript(events=>localStorage.setItem('pec-agenda-v1',JSON.stringify(events)),fixtures);
  await context.route('https://**.supabase.co/**',r=>r.abort());
  const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:8774/agenda.html?date=2026-11-15');
  await p.waitForFunction(()=>document.documentElement.dataset.workspaceReady==='true');
  const original=await p.evaluate(()=>localStorage.getItem('pec-agenda-v1'));
  await p.locator('#storyBtn').click();
  await p.evaluate(()=>{window.storyText=[];const original=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(value,...args){storyText.push(value);return original.call(this,value,...args)}});
  const ready=()=>p.waitForFunction(()=>!document.querySelector('#storyDownload').disabled);
  await p.locator('#storyMode').selectOption('month');await ready();
  assert.equal(await p.locator('[data-story-index]').count(),13);
  assert.equal(await p.locator('#storyArtTitle').getAttribute('placeholder'),'Agenda mensal.');
  assert.match(await p.locator('#storyPage').innerText(),/1 de 3/);
  for(let style=0;style<5;style++){
   await p.evaluate(()=>storyText=[]);
   await p.locator('#storyStyle').selectOption(String(style));await ready();
   const text=await p.evaluate(()=>storyText);
   assert(text.includes(style===2?'MENSAL':'mensal.'));
   assert(!text.includes('23:00'));
  }
  await p.locator('#storyPalette').selectOption('wine');
  await p.locator('#storyArtTitle').fill('Agenda de novembro');await ready();
  await p.locator('[data-story-index="1"]').uncheck();await ready();
  assert.match(await p.locator('#storyPage').innerText(),/1 de 2/);
  await p.locator('#storyNext').click();await ready();
  const download=p.waitForEvent('download');await p.locator('#storyDownload').click();
  const file=await download;assert.equal(file.suggestedFilename(),'Agenda-mensal-2026-11-15-2.png');
  const output='/tmp/story-month-'+width+'.png';await file.saveAs(output);
  assert.equal(require('fs').readFileSync(output).toString('base64'),await p.locator('#storyCanvas').evaluate(c=>c.toDataURL().split(',')[1]));
  await p.locator('#storyDate').fill('2026-12-15');await p.locator('#storyDate').dispatchEvent('change');await ready();
  assert.equal(await p.locator('[data-story-index]').count(),1);
  assert.equal(await p.locator('#storyPalette').inputValue(),'wine');
  assert.equal(await p.locator('#storyArtTitle').inputValue(),'Agenda de novembro');
  await p.locator('#storyDate').fill('2027-01-15');await p.locator('#storyDate').dispatchEvent('change');
  await p.waitForFunction(()=>document.querySelector('#storyStatus').textContent.includes('Nenhum evento'));
  assert(await p.locator('#storyDownload').isDisabled());
  assert.equal(await p.evaluate(()=>localStorage.getItem('pec-agenda-v1')),original);
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.deepEqual(errors,[]);await context.close();
  console.log('PASS monthly '+width+': month boundaries, five models, pagination, title, PNG, empty month, unchanged data');
 }}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
