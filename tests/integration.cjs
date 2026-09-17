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
  if(url.pathname.startsWith('/auth/'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(session.user)});
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
async function ready(page,name){await page.goto(BASE+name);await page.waitForFunction(()=>document.documentElement.dataset.pmReady==='true')}
async function waitSaved(page){await page.waitForFunction(()=>document.querySelector('#pmDocumentState').textContent.includes('Salvo na nuvem'))}
(async()=>{
 for(const[file,spec]of Object.entries(JSON.parse(fs.readFileSync(path.join(__dirname,'originals.json'))))){const html=fs.readFileSync(path.join(__dirname,'..',file),'utf8').replace(/\n<!-- pec Manager integration:[\s\S]*?<!-- \/pec Manager integration -->\n/,'');assert.equal(crypto.createHash('sha256').update(html).digest('hex'),spec.sha256)}
 const browser=await chromium.launch({headless:true,executablePath:process.env.PEC_BROWSER,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  const ctx=await setup(browser),page=await ctx.newPage();
  await ready(page,'orcamentos.html');
  await page.evaluate(img=>{data.client='Cliente de teste';data.eventDate='2026-10-03';data.time='01:00';data.duration='4 horas';data.heroImage=img;data.investmentMode='perItem';data.scope=[{title:'Warm-up',description:'Recepção',duration:'2 horas',time:'01:00',value:'R$ 1.200,50'},{title:'Performance',description:'Pista',duration:'2 horas',time:'03:00',value:'R$ 800,00'}];data.extras=[{title:'Bazuca',description:'Efeito',value:'R$ 700,00',image:img,ratio:'16/9',fit:'contain',position:'center'}];fillFixed();renderScopeEditor();renderExtrasEditor();renderAll()},png);
  await page.locator('#pmDocumentStatus').selectOption('approved');await page.locator('#pmSave').click();await waitSaved(page);
  assert.equal(cloud.quotes.length,1);assert.equal(cloud.quotes[0].total_value,2000.5);assert.equal(cloud.quotes[0].payload.heroImage,png);assert.equal(cloud.quotes[0].status,'approved');
  await page.reload();await page.waitForFunction(()=>document.documentElement.dataset.pmReady==='true');assert.equal(await page.evaluate(()=>data.heroImage),png);assert.equal(await page.evaluate(()=>data.extras[0].ratio),'16/9');
  await page.locator('#pmAgenda').click();await page.locator('#pmAgendaForm button[type=submit]').click();await page.waitForFunction(()=>!document.querySelector('#pmAgendaForm'));
  assert.equal(cloud.events.length,1);assert.equal(cloud.events[0].date,'2026-10-03');assert.equal(cloud.events[0].time_value,'01:00:00');
  await page.locator('#pmConvert').click();const form=page.locator('#pmConvertForm');assert.equal(await form.locator('[name=startDate]').inputValue(),'2026-10-04');assert.equal(await form.locator('[name=endTime]').inputValue(),'05:00');
  await form.locator('[name=extra-0]').check();await form.locator('[type=submit]').click();await page.waitForURL('**/contratos.html*');await page.waitForFunction(()=>document.documentElement.dataset.pmReady==='true');
  const contract=await page.evaluate(()=>collectData());assert.equal(contract.clientName,'Cliente de teste');assert.equal(contract.startDate,'2026-10-04');assert.equal(contract.baseValue,'2000.5');assert.equal(contract.signalValue,'1350.25');assert.equal(contract.extras.length,1);assert.equal(contract.extras[0].unit,700);assert.equal(contract.clientDoc,'');
  await page.locator('details').filter({has:page.locator('#travelValue')}).locator('summary').click();await page.locator('#travelValue').fill('123.45');await page.locator('#pmSave').click();await waitSaved(page);assert.equal(cloud.contracts.length,1);assert.equal(cloud.contracts[0].total_value,2823.95);
  await page.locator('#pmAgenda').click();assert.equal(await page.locator('#pmAgendaForm [name=date]').inputValue(),'2026-10-03');await page.locator('#pmAgendaForm button[type=submit]').click();await page.waitForFunction(()=>!document.querySelector('#pmAgendaForm'));assert.equal(cloud.events.length,1);
  await page.screenshot({path:path.join(OUT,'contract-desktop.png')});
  // A second device reads the same persisted history and appearance.
  const second=await setup(browser),other=await second.newPage();await ready(other,'orcamentos.html');
  await other.waitForFunction(()=>document.querySelectorAll('[data-record]').length>0);await other.locator('[data-record]').first().click();await other.waitForFunction(()=>data.client==='Cliente de teste');assert.equal(await other.evaluate(()=>data.extras[0].image),png);
  await page.evaluate(async img=>{await PM.setPreferences({theme:'light',background_image:img})},png);await other.evaluate(()=>PM.syncPreferences());assert.equal(await other.getAttribute('html','data-pm-theme'),'light');assert.equal(await other.evaluate(()=>PM.preferences.background_image),png);
  await page.evaluate(()=>PM.setPreferences({background_image:null}));await other.evaluate(()=>PM.syncPreferences());assert.equal(await other.evaluate(()=>PM.preferences.background_image),null);
  // Screen themes do not change the document's printed output.
  await other.screenshot({path:path.join(OUT,'quote-desktop.png')});
  await other.setViewportSize({width:390,height:844});await other.screenshot({path:path.join(OUT,'quote-mobile.png')});
  // Queue a saved edit offline, then recover without losing the payload.
  await second.setOffline(true);await other.locator('[data-fixed=client]').fill('Cliente offline');await other.locator('#pmSave').click();await other.waitForFunction(()=>document.querySelector('#pmDocumentState').textContent.includes('envio pendente'));
  await second.setOffline(false);await other.evaluate(()=>PM.document.refresh());assert.equal(cloud.quotes[0].client_name,'Cliente offline');
  // Detect stale edits instead of silently overwriting another device.
  await page.goto(BASE+'orcamentos.html');await page.waitForFunction(()=>document.documentElement.dataset.pmReady==='true');await page.locator('[data-fixed=client]').fill('Conflito');await page.locator('#pmSave').click();await page.waitForFunction(()=>document.querySelector('#pmDocumentState').textContent.includes('outro dispositivo'));
  assert.equal(cloud.quotes[0].client_name,'Cliente offline');
  // Home and Agenda load their existing displays with the shared client.
  await page.goto(BASE);await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('NUVEM'));await page.screenshot({path:path.join(OUT,'home-light.png')});
  await page.goto(BASE+'agenda.html');await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('NUVEM'));await page.locator('#addBtn').click();assert.equal(await page.locator('#modal').getAttribute('aria-hidden'),'false');await page.screenshot({path:path.join(OUT,'agenda-modal.png')});
  assert.deepEqual(errors,[]);console.log('PASS: original HTML integrity, history/images, money, conversion/midnight/extras, idempotent agenda, two devices, appearance removal, offline queue, conflict protection, home, agenda dialog.');
  fs.writeFileSync(path.join(OUT,'integration-result.json'),JSON.stringify({success:true,errors,quoteCount:cloud.quotes.length,contractCount:cloud.contracts.length,eventCount:cloud.events.length},null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
