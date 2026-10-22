/* Backstage interface: preserves the existing editors and storage adapters. */
(() => {
 'use strict';
 const P=window.PM,$=s=>document.querySelector(s);
 const accentKey='pec-manager-accent-v1';
 const palette=[['Amarelo','#ecff58'],['Laranja','#ff9b58'],['Rosa','#ff7db4'],['Lilás','#b9a0ff'],['Azul','#78baff'],['Verde','#7de0b1']];
 function accent(value){
  const hex=/^#[0-9a-f]{6}$/i.test(value)?value:'#ecff58';
  const l=hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4).reduce((s,c,i)=>s+c*[.2126,.7152,.0722][i],0);
  document.documentElement.style.setProperty('--bs-accent',hex);
  document.documentElement.style.setProperty('--bs-ink',l>.179?'#131411':'#ffffff');
  P.write(accentKey,hex);
  document.querySelectorAll('[data-bs-color]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.bsColor===hex)));
  if($('#bsCustomColor'))$('#bsCustomColor').value=hex;
 }
 accent(P.read(accentKey,'#ecff58'));
 addEventListener('storage',e=>{if(e.key===accentKey)accent(P.read(accentKey,'#ecff58'))});
 const appearance=$('#pmAppearance'),settings=$('#pmAppearanceDialog');
 appearance.setAttribute('aria-label','Configurações');appearance.title='Configurações';
 appearance.innerHTML='<svg class="pm-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m9 3-.7 2.4-2 .9L4 5.8 2 9.2l1.7 1.8v2L2 14.8 4 18.2l2.3-.5 2 .9L9 21h4l.7-2.4 2-.9 2.3.5 2-3.4-1.7-1.8v-2L20 9.2l-2-3.4-2.3.5-2-.9L13 3Z"/><circle cx="11" cy="12" r="3"/></svg>';
 settings.querySelector('h2').textContent='Configurações';
 const colors=document.createElement('section');colors.className='bs-colors';
 colors.innerHTML='<h3>Cor de destaque</h3><p>Personalize os botões e destaques do sistema.</p><div class="bs-swatches">'+palette.map(([name,hex])=>`<button type="button" data-bs-color="${hex}" aria-label="${name}" aria-pressed="false" style="background:${hex}"></button>`).join('')+'</div><label>Cor personalizada<input id="bsCustomColor" type="color"></label><small>A cor fica salva neste navegador, em todos os módulos.</small>';
 settings.querySelector('.pm-dialog-body').prepend(colors);
 colors.addEventListener('click',e=>{const b=e.target.closest('[data-bs-color]');if(b)accent(b.dataset.bsColor)});
 $('#bsCustomColor').addEventListener('input',e=>accent(e.target.value));accent(P.read(accentKey,'#ecff58'));
 const top=document.createElement('div');top.className='bs-topbar';
 top.innerHTML='<span>Workspace <b>'+({home:'Visão geral',agenda:'Agenda',quote:'Orçamentos',contract:'Contratos'}[document.body.dataset.pmPage])+'</b></span>';
 top.append(appearance);$('#pmHeader').after(top);
 const brand=$('.pm-brand-logo');brand.textContent='pec.';
 $('.pm-brand-copy').innerHTML='<b>MANAGER</b><small>BACKSTAGE</small>';
 const page=document.body.dataset.pmPage;
 if(page==='agenda'){
  const modal=$('#modal'),sheet=modal.querySelector('.sheet');sheet.setAttribute('role','dialog');sheet.setAttribute('aria-modal','true');sheet.setAttribute('aria-labelledby','formTitle');
  $('#closeBtn').setAttribute('aria-label','Fechar lançamento');
  let trigger;
  function syncEventModal(){const open=modal.classList.contains('open');for(const el of [$('#pmHeader'),$('.bs-topbar'),$('body>.app'),$('#addBtn')])if(el)el.inert=open;if(open){trigger=document.activeElement;$('#title').focus()}else if(trigger?.isConnected)trigger.focus()}new MutationObserver(syncEventModal).observe(modal,{attributes:true,attributeFilter:['class']});syncEventModal();modal.querySelectorAll('.field').forEach(field=>{const label=field.querySelector('label'),input=field.querySelector('input,select,textarea');if(label&&input?.id)label.htmlFor=input.id});
  modal.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();window.closeForm()}if(e.key==='Tab'){const a=[...modal.querySelectorAll('input,select,textarea,button')].filter(x=>!x.disabled&&x.getClientRects().length);if(e.shiftKey&&document.activeElement===a[0]){e.preventDefault();a.at(-1).focus()}else if(!e.shiftKey&&document.activeElement===a.at(-1)){e.preventDefault();a[0].focus()}}});
 }
 if(!['quote','contract'].includes(page))return;
 const requestedOpen=!!location.search;
 function setup(){
  if(document.documentElement.dataset.pmReady!=='true')return false;
  const editor=$(page==='quote'?'.editor':'.sidebar'),preview=$(page==='quote'?'.stage':'.workspace'),panel=$('#pmDocumentTools');
  if(!editor||!preview||!panel)return false;
  const name=page==='quote'?'orçamento':'contrato';
  const library=document.createElement('main');library.className='bs-library';
  library.innerHTML=`<div class="bs-page-heading"><div><span class="bs-eyebrow">SEU BACKSTAGE</span><h1>${page==='quote'?'Boas propostas.<br>Grandes noites.':'Tudo combinado.<br>Tudo no papel.'}</h1><p>${page==='quote'?'Do orçamento ao evento fechado.':'Seus contratos, organizados por cliente.'}</p></div><button class="bs-primary" id="bsNewDocument">Novo ${name}</button></div><div class="bs-resume"><div><b>Continue de onde parou</b><p>Abra o editor para revisar seu rascunho.</p></div><button id="bsResume">Abrir editor ↗</button></div>`;
  library.append(panel);top.after(library);
  const dialog=document.createElement('dialog');dialog.className='bs-editor-dialog';dialog.setAttribute('aria-labelledby','bsEditorTitle');
  dialog.innerHTML=`<div class="bs-dialog-heading"><div><small>PEC MANAGER</small><h2 id="bsEditorTitle">Editor de ${name}</h2></div><div><button id="bsPreviewToggle" type="button">Ver documento</button><button id="bsCloseEditor" type="button" aria-label="Fechar editor">Fechar ×</button></div></div><div class="bs-editor-layout"></div>`;
  const layout=dialog.querySelector('.bs-editor-layout');layout.append(editor,preview);document.body.append(dialog);
  editor.querySelector('.brand')?.classList.add('bs-hide');editor.querySelector('h1')?.classList.add('bs-hide');editor.querySelector('.lead')?.classList.add('bs-hide');
  const sections=[...editor.querySelectorAll(':scope > details')];
  const steps=document.createElement('nav');steps.className='bs-steps';steps.setAttribute('aria-label','Etapas do documento');
  let current=0;
  const labels=page==='contract'?['Identificação','Seus dados','Cliente','Evento','Valores','Adicionais','Equipamentos','Deslocamento','Cláusulas']:['Visual','Cliente e evento','Serviços','Investimento','Adicionais','Pagamento','Contato'];
  sections.forEach((section,i)=>{section.open=true;const b=document.createElement('button');b.type='button';b.textContent=(i+1)+'. '+(labels[i]||section.querySelector('summary').textContent);b.onclick=()=>showStep(i);steps.append(b)});
  editor.prepend(steps);
  const footer=document.createElement('div');footer.className='bs-editor-footer';footer.innerHTML='<button id="bsPrevStep" type="button">Voltar</button><span id="bsStepCount"></span><button class="bs-primary" id="bsNextStep" type="button">Próxima etapa →</button>';editor.append(footer);
  const savebar=document.createElement('div');savebar.className='bs-savebar';savebar.innerHTML='<span id="bsSaveState" role="status"></span><button class="bs-primary" id="bsSaveDocument" type="button">Salvar no histórico</button>';dialog.append(savebar);
  const status=$('#pmDocumentState');new MutationObserver(()=>{$('#bsSaveState').textContent=status.textContent}).observe(status,{childList:true,subtree:true,characterData:true});$('#bsSaveState').textContent=status.textContent;
  function showStep(i){current=Math.max(0,Math.min(sections.length-1,i));sections.forEach((s,n)=>s.hidden=n!==current);[...steps.children].forEach((b,n)=>{if(n===current)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current')});$('#bsPrevStep').disabled=current===0;$('#bsNextStep').textContent=current===sections.length-1?'Salvar no histórico':'Próxima etapa →';$('#bsStepCount').textContent=(current+1)+' de '+sections.length;}
  function open(){if(!dialog.open)dialog.showModal();}
  $('#bsPrevStep').onclick=()=>showStep(current-1);$('#bsNextStep').onclick=()=>current===sections.length-1?P.document.save():showStep(current+1);
  $('#bsSaveDocument').onclick=()=>P.document.save();$('#bsResume').onclick=open;$('#bsCloseEditor').onclick=()=>dialog.close();
  $('#bsPreviewToggle').onclick=()=>{const visible=dialog.classList.toggle('bs-show-document');$('#bsPreviewToggle').textContent=visible?'Voltar ao formulário':'Ver documento'};
  $('#bsNewDocument').onclick=()=>$('#pmNew').click();
  addEventListener('pm:document-open',()=>{showStep(0);open()});
  // Keep print layout in its original parent; native dialogs otherwise clip pages.
  const printMarker=document.createComment('document-position');preview.before(printMarker);
  addEventListener('beforeprint',()=>{document.body.append(preview);preview.classList.add('bs-print-target')});
  addEventListener('afterprint',()=>{printMarker.after(preview);preview.classList.remove('bs-print-target')});
  showStep(0);if(requestedOpen)open();return true;
 }
 if(!setup()){const observer=new MutationObserver(()=>{if(setup())observer.disconnect()});observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-pm-ready']})}
})();
