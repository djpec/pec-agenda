(() => {
  'use strict';
  const P=window.PM;
  const adapter={type:'quote',container:'.editor',get:()=>data,
    defaults:()=>({...clone(DEFAULT),client:'',eventDate:'',venue:'',city:'',time:'A definir',issueDate:P.today()}),
    apply:p=>{data={...clone(DEFAULT),...p,scope:(p.scope||DEFAULT.scope).map(normalizeScope),extras:(p.extras||DEFAULT.extras).map(normalizeExtra)};fillFixed();renderScopeEditor();renderExtrasEditor();renderAll()},
    normalize:p=>p.scope?p:{...clone(DEFAULT),...p,eventDate:p.date||p.eventDate||'',issueDate:p.issue||p.issueDate||P.today(),total:p.base!=null?P.currency(p.base):p.total||'',intro:p.message||p.intro||'',scope:p.items||clone(DEFAULT.scope)},
    info:p=>({client_name:p.client||'',event_date:p.eventDate||null,total_value:p.investmentMode==='perItem'?(p.scope||[]).reduce((sum,s)=>sum+(P.money(s.value)||0),0):P.money(p.total)}),
    event:p=>({title:`${{casamento:'Casamento',xv:'Festa de XV',geral:'Evento'}[p.theme]||'Evento'}${p.client?' — '+p.client:''}`,date:p.eventDate||'',time:P.parseTime(p.time),timeType:/noite\s+toda/i.test(p.time+' '+p.duration)?'allnight':P.parseTime(p.time)?'time':'tbd',place:[p.venue,p.city].filter(Boolean).join(', '),notes:[`Cliente: ${p.client||'—'}`,p.musicStyle,(p.scope||[]).map(s=>[s.title,s.duration,s.time].filter(Boolean).join(' · ')).join('\n')].filter(Boolean).join('\n')})
  };
  function durationMinutes(text){
    const v=String(text||'').trim();let m=/^(\d+(?:[.,]\d+)?)\s*(?:h|hora)/i.exec(v);if(m)return Math.round(Number(m[1].replace(',','.'))*60);
    m=/^(\d+)\s*min/i.exec(v);return m?Number(m[1]):null;
  }
  function endOf(startDate,startTime,duration){
    const mins=durationMinutes(duration);if(!startDate||!startTime||!mins)return {date:'',time:''};
    const [h,m]=startTime.split(':').map(Number),total=h*60+m+mins;
    return {date:P.shiftDate(startDate,Math.floor(total/1440)),time:`${String(Math.floor(total/60)%24).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`};
  }
  adapter.convert=async doc=>{
    const p=P.clone(data),e=P.esc,time=P.parseTime(p.time),startDate=time&&Number(time.slice(0,2))<12?P.shiftDate(p.eventDate,1):p.eventDate;
    const end=endOf(startDate,time,p.duration);
    const scopeText=(p.scope||[]).map(s=>[s.title,s.description,s.duration,s.time].filter(Boolean).join(' · ')).join('\n');
    const d=P.dialog('Gerar contrato',`<form id="pmConvertForm"><div class="pm-dialog-body"><p>Confira o período e selecione os extras aprovados pelo cliente. Os horários abaixo são as datas reais da apresentação.</p><div class="pm-grid"><label>Início · data<input name="startDate" type="date" value="${e(startDate)}"></label><label>Início · hora<input name="startTime" type="time" value="${e(time)}"></label><label>Término · data<input name="endDate" type="date" value="${e(end.date)}"></label><label>Término · hora<input name="endTime" type="time" value="${e(end.time)}"></label></div><label>Modalidade<select name="contractType"><option value="warmup_performance">Warm-up + Performance</option><option value="warmup">Warm-up</option><option value="performance">Performance</option></select></label><label>Serviço principal (R$)<input name="baseValue" type="number" min="0" step="0.01" required value="${adapter.info(p).total_value??''}"></label><p>Extras contratados</p>${(p.extras||[]).map((x,i)=>`<div class="pm-grid"><label class="pm-check"><input type="checkbox" name="extra-${i}">${e(x.title)}</label><label>Valor fechado (R$)<input type="number" min="0" step="0.01" name="value-${i}" value="${/a partir|consulta|desde/i.test(x.value)?'':P.money(x.value)??''}" placeholder="Confirmar valor"></label></div>`).join('')||'<small>Sem extras nesta proposta.</small>'}<p class="pm-error" id="pmConvertError"></p><div class="pm-actions"><button class="pm-primary" type="submit">Continuar no contrato</button></div></div></form>`);
    const f=d.querySelector('#pmConvertForm');
    const titles=(p.scope||[]).map(s=>s.title).join(' ');f.elements.contractType.value=/warm.?up/i.test(titles)?(/performance/i.test(titles)?'warmup_performance':'warmup'):'performance';
    f.onsubmit=async ev=>{
      ev.preventDefault();const btn=f.querySelector('[type=submit]');btn.disabled=true;
      try{
        const values=new FormData(f),extras=[];
        for(const[x,i]of(p.extras||[]).map((x,i)=>[x,i]))if(values.has('extra-'+i)){
          const price=values.get('value-'+i);if(price===''||!Number.isFinite(Number(price)))throw new Error('Informe o valor fechado de cada extra selecionado.');
          extras.push({description:[x.title,x.description].filter(Boolean).join(' — '),nature:'servico',qty:1,unit:Number(price)});
        }
        const sd=values.get('startDate'),st=values.get('startTime'),ed=values.get('endDate'),et=values.get('endTime');
        if(sd&&st&&ed&&et&&new Date(ed+'T'+et)<=new Date(sd+'T'+st))throw new Error('O término precisa ser depois do início.');
        if(!await doc.save())throw new Error('Não foi possível salvar o orçamento. Confira o aviso no histórico.');
        const total=Number(values.get('baseValue'))+extras.reduce((s,x)=>s+x.qty*x.unit,0),percent=/(\d+(?:[.,]\d+)?)\s*%/.exec(p.deposit||''),explicit=/R\$\s*([\d.,]+)/i.exec(p.deposit||'');
        const seed={clientName:p.client||'',eventType:{casamento:'Casamento',xv:'Festa de XV',geral:'Evento'}[p.theme]||'Evento',eventName:'',startDate:sd,startTime:st,endDate:ed,endTime:et,arrivalDate:sd,arrivalTime:'',contractType:values.get('contractType'),venueName:p.venue||'',venueAddress:p.city||'',baseValue:values.get('baseValue'),extras,signalValue:percent?String(Math.round(total*Number(percent[1].replace(',','.')))/100):explicit?String(P.money(explicit[0])):'',paymentMethod:p.payment||'',paymentTerms:[p.deposit,p.balance,p.notes].filter(Boolean).join('\n'),musicBrief:p.musicStyle||'',customClause:scopeText?'Serviços contratados:\n'+scopeText:'',clientStructure:p.rider||''};
        const days=/(\d+)\s*dias?\s*antes/i.exec(p.balance||'');if(days)seed.balanceDaysBefore=days[1];
        await P.db('put',`${P.scope}:contract-seed`,{payload:seed,meta:{sourceQuoteId:doc.meta.id,eventId:doc.meta.eventId||`document-${doc.meta.id}`,agendaDate:p.eventDate,status:'draft'}});
        location.href='./contratos.html?from=quote';
      }catch(error){d.querySelector('#pmConvertError').textContent=error.message}
      finally{btn.disabled=false}
    };
  };
  // Retain the original local save, and add a lossless draft (including images).
  const originalSave=save;save=function(){originalSave();P.document?.changed()};
  P.initDocument(adapter).catch(()=>{console.error('Não foi possível iniciar o histórico. O editor original continua disponível.')});
})();
