/* Bridges the unchanged editors to the existing Supabase tables. */
(() => {
  'use strict';
  const P=window.PM;
  P.dialog=(title,body)=>{
    const d=document.createElement('dialog');d.className='pm-dialog';
    d.innerHTML=`<form method="dialog"><div class="pm-dialog-head"><h2>${P.esc(title)}</h2><button aria-label="Fechar">×</button></div></form><div class="pm-dialog-body">${body}</div>`;
    d.addEventListener('close',()=>d.remove());document.body.append(d);d.showModal();return d;
  };
  P.initDocument=async adapter=>{
    await P.ready;
    const type=adapter.type,table=type==='quote'?'quotes':'contracts',label=type==='quote'?'orçamento':'contrato';
    let scope=P.scope,meta={},rows=[],busy=false,restoring=false,unsaved=false,version=0,draftTimer,ready=false;
    const cacheKey=()=>`${scope}:${table}:history`,draftKey=()=>`${scope}:${table}:draft`;
    const panel=document.createElement('details');panel.className='pm-tools';panel.open=true;panel.id='pmDocumentTools';
    const statuses=type==='quote'?{draft:'Rascunho',sent:'Enviado',approved:'Aprovado',declined:'Recusado'}:{draft:'Rascunho',sent:'Enviado',signed:'Assinado',cancelled:'Cancelado'};
    panel.innerHTML=`<summary>pec Manager · ${type==='quote'?'Orçamentos':'Contratos'}</summary><div class="pm-tools-body"><p id="pmDocumentState" class="pm-state" role="status">Carregando…</p><label>Status<select id="pmDocumentStatus">${Object.entries(statuses).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></label><div class="pm-actions"><button class="pm-primary" id="pmSave" type="button">Salvar no histórico</button><button id="pmNew" type="button">Novo</button><button id="pmCopy" type="button">Salvar cópia</button></div><div class="pm-actions">${type==='quote'?'<button id="pmConvert" type="button">Gerar contrato</button>':''}<button id="pmAgenda" type="button">Adicionar à agenda</button><a href="./agenda.html?account=1">Minha conta</a></div><label>Histórico<input id="pmHistorySearch" type="search" placeholder="Buscar cliente, data ou número"></label><div id="pmHistory" class="pm-history"></div><button id="pmHistoryMore" type="button" hidden>Carregar mais</button></div>`;
    const editor=document.querySelector(adapter.container),first=editor.querySelector('details');first?editor.insertBefore(panel,first):editor.append(panel);
    const $=id=>panel.querySelector('#'+id);
    const state=(message,error=false)=>{$('pmDocumentState').textContent=message;$('pmDocumentState').classList.toggle('pm-error',error)};
    function snapshot(){return {...P.clone(adapter.get()),_manager:P.clone(meta)}}
    async function stash(){await P.db('put',draftKey(),{payload:snapshot(),unsaved,version});}
    function changed(){
      if(restoring||!ready)return;unsaved=true;version++;
      state('Rascunho neste aparelho · salve no histórico para sincronizar.');clearTimeout(draftTimer);
      draftTimer=setTimeout(()=>stash().catch(()=>state('Não foi possível guardar o rascunho neste aparelho.',true)),180);
    }
    function apply(payload,record){
      restoring=true;
      try{adapter.apply(P.clone(payload));meta={...(payload._manager||{}),...(record?{id:record.id,status:record.status,remoteUpdated:record._baseVersion??record.updated_at}:{}),status:record?.status||payload._manager?.status||'draft'};$('pmDocumentStatus').value=meta.status;unsaved=false;version++;}
      finally{restoring=false}
    }
    async function writeRows(){await P.db('put',cacheKey(),rows);renderHistory()}
    function renderHistory(){
      const q=$('pmHistorySearch').value.toLocaleLowerCase('pt-BR');
      const shown=rows.filter(r=>[r.client_name,r.event_date,r.contract_number,r.payload?.client].join(' ').toLocaleLowerCase('pt-BR').includes(q)).sort((a,b)=>String(b.updated_at).localeCompare(String(a.updated_at)));
      $('pmHistory').innerHTML=shown.map(r=>`<button type="button" data-record="${P.esc(r.id)}" aria-current="${r.id===meta.id}"><b>${P.esc(r.client_name||'Sem cliente')}</b><small>${P.esc(r.event_date?.split('-').reverse().join('/')||'Sem data')} · ${P.esc(statuses[r.status]||r.status)}${r.total_value!=null?' · '+P.currency(r.total_value):''}${r._pending?' · pendente':''}</small></button>`).join('')||'<p class="pm-empty">Nenhum registro encontrado.</p>';
      $('pmHistory').querySelectorAll('[data-record]').forEach(b=>b.onclick=()=>loadRow(b.dataset.record));
    }
    let historyLimit=100;
    async function history(){
      if(!P.user||!navigator.onLine)return renderHistory();const account=P.scope;
      try{
        const{data:remote,error}=await P.client.from(table).select('id,client_name,event_date,status,total_value,created_at,updated_at'+(type==='contract'?',contract_number':'')).eq('user_id',account).order('updated_at',{ascending:false}).limit(historyLimit);
        if(error)throw error;if(scope!==account)return;
        const combined=new Map(rows.map(r=>[r.id,r]));
        for(const r of remote||[]){const cached=combined.get(r.id);if(!cached?._pending)combined.set(r.id,{...(cached||{}),...r,payload:cached?.updated_at===r.updated_at?cached.payload:undefined})}
        rows=[...combined.values()];$('pmHistoryMore').hidden=(remote||[]).length<historyLimit;await writeRows();
      }catch{state('Histórico local disponível. Não foi possível atualizar a nuvem.',true)}
    }
    async function loadRow(id){
      if(unsaved&&!confirm('Há alterações fora do histórico. Abrir outro registro e descartar essas alterações?'))return;
      let row=rows.find(r=>r.id===id);if(!row)return;
      try{
        if(P.user&&navigator.onLine&&!row._pending){const{data,error}=await P.client.from(table).select('*').eq('id',id).eq('user_id',P.scope).single();if(error)throw error;row=data;rows=rows.map(r=>r.id===id?row:r);await writeRows()}
        if(!row.payload)throw new Error();apply(adapter.normalize?adapter.normalize(row.payload):row.payload,row);await stash();renderHistory();state(row._pending?'Registro local · aguardando sincronização.':'Registro carregado.');
      }catch{state('Não foi possível abrir este registro. Confira a conexão.',true)}
    }
    async function push(row){
      const outgoing={...row};delete outgoing._pending;delete outgoing._baseVersion;delete outgoing._error;
      outgoing.user_id=P.user.id;
      let result;
      if(row._baseVersion)result=await P.client.from(table).update(outgoing).eq('id',row.id).eq('user_id',P.user.id).eq('updated_at',row._baseVersion).select('id,updated_at').maybeSingle();
      else result=await P.client.from(table).insert(outgoing).select('id,updated_at').single();
      if(result.error)throw result.error;
      if(!result.data)throw new Error('Este registro mudou em outro dispositivo. Abra-o novamente ou salve uma cópia.');
      return {...row,_pending:false,_error:null,_baseVersion:result.data.updated_at,updated_at:result.data.updated_at};
    }
    async function save(copy=false){
      if(busy)return false;busy=true;$('pmSave').disabled=true;const capturedVersion=version;
      try{
        if(copy){meta={status:meta.status||'draft'};}
        meta.id||=P.uid(type==='quote'?'q':'c');meta.status=$('pmDocumentStatus').value;
        const payload=snapshot(),info=adapter.info(payload),old=rows.find(r=>r.id===meta.id),now=new Date().toISOString();
        let row={id:meta.id,user_id:P.user?.id||null,...info,status:meta.status,payload,created_at:old?.created_at||now,updated_at:now,_pending:!!P.user,_baseVersion:old?._pending?old._baseVersion:(meta.remoteUpdated||null)};
        rows=[row,...rows.filter(r=>r.id!==row.id)];await writeRows();await stash();
        if(P.user&&navigator.onLine){
          try{row=await push(row);meta.remoteUpdated=row.updated_at;row.payload._manager={...row.payload._manager,remoteUpdated:row.updated_at};rows=rows.map(r=>r.id===row.id?row:r);await writeRows();state('Salvo na nuvem ✓');}
          catch(error){state(error.message?.includes('outro dispositivo')?error.message:'Salvo neste aparelho; envio pendente. Tente novamente com conexão.',true);return false;}
        }else state(P.user?'Salvo neste aparelho · envio pendente.':'Salvo no histórico deste aparelho. Entre na conta para salvar online.');
        if(capturedVersion===version)unsaved=false;await stash();P.notify('pm:saved',{table,id:meta.id});return true;
      }catch{state('Não foi possível salvar. O editor continua com seus dados.',true);return false;}
      finally{busy=false;$('pmSave').disabled=false;}
    }
    async function flush(){
      if(busy||!P.user||!navigator.onLine)return;busy=true;
      try{for(const row of rows.filter(r=>r._pending)){try{const saved=await push(row);rows=rows.map(r=>r.id===row.id?saved:r);if(meta.id===row.id){meta.remoteUpdated=saved.updated_at;state(unsaved?'Histórico sincronizado; há alterações no editor.':'Salvo na nuvem ✓');await stash()}}catch(error){state(error.message?.includes('outro dispositivo')?error.message:'Há registros aguardando envio à nuvem.',true)}}await writeRows()}
      finally{busy=false}
    }
    async function newDocument(){
      if(unsaved&&!confirm('Criar um novo documento? As alterações que não estão no histórico serão descartadas.'))return;
      apply(adapter.defaults());meta={status:'draft'};$('pmDocumentStatus').value='draft';await stash();renderHistory();state('Novo '+label+' · ainda não salvo.');
      const u=new URL(location.href);u.search='';historyReplace(u);
    }
    function historyReplace(url){window.history.replaceState(null,'',url)}
    const api=P.document={adapter,get meta(){return meta},get dirty(){return unsaved},snapshot,changed,stash,save,loadRow,state,
      async use(payload,newMeta={}){apply({...payload,_manager:newMeta});unsaved=true;await stash();state('Dados importados · revise e salve no histórico.');},
      async link(patch){meta={...meta,...patch};await stash();},
      async refresh(){await flush();await history()}
    };
    $('pmSave').onclick=()=>save();$('pmCopy').onclick=()=>save(true);$('pmNew').onclick=newDocument;
    $('pmDocumentStatus').onchange=()=>{meta.status=$('pmDocumentStatus').value;changed()};
    $('pmHistorySearch').oninput=renderHistory;$('pmHistoryMore').onclick=()=>{historyLimit+=100;history()};
    $('pmAgenda').onclick=()=>P.addDocumentToAgenda(api);
    if($('pmConvert'))$('pmConvert').onclick=()=>adapter.convert(api);
    editor.addEventListener('input',e=>{if(!panel.contains(e.target))changed()});editor.addEventListener('change',e=>{if(!panel.contains(e.target))changed()});
    async function restore(){
      rows=await P.db('get',cacheKey())||[];const draft=await P.db('get',draftKey());
      if(draft){apply(draft.payload);unsaved=!!draft.unsaved;}renderHistory();
    }
    await restore();ready=true;
    const params=new URLSearchParams(location.search);
    if(params.get('new')==='1'){unsaved=false;await newDocument()}
    state(P.user?'Conta conectada · histórico disponível.':'Modo local · entre pela Minha conta para sincronizar.');
    await adapter.start?.(api);history();flush();
    addEventListener('pm:refresh',()=>api.refresh());
    addEventListener('pm:account',async()=>{if(scope===P.scope)return;scope=P.scope;apply(adapter.defaults());meta={status:'draft'};await restore();await api.refresh()});
    addEventListener('beforeunload',()=>{clearTimeout(draftTimer);stash().catch(()=>{})});
    document.documentElement.dataset.pmReady='true';
    return api;
  };
  P.addDocumentToAgenda=async doc=>{
    if(!P.user)return doc.state('Entre na conta em Minha conta para adicionar à agenda.',true);
    if(!navigator.onLine)return doc.state('Conecte-se à internet para adicionar à agenda.',true);
    const payload=doc.snapshot(),info=doc.adapter.event(payload),e=P.esc;
    const d=P.dialog('Adicionar à agenda',`<form id="pmAgendaForm"><div class="pm-dialog-body"><label>Evento<input name="title" required value="${e(info.title)}"></label><label>Noite do evento<input name="date" type="date" required value="${e(info.date)}"></label><small>Horários entre 00h e 11h59 pertencem à madrugada seguinte à noite escolhida.</small><div class="pm-grid"><label>Horário<select name="timeType"><option value="time">Definido</option><option value="tbd">A confirmar</option><option value="allnight">Noite toda</option></select></label><label>Hora<input name="time" type="time" value="${e(info.time)}"></label></div><label>Local<input name="place" value="${e(info.place)}"></label><label>Observações<textarea name="notes">${e(info.notes)}</textarea></label><p class="pm-error" id="pmAgendaError"></p><div class="pm-actions"><button class="pm-primary" type="submit">Salvar evento</button></div></div></form>`);
    const form=d.querySelector('#pmAgendaForm');form.elements.timeType.value=info.timeType||'tbd';
    const toggle=()=>{form.elements.time.required=form.elements.timeType.value==='time';form.elements.time.disabled=form.elements.timeType.value!=='time'};form.elements.timeType.onchange=toggle;toggle();
    form.onsubmit=async ev=>{
      ev.preventDefault();const button=form.querySelector('[type=submit]');button.disabled=true;
      try{
        if(!await doc.save())throw new Error('Salve o documento na nuvem antes de adicionar à agenda.');
        const id=doc.meta.eventId||`document-${doc.meta.sourceQuoteId||doc.meta.id}`;
        const{data:existing,error:readError}=await P.client.from('events').select('*').eq('id',id).eq('user_id',P.user.id).maybeSingle();if(readError)throw readError;
        if(existing&&!confirm('Este documento já tem um evento na agenda. Atualizar esse mesmo evento?'))return;
        const v=new FormData(form),row={...existing,id,user_id:P.user.id,title:v.get('title').trim(),date:v.get('date'),time_type:v.get('timeType'),time_value:v.get('timeType')==='time'?v.get('time')+':00':null,place:v.get('place'),notes:v.get('notes'),completed:existing?.completed||false,completed_at:existing?.completed_at||null,updated_at:new Date().toISOString()};
        const{error}=await P.client.from('events').upsert(row,{onConflict:'id'});if(error)throw error;
        await doc.link({eventId:id});await doc.save();doc.state('Evento salvo na agenda ✓');d.close();
      }catch(error){d.querySelector('#pmAgendaError').textContent=error.message||'Não foi possível salvar o evento.'}
      finally{button.disabled=false}
    };
  };
})();
