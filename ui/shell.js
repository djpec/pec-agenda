import {$,icon,esc} from './core.js';
const page=document.body.dataset.pmPage;
const routes=[['home','./','dashboard','Painel'],['agenda','./agenda.html','calendar','Agenda'],['quote','./orcamentos.html','quote','Propostas'],['contract','./contratos.html','contract','Contratos']];
const old=$('#pmHeader'),appearance=$('#pmAppearance'),account=$('#pmAccountLink');
const rail=document.createElement('aside');rail.id='pmHeader';rail.className='ws-rail';
rail.innerHTML=`<a class="ws-monogram" href="./" aria-label="pec Manager · Início"><img src="./assets/brand/pec-logo.png" alt="pec" width="72" height="28"></a><nav class="ws-nav pm-nav" aria-label="Navegação principal">${routes.map(([key,href,name,label])=>`<a href="${href}" title="${label}" ${key===page?'aria-current="page"':''}>${icon(name)}<span>${label}</span></a>`).join('')}</nav><div class="ws-rail-bottom"><span class="ws-rail-line"></span></div>`;
old.replaceWith(rail);account.className='ws-account';account.title='Conta e sincronização';$('.ws-rail-bottom',rail).append(account);
appearance.className='ws-icon-button';appearance.innerHTML=icon('settings');appearance.setAttribute('aria-label','Personalizar aparência');
const top=document.createElement('header');top.className='ws-topbar';top.innerHTML=`<a href="./" class="ws-wordmark" aria-label="pec Manager · Início"><img src="./assets/brand/pec-logo.png" alt="pec" width="96" height="36"><span>manager</span><i>/</i><small>${routes.find(r=>r[0]===page)?.[3]||'Painel'}</small></a><div class="ws-topbar-actions"><span class="ws-today">${new Date().toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'short'})}</span></div>`;
$('.ws-topbar-actions',top).append(appearance);rail.after(top);
const appearanceBody=$('#pmAppearanceDialog .pm-dialog-body');
const colors=document.createElement('section');colors.className='ws-appearance-colors';colors.innerHTML='<label>Cor de destaque</label><div class="ws-swatches">'+[['Azul','#4358db'],['Violeta','#835ad6'],['Terracota','#b94d35'],['Verde','#297b66']].map(([label,color])=>`<button type="button" data-ws-color="${color}" aria-label="${label}" style="--swatch:${color}"></button>`).join('')+'</div>';
appearanceBody.prepend(colors);
function accent(value){if(!/^#[0-9a-f]{6}$/i.test(value))return;document.documentElement.style.setProperty('--ws-accent',value);for(const b of colors.querySelectorAll('button'))b.setAttribute('aria-pressed',String(b.dataset.wsColor===value))}
accent(PM.read('pec-workspace-accent','#4358db'));colors.onclick=e=>{const button=e.target.closest('[data-ws-color]');if(button){PM.write('pec-workspace-accent',button.dataset.wsColor);accent(button.dataset.wsColor)}};
addEventListener('storage',e=>{if(e.key==='pec-workspace-accent')accent(PM.read(e.key,'#4358db'))});
const themeButton=document.createElement('button');themeButton.type='button';themeButton.className='ws-theme-toggle';themeButton.title='Alternar tema claro e escuro';themeButton.setAttribute('aria-label','Alternar tema claro e escuro');themeButton.innerHTML='<span aria-hidden="true">◐</span>';
themeButton.onclick=()=>PM.setPreferences({theme:document.documentElement.dataset.pmTheme==='dark'?'light':'dark'});$('.ws-topbar-actions',top).prepend(themeButton);
// Keep the account control in the header flow on phones; absolute positioning
// overlapped neighboring controls and the iOS standalone status bar.
const mobileHeader=matchMedia('(max-width:600px)');
function placeAccount(){(mobileHeader.matches?$('.ws-topbar-actions',top):$('.ws-rail-bottom',rail)).append(account)}
placeAccount();mobileHeader.addEventListener('change',placeAccount);

export function toast(message){let el=$('#wsToast');if(!el){el=document.createElement('div');el.id='wsToast';el.className='ws-toast';el.setAttribute('role','status');document.body.append(el)}el.textContent=message;el.classList.add('is-visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('is-visible'),4000)}
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const motionKey='pec-workspace-motion';
const ambient=document.createElement('div');ambient.className='ws-ambient';ambient.setAttribute('aria-hidden','true');ambient.innerHTML=`<div class="ws-aurora"><i></i><i></i><i></i></div><div class="ws-light-ribbon"></div><div class="ws-orbit"><i></i><i></i><i></i></div><div class="ws-particles">${Array.from({length:16},(_,i)=>`<i style="--x:${(i*37+9)%100}%;--y:${(i*23+12)%100}%;--delay:-${i*.7}s;--duration:${5+i%5}s;--size:${3+i%3}px"></i>`).join('')}</div><div class="ws-background-equalizer">${Array.from({length:24},(_,i)=>`<i style="--delay:-${i*.13}s;--duration:${1.2+(i%5)*.23}s;--bar:${20+(i*31)%80}%"></i>`).join('')}</div>`;$('#pmBackdrop').after(ambient);
const motionSettings=document.createElement('section');motionSettings.className='ws-motion-setting';motionSettings.innerHTML='<label class="pm-check"><input id="wsMotionToggle" type="checkbox">Efeitos de movimento</label><p id="wsMotionNote"></p>';
appearanceBody.append(motionSettings);
function motionActive(){return PM.read(motionKey,true)!==false&&!reducedMotion.matches}
function applyMotion(){document.documentElement.dataset.wsMotion=motionActive()?'on':'off';$('#wsMotionToggle').checked=PM.read(motionKey,true)!==false;$('#wsMotionNote').textContent=reducedMotion.matches?'O aparelho está configurado para reduzir movimentos.':'Luzes de palco, aurora e partículas em movimento. A preferência fica salva neste navegador.'}
$('#wsMotionToggle').onchange=e=>{PM.write(motionKey,e.target.checked);applyMotion()};reducedMotion.addEventListener('change',applyMotion);addEventListener('storage',e=>{if(e.key===motionKey)applyMotion()});applyMotion();
let savedScroll=null;
function lockPage(){if(savedScroll!==null)return;savedScroll=window.scrollY;document.body.style.setProperty('--ws-scroll-y',`${-savedScroll}px`);document.body.classList.add('ws-dialog-open')}
function unlockPage(){if(document.querySelector('dialog[open]')||savedScroll===null)return;const top=savedScroll;savedScroll=null;document.body.classList.remove('ws-dialog-open');document.body.style.removeProperty('--ws-scroll-y');window.scrollTo({top,behavior:'instant'})}
export function installDialogFocus(dialog){
 if(dialog.dataset.wsDialogReady)return;dialog.dataset.wsDialogReady='true';let trigger,closing;
 const originalShow=dialog.showModal.bind(dialog),originalClose=dialog.close.bind(dialog);
 dialog.addEventListener('close',()=>{closing?.cancel();closing=null;delete dialog.dataset.wsClosing;unlockPage();if(trigger?.isConnected)trigger.focus({preventScroll:true})});
 dialog.showModal=()=>{if(closing){closing.cancel();closing=null;delete dialog.dataset.wsClosing}if(dialog.open)return;trigger=document.activeElement;lockPage();try{originalShow()}catch(error){unlockPage();throw error}};
 dialog.close=value=>{
  if(!dialog.open||!motionActive()||typeof dialog.animate!=='function'){originalClose(value);return}if(closing)return;
  dialog.dataset.wsClosing='true';const animation=dialog.animate(mobileHeader.matches?[{opacity:1},{opacity:0}]:[{opacity:1,transform:'translateY(0) scale(1)'},{opacity:0,transform:'translateY(10px) scale(.985)'}],{duration:150,easing:'ease-in',fill:'forwards'});closing=animation;
  animation.finished.then(()=>{if(closing!==animation)return;closing=null;delete dialog.dataset.wsClosing;originalClose(value);animation.cancel()}).catch(()=>{});
 };
 dialog.addEventListener('cancel',event=>{event.preventDefault();dialog.close()});
 dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});
}
installDialogFocus($('#pmAppearanceDialog'));
