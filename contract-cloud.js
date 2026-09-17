(() => {
  'use strict';
  const P=window.PM;
  const originalDefaults={};
  inputs.forEach(el=>{if(el.id)originalDefaults[el.id]=el.type==='checkbox'?el.defaultChecked:el.tagName==='SELECT'?([...el.options].find(o=>o.defaultSelected)||el.options[0])?.value||'':el.defaultValue||''});
  originalDefaults.extras=structuredClone(defaultExtras);
  const fresh=()=>{
    const d=P.clone(originalDefaults),current=collectData();
    for(const k of Object.keys(d))if(k.startsWith('provider')||['signatureCity','originCity'].includes(k))d[k]=current[k];
    d.issueDate=P.today();return d;
  };
  const adapter={type:'contract',container:'.sidebar',get:()=>collectData(),defaults:fresh,
    apply:p=>{applyData({...P.clone(originalDefaults),...p});saveData(false)},
    normalize:p=>({...p,contractNumber:p.contractNumber||p.number||'',issueDate:p.issueDate||p.issue||P.today(),baseValue:p.baseValue??p.base??'',signalValue:p.signalValue??p.signal??'',customClause:p.customClause||p.custom||'',travelValue:p.travelValue??p.fuelValue??''}),
    info:p=>({client_name:p.clientName||'',contract_number:p.contractNumber||null,event_date:p.startDate||null,total_value:Number(p.baseValue||0)+(p.extras||[]).reduce((s,x)=>s+Number(x.qty||0)*Number(x.unit||0),0)+['travelValue','tollValue','parkingValue','lodgingValue','otherTravelValue'].reduce((s,k)=>s+Number(p[k]||0),0)}),
    event:p=>({title:p.eventName||`${p.eventType||'Evento'}${p.clientName?' — '+p.clientName:''}`,date:p.startTime&&Number(p.startTime.slice(0,2))<12?P.shiftDate(p.startDate,-1):p.startDate,time:p.startTime||'',timeType:p.startTime?'time':'tbd',place:[p.venueName,p.venueAddress].filter(Boolean).join(', '),notes:[`Cliente: ${p.clientName||'—'}`,`Contrato: ${p.contractNumber||'—'}`,p.musicBrief].filter(Boolean).join('\n')}),
    async start(doc){
      if(new URLSearchParams(location.search).get('from')!=='quote')return;
      const seed=await P.db('get',`${P.scope}:contract-seed`);if(!seed)return;
      const d={...fresh(),...seed.payload,contractNumber:contractNumberFromDate(seed.payload.startDate),issueDate:P.today()};
      await doc.use(d,seed.meta);await P.db('delete',`${P.scope}:contract-seed`);
      history.replaceState(null,'','./contratos.html');
    }
  };
  // The supplied template's safeStorageRemove called itself recursively.
  // Fix that one persistence hook without changing its markup or PDF renderer.
  safeStorageRemove=function(){try{localStorage.removeItem(STORAGE_KEY)}catch{}};
  const originalSave=saveData;saveData=function(show=true){originalSave(show);P.document?.changed()};
  resetDefaults=function(){safeStorageRemove();P.document?.use(fresh(),{status:'draft'})};
  P.initDocument(adapter).catch(()=>{console.error('Não foi possível iniciar o histórico. O editor original continua disponível.')});
})();
