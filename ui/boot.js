/* Runs in <head>: restore local appearance before paint and never expose legacy editors. */
(()=>{
 const root=document.documentElement;root.dataset.wsBoot='pending';
 try{const prefs=JSON.parse(localStorage.getItem('pec-manager-preferences-v1')||'{}');const mode=prefs.theme||'light';root.dataset.pmTheme=mode==='auto'?(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'):mode;
 const accent=JSON.parse(localStorage.getItem('pec-workspace-accent')||'"#4358db"');if(/^#[0-9a-f]{6}$/i.test(accent))root.style.setProperty('--ws-accent',accent);
 }catch{root.dataset.pmTheme='light'}
 function showIntro(){
  // Only an ordinary dashboard visit gets a once-per-tab opening; deep links stay immediate.
  if(!navigator.onLine||!['/','/index.html'].includes(location.pathname)||location.search||matchMedia('(prefers-reduced-motion:reduce)').matches)return;
  try{if(sessionStorage.getItem('pec-brand-intro-v1')||JSON.parse(localStorage.getItem('pec-workspace-motion')||'true')===false)return;sessionStorage.setItem('pec-brand-intro-v1','seen')}catch{return}
  const intro=document.createElement('dialog');intro.id='wsBrandIntro';intro.setAttribute('aria-label','Abertura pec Manager');
  intro.innerHTML='<video muted playsinline preload="none" poster="./assets/brand/pec-intro-poster.jpg" aria-hidden="true"></video><div class="ws-intro-caption"><span>PEC / SUA CENTRAL DE EVENTOS</span><button type="button">Pular abertura <span aria-hidden="true">→</span></button></div>';
  const video=intro.querySelector('video'),skip=intro.querySelector('button'),previous=document.activeElement;let finished=false,startTimer,endTimer;
  function finish(){if(finished)return;finished=true;reduced.removeEventListener('change',cancelOnMotion);clearTimeout(startTimer);clearTimeout(endTimer);video.pause();if(intro.open)intro.close();intro.remove();document.documentElement.classList.remove('ws-intro-active');if(previous?.isConnected)previous.focus({preventScroll:true})}
  function cancelOnMotion(){if(matchMedia('(prefers-reduced-motion:reduce)').matches)finish()}
  const reduced=matchMedia('(prefers-reduced-motion:reduce)');reduced.addEventListener('change',cancelOnMotion,{once:true});
  skip.onclick=finish;intro.addEventListener('cancel',finish);intro.addEventListener('close',()=>{reduced.removeEventListener('change',cancelOnMotion);finish()},{once:true});
  video.muted=true;video.playsInline=true;video.addEventListener('error',finish,{once:true});video.addEventListener('ended',finish,{once:true});
  video.addEventListener('canplay',()=>{if(finished)return;clearTimeout(startTimer);video.play().catch(finish);endTimer=setTimeout(finish,4300)},{once:true});
  // A slow, unavailable or offline video must not delay access to the actual app.
  document.body.append(intro);try{intro.showModal()}catch{finish();return}document.documentElement.classList.add('ws-intro-active');skip.focus({preventScroll:true});startTimer=setTimeout(finish,1400);video.src='./assets/brand/pec-intro.mp4';video.load();
 }
 function ready(){if(root.dataset.workspaceReady!=='true')return;root.dataset.wsBoot='ready';document.getElementById('wsBootError')?.remove();observer.disconnect();clearTimeout(timeout);showIntro()}
 const observer=new MutationObserver(ready);observer.observe(root,{attributes:true,attributeFilter:['data-workspace-ready']});
 const timeout=setTimeout(()=>{if(root.dataset.workspaceReady==='true')return;root.dataset.wsBoot='error';const error=document.createElement('section');error.id='wsBootError';error.className='ws-boot-error';error.innerHTML='<strong>Não foi possível abrir esta tela.</strong><p>Confira a conexão e tente novamente.</p><button type="button">Recarregar</button>';error.querySelector('button').onclick=()=>location.reload();document.body.append(error)},12000);
})();
