// Printed document colors must remain readable independently of the app theme.
const {chromium}=require('playwright');const assert=require('node:assert/strict');
const BASE=process.env.PEC_TEST_URL||'http://127.0.0.1:8765/';
const luminance=color=>color.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{const c=v/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4}).reduce((a,c,i)=>a+c*[.2126,.7152,.0722][i],0);
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.PEC_BROWSER,args:['--no-sandbox','--disable-dev-shm-usage']});try{
 for(const width of [1440,390])for(const theme of ['light','dark']){
  const c=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block'});
  await c.addInitScript(theme=>{localStorage.setItem('pec-manager-preferences-v1',JSON.stringify({theme}));localStorage.setItem('pec-manager-pref-migrated','true')},theme);
  await c.route('https://**.supabase.co/**',r=>r.fulfill({status:200,contentType:'application/json',body:'[]'}));const p=await c.newPage();
  for(const file of ['contratos.html','orcamentos.html']){
   await p.emulateMedia({media:'screen'});await p.goto(BASE+file);await p.waitForFunction(()=>document.documentElement.dataset.workspaceReady==='true');await p.locator('#wsResumeDocument').click();if(width<1000)await p.locator('#wsTogglePreview').click();
   const root=file==='contratos.html'?'.paper':'.doc';
   const colors=await p.locator(root).first().evaluate(el=>{const style=getComputedStyle(el);return{color:style.color,expected:style.getPropertyValue(el.matches('.paper')?'--text':'--ink').trim()}});
   const ratio=1.05/(luminance(colors.color)+.05);assert(ratio>=4.5,`${file} ${width}px ${theme}: document text contrast on white is ${ratio.toFixed(2)}:1 (${colors.color})`);
   if(file==='contratos.html')for(const selector of ['.paper .title','.paper .parties p','.paper .clause p']){const color=await p.locator(selector).first().evaluate(el=>getComputedStyle(el).color);assert(1.05/(luminance(color)+.05)>=4.5,`${selector} must be readable in ${theme}`)}
   // The white-on-dark hero in a quote is intentional and must remain unchanged.
   if(file==='orcamentos.html'){const hero=await p.locator('.doc .hero').evaluate(el=>({text:getComputedStyle(el).color,bg:getComputedStyle(el).backgroundColor}));assert(luminance(hero.text)>.5)}
   await p.emulateMedia({media:'print'});assert(1.05/(luminance(await p.locator(root).first().evaluate(el=>getComputedStyle(el).color))+.05)>=4.5,'Print text must remain dark');
   console.log(`PASS: ${file} ${width}px ${theme}: ${ratio.toFixed(1)}:1 text contrast`);
  }
  await c.close();
 }
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
