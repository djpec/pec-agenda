import {$,icon,esc,empty} from './core.js';
import {installDialogFocus,toast} from './shell.js?v=29';
const P=window.PM,type=document.body.dataset.pmPage,name=type==='quote'?'proposta':'contrato',isQuote=type==='quote',requested=!!location.search;
async function setup(){
 await P.ready;
 if(document.documentElement.dataset.pmReady!=='true')await new Promise(resolve=>{const o=new MutationObserver(()=>{if(document.documentElement.dataset.pmReady==='true'){o.disconnect();resolve()}});o.observe(document.documentElement,{attributes:true,attributeFilter:['data-pm-ready']})});
 const editor=$(isQuote?'.editor':'.sidebar'),preview=$(isQuote?'.stage':'.workspace'),panel=$('#pmDocumentTools');
 // Apply the brand without altering document fields, clauses or saved data.
 for(const mark of document.querySelectorAll('.pmark,.brand-mark .logo')){mark.classList.add('ws-brand-document-mark');mark.innerHTML='<img src="./assets/brand/pec-logo-badge.svg" alt="pec" width="100" height="34">'}
 if(isQuote){
  const brand=document.querySelector('.doc .brand');
  const wordmark=()=>{const image=document.createElement('img');image.src='./assets/brand/pec-logo-badge.svg';image.alt='pec';image.width=92;image.height=32;image.className='ws-quote-wordmark';return image};
  if(brand){for(const node of [...brand.childNodes])if(node.nodeType===Node.TEXT_NODE)node.remove();brand.prepend(wordmark())}
  for(const mark of document.querySelectorAll('.doc .footer-mark,.doc .print-footer-brand strong'))mark.replaceChildren(wordmark());
 }
 const main=document.createElement('main');main.id='workspace';main.className='ws-main ws-documents';
 main.innerHTML=`<section class="ws-heading"><div><div class="ws-eyebrow">${isQuote?'DA PRIMEIRA IDEIA AO SIM':'COMBINADOS QUE VIRAM HISTÓRIAS'}</div><h1>${isQuote?'Boas ideias,<br>grandes <em>propostas.</em>':'Tudo certo.<br>Tudo <em>combinado.</em>'}</h1><p>${isQuote?'Apresente sua experiência e acompanhe cada negociação.':'Do acordo à assinatura, organize o que importa.'}</p></div><div class="ws-heading-actions"><button class="ws-button" id="wsNewDocument" type="button">${icon('plus')}Nov${isQuote?'a proposta':'o contrato'}</button></div></section>
 <section class="ws-document-resume"><div>${icon('edit')}<div><h2>Um trabalho em andamento.</h2><p>Seu rascunho fica guardado neste navegador. Continue de onde parou.</p></div></div><button class="ws-button" id="wsResumeDocument" type="button">Continuar edição ${icon('arrow')}</button></section>
 <div class="ws-document-toolbar"><div class="ws-document-filters" aria-label="Filtrar documentos por status">${[['all','Todos'],['draft','Rascunhos'],['sent','Enviados'],[isQuote?'approved':'signed',isQuote?'Aprovados':'Assinados'],[isQuote?'declined':'cancelled',isQuote?'Recusados':'Cancelados']].map(([key,label])=>`<button type="button" data-filter="${key}" aria-pressed="${key==='all'}">${label}</button>`).join('')}</div><label class="ws-search" id="wsSearchSlot">${icon('search')}</label></div><p class="ws-result-count" id="wsDocumentCount" aria-live="polite"></p><div id="wsDocumentPanel"></div><footer class="ws-footer"><span>Seu histórico, organizado por cliente e etapa.</span><a href="./agenda.html?account=1">Conta e sincronização ${icon('arrow')}</a></footer>`;
 $('.ws-topbar').after(main);$('#wsDocumentPanel',main).append(panel);
 const history=$('#pmHistory');history.className='ws-document-history';
 const search=$('#pmHistorySearch'),searchLabel=search.parentElement;search.setAttribute('aria-label','Buscar documentos por cliente, número ou data');search.placeholder='Buscar cliente, número ou data…';$('#wsSearchSlot',main).append(search);searchLabel.remove();
 const head=document.createElement('div');head.className='ws-document-tablehead';head.innerHTML='<span>Cliente / documento</span><span>Evento</span><span>Investimento</span><span>Status</span><span></span>';history.before(head);
 // Keep the original source documents and their data adapters inside a new workspace.
 const dialog=document.createElement('dialog');dialog.className='ws-editor-dialog';dialog.setAttribute('aria-labelledby','wsEditorTitle');
 dialog.innerHTML=`<header class="ws-editor-header"><div><small>PEC / ESPAÇO DE CRIAÇÃO</small><h2 id="wsEditorTitle">${isQuote?'Construa sua proposta':'Prepare seu contrato'}</h2></div><div class="ws-editor-header-actions"><button class="ws-button is-secondary" id="wsTogglePreview" type="button">Ver documento</button><button class="ws-icon-button" id="wsCloseEditor" type="button" aria-label="Fechar editor">${icon('close')}</button></div></header><div class="ws-editor-grid"><aside class="ws-editor-steps"><span>SEU ROTEIRO</span><nav aria-label="Etapas do documento" id="wsDocumentSteps"></nav></aside></div><footer class="ws-editor-bottom"><span id="wsEditorState" role="status"></span><button class="ws-button" id="wsSaveDocument" type="button">${icon('check')}Salvar no histórico</button></footer>`;
 const grid=$('.ws-editor-grid',dialog);grid.append(editor,preview);document.body.append(dialog);installDialogFocus(dialog);
 const controls=document.createElement('div');controls.className='ws-editor-controls';const body=$('.pm-tools-body',panel);
 // All IDs remain connected to the same document adapter.
 for(const el of [...body.children])if(el!==history&&el!==head&&el.id!=='pmHistoryMore')controls.append(el);
 editor.prepend(controls);
 const sections=[...editor.querySelectorAll(':scope>details')];const steps=$('#wsDocumentSteps',dialog);let current=0;
 const labels=isQuote?['Identidade visual','Cliente e evento','Experiência e serviços','Investimento','Adicionais','Pagamento','Contato']:['Identificação','Seus dados','Cliente','Evento','Valores','Adicionais','Equipamentos','Deslocamento','Cláusulas'];
 sections.forEach((section,i)=>{section.open=true;const button=document.createElement('button');button.type='button';button.innerHTML=`<b>${String(i+1).padStart(2,'0')}</b><span>${labels[i]||esc(section.querySelector('summary').textContent)}</span>`;button.onclick=()=>showStep(i);steps.append(button)});
 const footer=document.createElement('div');footer.className='ws-step-footer';footer.innerHTML='<button class="ws-button is-secondary" id="wsPreviousStep" type="button">Voltar</button><small id="wsStepCount"></small><button class="ws-button" id="wsNextStep" type="button">Continuar</button>';editor.append(footer);
 function showStep(index){current=Math.max(0,Math.min(sections.length-1,index));sections.forEach((section,i)=>section.hidden=i!==current);[...steps.children].forEach((b,i)=>{if(i===current)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current')});$('#wsPreviousStep').disabled=current===0;$('#wsStepCount').textContent=`${current+1} de ${sections.length}`;$('#wsNextStep').textContent=current===sections.length-1?'Salvar documento':'Próxima etapa';editor.scrollTop=0;steps.children[current]?.scrollIntoView({block:'nearest',inline:'nearest'})}
 function open(){if(!dialog.open)dialog.showModal()}
 $('#wsNewDocument').onclick=()=>$('#pmNew').click();$('#wsResumeDocument').onclick=open;$('#wsCloseEditor').onclick=()=>dialog.close();
 $('#wsPreviousStep').onclick=()=>showStep(current-1);$('#wsNextStep').onclick=async()=>{if(current===sections.length-1){if(await P.document.save())toast('Documento salvo no histórico.')}else showStep(current+1)};
 $('#wsSaveDocument').onclick=async()=>{if(await P.document.save())toast('Documento salvo no histórico.')};$('#wsTogglePreview').onclick=e=>{const previewing=dialog.classList.toggle('is-preview');e.currentTarget.textContent=previewing?'Voltar à edição':'Ver documento'};
 const state=$('#pmDocumentState');const mirror=()=>$('#wsEditorState').textContent=state.textContent;new MutationObserver(mirror).observe(state,{childList:true,subtree:true,characterData:true});mirror();
 function count(){const total=P.document.records.length,shown=history.querySelectorAll('[data-record]').length;$('#wsDocumentCount').textContent=`${shown} de ${total} documento${total===1?'':'s'} no histórico`}
 for(const b of main.querySelectorAll('[data-filter]'))b.onclick=()=>{for(const sibling of main.querySelectorAll('[data-filter]'))sibling.setAttribute('aria-pressed',String(sibling===b));P.document.filter(b.dataset.filter);count()};addEventListener('pm:history-changed',count);count();
 addEventListener('pm:document-open',()=>{showStep(0);open()});
 const marker=document.createComment('document-position');preview.before(marker);
 addEventListener('beforeprint',()=>{document.body.append(preview);preview.classList.add('ws-print-target')});addEventListener('afterprint',()=>{marker.after(preview);preview.classList.remove('ws-print-target')});
 showStep(0);if(requested||P.document.openRequested)open();document.documentElement.dataset.workspaceReady='true';
}
setup().catch(error=>{console.error('Workspace document initialization failed',error)});
