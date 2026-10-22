// Real Supabase JS SDK; intercepted network, isolated browser accounts, no live writes.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const BASE=process.env.PEC_TEST_URL||'http://127.0.0.1:8765/';
const OUT=process.env.PEC_QA_DIR||path.join(require('node:os').tmpdir(),'pec-manager-qa');fs.mkdirSync(OUT,{recursive:true});
const uid='11111111-1111-4111-8111-111111111111';
const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jV1sAAAAASUVORK5CYII=';
const cloud={quotes:[],contracts:[],events:[],user_preferences:[{user_id:uid,theme:'dark',background_image:null,background_darkness:80,background_blur:0,updated_at:'2026-09-17T12:00:00.000Z'}]};
const errors=[];const b64=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
const token=`${b64({alg:'HS256',typ:'JWT'})}.${b64({sub:uid,aud:'authenticated',role:'authenticated',exp:Math.floor(Date.now()/1000)+7200})}.fixture`;
const session={access_token:token,refresh_token:'fixture',token_type:'bearer',expires_in:7200,expires_at:Math.floor(Date.now()/1000)+7200,user:{id:uid,email:'qa@example.invalid',aud:'authenticated',role:'authenticated',app_metadata:{},user_metadata:{}}};
async function setup(browser){
 const ctx=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'});
 await ctx.addInitScript(s=>{if(location.protocol==='http:')localStorage.setItem('sb-qmhyeotvbktdilrudwys-auth-token',JSON.stringify(s))},session);
 await ctx.route('https://qmhyeotvbktdilrudwys.supabase.co/**',async route=>{
  const req=route.request(),url=new URL(req.url()),table=url.pathname.split('/').pop(),method=req.method();
  if(url.pathname.startsWith('/auth/'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(url.pathname.includes('/token')?session:session.user)});
  if(!cloud[table])return route.fulfill({status:404,body:'{}'});
  const filters=[...url.searchParams].filter(([k,v])=>!['select','order','limit','offset','on_conflict'].includes(k));
  const matches=r=>r.user_id===uid&&filters.every(([k,v])=>v.startsWith('eq.')?String(r[k])===v.slice(3):true);
  let results=[];
  if(method==='GET')results=cloud[table].filter(matches).sort((a,b)=>String(b.updated_at).localeCompare(String(a.updated_at))).slice(0,Number(url.searchParams.get('limit')||10000));
  else if(method==='POST'){
   const data=req.postDataJSON(),list=Array.isArray(data)?data:[data];
   for(const r of list){const key=table==='user_preferences'?'user_id':'id',i=cloud[table].findIndex(x=>x[key]===r[key]);
    if(i>=0&&!req.headers().prefer?.includes('resolution=merge-duplicates'))return route.fulfill({status:409,contentType:'application/json',body:JSON.stringify({code:'23505',message:'duplicate key'})});
    if(i>=0)cloud[table][i]={...cloud[table][i],...r};else cloud[table].push(structuredClone(r));results.push(r);
   }
  }else if(method==='PATCH'){
   const data=req.postDataJSON();cloud[table]=cloud[table].map(r=>{if(!matches(r))return r;const next={...r,...data};results.push(next);return next});
  }else if(method==='DELETE'){cloud[table]=cloud[table].filter(r=>!matches(r));}
  const single=req.headers().accept?.includes('application/vnd.pgrst.object+json');
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(single?(results[0]||null):results)});
 });
 ctx.on('page',p=>{p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.accept())});
 return ctx;
}
async function ready(page,name=''){await page.goto(BASE+name);await page.waitForFunction(()=>document.documentElement.dataset.workspaceReady==='true')}
async function waitSaved(page){await page.waitForFunction(()=>document.querySelector('#pmDocumentState').textContent.includes('Salvo na nuvem'))}
const dateKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const now=new Date(),night=dateKey(new Date(now.getFullYear(),now.getMonth(),Math.min(25,new Date(now.getFullYear(),now.getMonth()+1,0).getDate()))),nextMonth=dateKey(new Date(now.getFullYear(),now.getMonth()+1,10));
const completed=[];
async function localContext(browser,width=1440,theme='light'){
 const c=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block'});
 await c.addInitScript(theme=>{if(!localStorage.getItem('workspace-test-initialized')){localStorage.setItem('workspace-test-initialized','1');localStorage.setItem('pec-agenda-v1','[]');localStorage.setItem('pec-manager-preferences-v1',JSON.stringify({theme}));localStorage.setItem('pec-manager-pref-migrated','true')}},theme);
 await c.route('https://qmhyeotvbktdilrudwys.supabase.co/**',r=>r.fulfill({status:200,contentType:'application/json',body:'[]'}));
 return c;
}
async function createEvent(page,title,time='23:00',date=night){
 await page.locator('#addBtn').click();await page.locator('#title').fill(title);await page.locator('#date').fill(date);await page.locator('#timeType').selectOption('time');await page.locator('#time').fill(time);await page.locator('#place').fill('São Paulo');await page.locator('#notes').fill('Montagem e repertório');await page.locator('#eventForm [type=submit]').click();await page.waitForFunction(()=>!document.querySelector('#modal').open);
}
(async()=>{
 for(const[file,spec]of Object.entries(JSON.parse(fs.readFileSync(path.join(__dirname,'workspace-models.json'))))){const source=fs.readFileSync(path.join(__dirname,'..',file),'utf8').split('<!-- pec Manager integration:')[0];assert.equal(crypto.createHash('sha256').update(source).digest('hex'),spec.sha256,`${file}: document model integrity`)}
 const browser=await chromium.launch({headless:true,executablePath:process.env.PEC_BROWSER,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  // CRUD, overnight order, global search, keyboard and backups in an isolated local account.
  const local=await localContext(browser),p=await local.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.accept());await ready(p,'agenda.html');
  await createEvent(p,'Evento <teste>','23:00');await createEvent(p,'Madrugada','01:00');await createEvent(p,'Próximo mês','22:00',nextMonth);
  await p.locator('#agendaSearch').fill('montagem');assert.equal(await p.locator('.ws-event-row').count(),3);
  await p.locator('#agendaSearch').fill('proximo mes');assert.equal(await p.locator('.ws-event-row').count(),1);
  await p.locator('#agendaSearch').fill('');await p.locator('[data-view=calendar]').click();
  // Open an explicit night; both 23h and 01h belong to this event night.
  await ready(p,'agenda.html?date='+night);const titles=await p.locator('.ws-day-event h3').allTextContents();assert.deepEqual(titles,['Evento <teste>','Madrugada']);
  await p.locator(`[data-day="${night}"]`).focus();await p.keyboard.press('ArrowRight');assert.equal(await p.locator('[data-day]:focus').getAttribute('aria-pressed'),'true');
  await p.locator(`[data-day="${night}"]`).click();await p.locator('[data-complete]').first().click();await p.locator('#agendaStatus').selectOption('completed');assert.equal(await p.locator('.ws-day-event h3').textContent(),'Evento <teste>');
  await p.locator('[data-complete]').click();await p.locator('#agendaStatus').selectOption('active');await p.locator('[data-duplicate]').first().click();assert.equal(await p.locator('#eventId').inputValue(),'');await p.locator('#eventForm [type=submit]').click();assert.equal(await p.locator('.ws-day-event').count(),3);
  await p.locator('[data-edit]').filter({hasText:'Editar'}).last().click();await p.locator('#deleteBtn').click();assert.equal(await p.locator('.ws-day-event').count(),2);
  await p.reload();await p.waitForFunction(()=>document.documentElement.dataset.workspaceReady==='true');assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('pec-agenda-v1')).length),3);
  const download=p.waitForEvent('download');await p.locator('#exportBtn').click();const downloaded=await download;const exported=JSON.parse(fs.readFileSync(await downloaded.path(),'utf8'));assert.equal(exported.events.length,3);
  await p.locator('#importFile').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{"events":[{"title":"invalid"}]}')});assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('pec-agenda-v1')).length),3);
  await ready(p);await p.locator('#homeSearch').fill('does not exist');await p.locator('#homeEvents').getByText('Nenhum evento encontrado',{exact:true}).waitFor();await p.locator('#homeSearch').fill('');
  await p.locator('#homeCalendar [data-day]').first().click();await p.locator('#homeSelectedDay a').click();assert(new URL(p.url()).searchParams.has('date'));
  completed.push('Local CRUD, overnight order, accent-insensitive global search, completion/reopen, duplication, keyboard, reload, export and invalid import');await local.close();
  // Actual SDK + intercepted cloud routes: no requests are written to a real account.
  const ctx=await setup(browser),page=await ctx.newPage();await ready(page,'agenda.html');await createEvent(page,'Evento online');await page.waitForFunction(()=>document.querySelector('#syncState').textContent.includes('Sincronizado'));assert.equal(cloud.events.length,1);
  await ctx.setOffline(true);await createEvent(page,'Evento offline');assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('pec-agenda-pending-v1')).length),1);await ctx.setOffline(false);await page.evaluate(()=>window.pecPullCloud());await page.waitForFunction(()=>JSON.parse(localStorage.getItem('pec-agenda-pending-v1')).length===0);assert.equal(cloud.events.length,2);
  completed.push('Cloud event persistence and offline queue replay');
  await ready(page,'orcamentos.html?new=1');await page.locator('.ws-editor-dialog[open]').waitFor();
  await page.evaluate(img=>{data.client='Cliente integração';data.eventDate='2028-10-03';data.time='01:00';data.duration='4 horas';data.heroImage=img;data.investmentMode='perItem';data.scope=[{title:'Warm-up',description:'Recepção',duration:'2 horas',time:'01:00',value:'R$ 1.200,50'},{title:'Performance',description:'Pista',duration:'2 horas',time:'03:00',value:'R$ 800,00'}];data.extras=[{title:'Bazuca',description:'Efeito',value:'R$ 700,00',image:img,ratio:'16/9',fit:'contain',position:'center'}];fillFixed();renderScopeEditor();renderExtrasEditor();renderAll()},png);
  await page.locator('#pmDocumentStatus').selectOption('approved');await page.locator('#wsSaveDocument').click();await waitSaved(page);assert.equal(cloud.quotes.length,1);assert.equal(cloud.quotes[0].total_value,2000.5);assert.equal(cloud.quotes[0].payload.heroImage,png);
  await page.locator('#wsCloseEditor').click();await page.locator('[data-filter=draft]').click();assert.equal(await page.locator('[data-record]').count(),0);await page.locator('[data-filter=approved]').click();assert.equal(await page.locator('[data-record]').count(),1);await page.locator('#pmHistorySearch').fill('nonexistent');assert.equal(await page.locator('[data-record]').count(),0);await page.locator('#pmHistorySearch').fill('Cliente');await page.locator('[data-record]').click();await page.locator('.ws-editor-dialog[open]').waitFor();
  await page.locator('#pmAgenda').click();await page.locator('#pmAgendaForm button[type=submit]').click();await page.waitForFunction(()=>!document.querySelector('#pmAgendaForm'));assert.equal(cloud.events.length,3);
  await page.locator('#pmConvert').click();const form=page.locator('#pmConvertForm');assert.equal(await form.locator('[name=startDate]').inputValue(),'2028-10-04');assert.equal(await form.locator('[name=endTime]').inputValue(),'05:00');await form.locator('[name=extra-0]').check();await form.locator('[type=submit]').click();await page.waitForURL('**/contratos.html*');await page.waitForFunction(()=>document.documentElement.dataset.workspaceReady==='true');await page.locator('.ws-editor-dialog[open]').waitFor();
  const contract=await page.evaluate(()=>collectData());assert.equal(contract.clientName,'Cliente integração');assert.equal(contract.startDate,'2028-10-04');assert.equal(contract.baseValue,'2000.5');assert.equal(contract.extras[0].unit,700);assert.equal(contract.clientDoc,'');
  await page.locator('#wsDocumentSteps button').nth(7).click();await page.locator('#travelValue').fill('123.45');await page.locator('#wsSaveDocument').click();await waitSaved(page);assert.equal(cloud.contracts.length,1);assert.equal(cloud.contracts[0].total_value,2823.95);
  await page.locator('#pmAgenda').click();assert.equal(await page.locator('#pmAgendaForm [name=date]').inputValue(),'2028-10-03');await page.locator('#pmAgendaForm button[type=submit]').click();await page.waitForFunction(()=>!document.querySelector('#pmAgendaForm'));assert.equal(cloud.events.length,3);
  // Screen refactoring must preserve actual PDF content, including active editor values.
  await page.pdf({path:path.join(OUT,'workspace-contract.pdf'),format:'A4',printBackground:true});assert(fs.statSync(path.join(OUT,'workspace-contract.pdf')).size>10000);
  const firstPage=require('node:child_process').execFileSync('pdftotext',['-f','1','-l','1',path.join(OUT,'workspace-contract.pdf'),'-'],{encoding:'utf8'});assert(firstPage.includes('Cliente'), 'PDF first page must contain contract content, without a blank cover page');
  await page.screenshot({path:path.join(OUT,'workspace-contract-editor.png')});
  completed.push('Document library filters/search, complete quote payload, images and per-item totals, conversion after midnight, extras, linked event deduplication and PDF generation');
  await ready(page,'orcamentos.html');await page.locator('[data-record]').first().click();await page.locator('#wsDocumentSteps button').nth(1).click();
  cloud.quotes[0].updated_at='2099-01-01T00:00:00.000Z';await page.locator('[data-fixed=client]').fill('Tentativa concorrente');await page.locator('#wsSaveDocument').click();await page.waitForFunction(()=>document.querySelector('#pmDocumentState').textContent.includes('outro dispositivo'));assert.equal(cloud.quotes[0].client_name,'Cliente integração');completed.push('Concurrent update protection');await ctx.close();
  // Mobile keyboard login exercises the actual SDK without real credentials.
  const loginContext=await localContext(browser,390);
  let submittedPassword=null;
  await loginContext.route('https://qmhyeotvbktdilrudwys.supabase.co/**',async route=>{
   const url=new URL(route.request().url());
   if(url.pathname.includes('/token')){submittedPassword=route.request().postDataJSON().password;return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(session)})}
   return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(url.pathname.includes('/auth/')?session.user:[])});
  });
  const loginPage=await loginContext.newPage();loginPage.on('pageerror',e=>errors.push(e.message));await ready(loginPage,'agenda.html');await loginPage.locator('#accountBtn').click();
  await loginPage.locator('#authEmail').fill('qa@example.invalid');await loginPage.locator('#authPassword').fill(' Fixture-password-7! ');await loginPage.locator('#authPassword').press('Enter');await loginPage.locator('#authLoggedIn').waitFor({state:'visible'});
  assert.equal(submittedPassword,' Fixture-password-7! ');assert.equal(await loginPage.locator('#authPassword').inputValue(),'');assert.equal(await loginPage.locator('#authPassword').getAttribute('type'),'password');await loginPage.waitForFunction(()=>document.querySelector('#pmAccountLink').dataset.connection==='connected');completed.push('Mobile keyboard login, password masking and connected-account status');await loginContext.close();
  // Responsive layout and both themes across all four screens.
  for(const width of [1440,390,320])for(const theme of ['light','dark']){
   const c=await localContext(browser,width,theme),p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));
   for(const file of ['index.html','agenda.html','orcamentos.html','contratos.html']){
    await ready(p,file);await p.evaluate(()=>document.fonts.ready);
    assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${file} overflow at ${width}px ${theme}`);
    assert.equal(await p.getAttribute('html','data-pm-theme'),theme);
    if(width<600){const r=await p.locator('.ws-nav').boundingBox();assert(Math.abs(r.y+r.height-1000)<2)}
    if(file==='orcamentos.html'||file==='contratos.html'){
     await p.locator('#wsResumeDocument').click();await p.locator('#wsNextStep').click();assert.equal(await p.locator('#wsStepCount').textContent(),file==='orcamentos.html'?'2 de 7':'2 de 9');
     if(width<1000){await p.locator('#wsTogglePreview').click();await p.locator('.ws-editor-dialog.is-preview').waitFor();await p.locator('#wsTogglePreview').click()}
     assert(await p.locator('.ws-editor-dialog').evaluate(el=>el.scrollWidth<=el.clientWidth),`${file} editor overflow at ${width}`);
     await p.locator('#wsCloseEditor').click();
    }
   }
   completed.push(`Four-screen layouts and editors: ${width}px ${theme}`);await c.close();
  }
  assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:completed,errors},null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
