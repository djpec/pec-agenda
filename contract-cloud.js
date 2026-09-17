(() => {
  const sb = window.supabase?.createClient?.('https://qmhyeotvbktdilrudwys.supabase.co','sb_publishable_Yin9aHOMDRYJ0PsuMloVlQ_q8M7iReT');
  let user=null,currentId=null;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function addUI(){
    const side=document.querySelector('.sidebar'); if(!side||document.querySelector('#pecCloudBox')) return;
    const box=document.createElement('details'); box.id='pecCloudBox'; box.className='section'; box.open=true;
    box.innerHTML='<summary>pec Manager • Nuvem</summary><div class="section-body"><div id="pecCloudState" style="font-size:11px;color:#aeb3bd;margin-bottom:8px">Verificando conta…</div><button class="btn btn-primary btn-wide" id="pecCloudSave" type="button">Salvar contrato online</button><div id="pecCloudHistory" style="display:grid;gap:6px;margin-top:9px;max-height:180px;overflow:auto"></div></div>';
    const actions=side.querySelector('.actions'); actions?side.insertBefore(box,actions):side.appendChild(box);
    document.querySelector('#pecCloudSave').onclick=saveOnline;
  }
  function totalValue(d){
    const extras=(d.extras||[]).reduce((s,x)=>s+Number(x.qty||0)*Number(x.unit||0),0);
    const travel=['fuelValue','tollValue','parkingValue','lodgingValue','otherTravelValue'].reduce((s,k)=>s+Number(d[k]||0),0);
    return Number(d.baseValue||0)+extras+travel;
  }
  async function saveOnline(){
    if(!user){alert('Entre na conta pela Agenda para salvar na nuvem.');return}
    const d=collectData(); currentId=currentId||`c-${Date.now()}`;
    const row={id:currentId,user_id:user.id,contract_number:d.contractNumber||null,client_name:d.clientName||'',event_date:d.startDate||null,status:'draft',total_value:totalValue(d),payload:{...d,_managerId:currentId},updated_at:new Date().toISOString()};
    document.querySelector('#pecCloudState').textContent='Salvando…';
    const {error}=await sb.from('contracts').upsert(row,{onConflict:'id'});
    document.querySelector('#pecCloudState').textContent=error?'Erro ao salvar':'Salvo na nuvem ✓';
    if(!error) loadHistory();
  }
  async function loadHistory(){
    const {data:rows}=await sb.from('contracts').select('*').order('updated_at',{ascending:false}).limit(25);
    const h=document.querySelector('#pecCloudHistory'); if(!h)return;
    h.innerHTML=(rows||[]).map((r,i)=>`<button type="button" class="btn btn-secondary" data-i="${i}" style="text-align:left"><b style="display:block">${esc(r.client_name||'Sem cliente')}</b><span style="font-size:10px;opacity:.7">${esc(r.contract_number||'Sem número')}</span></button>`).join('');
    h.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{const r=rows[Number(b.dataset.i)];currentId=r.id;applyData(r.payload||{});saveData(false);document.querySelector('#pecCloudState').textContent='Contrato carregado ✓'});
  }
  function seed(){
    if(new URLSearchParams(location.search).get('from')!=='quote')return;
    try{
      const p=JSON.parse(localStorage.getItem('pec-manager-contract-seed')||'null'); if(!p)return;
      const d=collectData(); d.clientName=p.client||d.clientName; d.startDate=p.eventDate||d.startDate; d.endDate=p.eventDate||d.endDate; d.venueName=p.venue||d.venueName; d.venueAddress=p.city||d.venueAddress; d.musicBrief=[p.musicStyle,p.intro].filter(Boolean).join(' • ');
      const n=String(p.total||'').replace(/[^0-9,.-]/g,'').replace(/\./g,'').replace(',','.'); d.baseValue=String(Number(n)||0);
      applyData(d); if(d.startDate&&!document.querySelector('#contractNumber').value)document.querySelector('#contractNumber').value=contractNumberFromDate(d.startDate); updatePreview(); saveData(false);
    }catch(e){console.warn(e)}
  }
  async function init(){addUI();seed();if(!sb)return;const {data}=await sb.auth.getSession();user=data.session?.user||null;document.querySelector('#pecCloudState').textContent=user?`Conectado • ${user.email}`:'Modo local • entre pela Agenda';if(user)loadHistory()}
  setTimeout(init,0);
})();