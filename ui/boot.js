/* Runs in <head>: restore local appearance before paint and never expose legacy editors. */
(()=>{
 const root=document.documentElement;root.dataset.wsBoot='pending';root.dataset.wsAccess='pending';
 try{const prefs=JSON.parse(localStorage.getItem('pec-manager-preferences-v1')||'{}');const mode=prefs.theme||'light';root.dataset.pmTheme=mode==='auto'?(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'):mode;
 const accent=JSON.parse(localStorage.getItem('pec-workspace-accent')||'"#4358db"');if(/^#[0-9a-f]{6}$/i.test(accent))root.style.setProperty('--ws-accent',accent);
 }catch{root.dataset.pmTheme='light'}
 function ready(){if(root.dataset.workspaceReady!=='true')return;root.dataset.wsBoot='ready';document.getElementById('wsBootError')?.remove();observer.disconnect();clearTimeout(timeout)}
 const observer=new MutationObserver(ready);observer.observe(root,{attributes:true,attributeFilter:['data-workspace-ready']});
 const timeout=setTimeout(()=>{if(root.dataset.workspaceReady==='true')return;root.dataset.wsBoot='error';const error=document.createElement('section');error.id='wsBootError';error.className='ws-boot-error';error.innerHTML='<strong>Não foi possível abrir esta tela.</strong><p>Confira a conexão e tente novamente.</p><button type="button">Recarregar</button>';error.querySelector('button').onclick=()=>location.reload();document.body.append(error)},12000);
})();
