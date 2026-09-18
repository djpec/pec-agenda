// Mobile login regression: real browser/SDK with intercepted Auth responses.
// No real credentials, account changes or cloud writes.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'..');
const OUT=process.env.PEC_QA_DIR||path.join(require('node:os').tmpdir(),'pec-auth-qa');
fs.mkdirSync(OUT,{recursive:true});
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost'),file=path.join(ROOT,url.pathname==='/'?'index.html':decodeURIComponent(url.pathname));
  if(!file.startsWith(ROOT+path.sep)){res.writeHead(403).end();return}
  fs.readFile(file,(err,data)=>{res.writeHead(err?404:200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(err?'Not found':data)});
});
const b64=value=>Buffer.from(JSON.stringify(value)).toString('base64url');
const uid='11111111-1111-4111-8111-111111111111';
const user={id:uid,email:'qa@example.invalid',aud:'authenticated',role:'authenticated',app_metadata:{},user_metadata:{}};
const session={access_token:`${b64({alg:'HS256',typ:'JWT'})}.${b64({sub:uid,aud:'authenticated',role:'authenticated',exp:Math.floor(Date.now()/1000)+3600})}.fixture`,refresh_token:'fixture',expires_in:3600,token_type:'bearer',user};
const fakePassword=' Fictional-password-7! ';
(async()=>{
  for(const[file,spec]of Object.entries(JSON.parse(fs.readFileSync(path.join(__dirname,'originals.json'))))){
    const html=fs.readFileSync(path.join(ROOT,file),'utf8').replace(/\n<!-- pec Manager integration:[\s\S]*?<!-- \/pec Manager integration -->\n/,'');
    assert.equal(crypto.createHash('sha256').update(html).digest('hex'),spec.sha256);
  }
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}/`;
  const browser=await chromium.launch({headless:true,executablePath:process.env.PEC_BROWSER,args:['--no-sandbox','--disable-dev-shm-usage']});
  const results=[],pageErrors=[];
  try{
    for(const width of [390,320]){
      const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1,serviceWorkers:'block'});
      await context.addInitScript(()=>localStorage.setItem('pec-manager-preferences-v1',JSON.stringify({theme:'light'})));
      let outcome={status:400,code:'invalid_credentials'},requests=0;
      await context.route('https://qmhyeotvbktdilrudwys.supabase.co/**',async route=>{
        const request=route.request(),url=new URL(request.url());
        if(url.pathname==='/auth/v1/token'){
          requests++;
          assert.equal(request.postDataJSON().password,fakePassword,'Passwords must not be trimmed or changed');
          if(outcome.network)return route.abort('failed');
          return route.fulfill({status:outcome.status,contentType:'application/json',body:JSON.stringify(outcome.status===200?session:{code:outcome.status,error_code:outcome.code,msg:outcome.code})});
        }
        return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(url.pathname==='/auth/v1/user'?user:url.pathname.endsWith('/user_preferences')?null:[])});
      });
      const page=await context.newPage();page.on('pageerror',error=>pageErrors.push(error.message));
      await page.goto(base);
      await page.locator('#pmAccountLink').tap();
      await page.waitForURL('**/agenda.html?account=1');
      await page.locator('#authEmail').waitFor({state:'visible'});
      assert.equal(await page.locator('#accountModal').getAttribute('aria-hidden'),'false');
      await page.locator('#authEmail').fill('qa@example.invalid');
      await page.locator('#authPassword').fill(fakePassword);
      await page.getByRole('button',{name:'Mostrar senha'}).tap();
      assert.equal(await page.locator('#authPassword').getAttribute('type'),'text');
      await page.locator('#accountClose').tap();
      await page.locator('#pmAccountLink').tap();
      assert.equal(await page.locator('#authPassword').getAttribute('type'),'password');
      const dimensions=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,input:document.querySelector('#authPassword').getBoundingClientRect().width,toggle:document.querySelector('#togglePassword').getBoundingClientRect().right}));
      assert.ok(dimensions.scroll<=dimensions.width&&dimensions.toggle<=dimensions.width&&dimensions.input>130,'Mobile controls must fit');
      const scenarios=width===390?[
        [{status:400,code:'invalid_credentials'},'E-mail ou senha incorretos'],
        [{status:400,code:'email_not_confirmed'},'Confirme sua conta'],
        [{status:429,code:'over_request_rate_limit'},'Muitas tentativas'],
        [{status:503,code:'unexpected_failure'},'temporariamente indisponível'],
        [{network:true},'Confira a internet ou tente outra rede'],
        [{status:400,code:'bad_json'},'Não foi possível entrar agora']
      ]:[[{status:400,code:'invalid_credentials'},'E-mail ou senha incorretos']];
      for(const[response,message]of scenarios){
        outcome=response;const before=requests;
        await page.locator('#loginBtn').tap();
        await page.waitForFunction(text=>document.querySelector('#authMessage').textContent.includes(text),message,{timeout:10000});
        assert.equal(requests,before+1,'One request per submit');
        assert.equal(await page.locator('#loginBtn').isDisabled(),false);
        assert.equal(await page.locator('#signupBtn').isDisabled(),false);
        assert.equal(await page.locator('#authPassword').inputValue(),fakePassword);
        results.push(`${width}px: ${response.code||'network failure'}`);
      }
      await context.setOffline(true);
      const beforeOffline=requests;
      await page.locator('#loginBtn').tap();
      await page.waitForFunction(()=>document.querySelector('#authMessage').textContent.includes('Sem internet'));
      assert.equal(requests,beforeOffline,'Offline must not send a login request');
      await context.setOffline(false);
      await page.screenshot({path:path.join(OUT,`login-light-${width}.png`)});
      await page.evaluate(()=>PM.setPreferences({theme:'dark'}));
      await page.screenshot({path:path.join(OUT,`login-dark-${width}.png`)});
      outcome={status:200};
      await page.locator('#authPassword').press('Enter');
      await page.locator('#authLoggedIn').waitFor({state:'visible'});
      assert.equal(await page.locator('#authPassword').inputValue(),'');
      assert.equal(await page.locator('#status').innerText(),'NUVEM ✓');
      await page.waitForFunction(()=>document.querySelector('#pmAccountLink').dataset.connection==='connected');
      results.push(`${width}px: mobile keyboard login, masked password, success`);
      await context.close();
    }
    assert.deepEqual(pageErrors,[]);
    console.log(JSON.stringify({success:true,results,pageErrors},null,2));
  }finally{await browser.close();server.close()}
})().catch(error=>{console.error(error);server.close();process.exitCode=1});
