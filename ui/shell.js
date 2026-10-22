import {$,icon,esc} from './core.js';
const page=document.body.dataset.pmPage;
const routes=[['home','./','dashboard','Painel'],['agenda','./agenda.html','calendar','Agenda'],['quote','./orcamentos.html','quote','Propostas'],['contract','./contratos.html','contract','Contratos']];
const old=$('#pmHeader'),appearance=$('#pmAppearance'),account=$('#pmAccountLink');
const rail=document.createElement('aside');rail.id='pmHeader';rail.className='ws-rail';
rail.innerHTML=`<a class="ws-monogram" href="./" aria-label="pec Manager · Início">p<span>.</span></a><nav class="ws-nav pm-nav" aria-label="Navegação principal">${routes.map(([key,href,name,label])=>`<a href="${href}" title="${label}" ${key===page?'aria-current="page"':''}>${icon(name)}<span>${label}</span></a>`).join('')}</nav><div class="ws-rail-bottom"><span class="ws-rail-line"></span></div>`;
old.replaceWith(rail);account.className='ws-account';account.title='Conta e sincronização';$('.ws-rail-bottom',rail).append(account);
appearance.className='ws-icon-button';appearance.innerHTML=icon('settings');appearance.setAttribute('aria-label','Personalizar aparência');
const top=document.createElement('header');top.className='ws-topbar';top.innerHTML=`<a href="./" class="ws-wordmark">pec<span>manager</span><i>/</i><small>${routes.find(r=>r[0]===page)?.[3]||'Painel'}</small></a><div class="ws-topbar-actions"><span class="ws-today">${new Date().toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'short'})}</span></div>`;
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
export function installDialogFocus(dialog){let trigger;dialog.addEventListener('close',()=>{document.body.classList.remove('ws-dialog-open');if(trigger?.isConnected)trigger.focus()});const original=dialog.showModal.bind(dialog);dialog.showModal=()=>{trigger=document.activeElement;original();document.body.classList.add('ws-dialog-open')};dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}})}
