/* Pull only after flushing the offline queue. Failed writes must survive a pull. */
(() => {
  const pulling=new Set();
  function removed(account){return new Set(PM.agendaRead('deleted',account))}
  async function pullCloud(manual=false){
    if(!navigator.onLine||!sb)return;let account,claimed=false;
    try{
      const session=await PM.session();if(!session){setSyncMessage('Entre na conta para sincronizar.');return}
      account=session.user.id;if(currentUser?.id!==account||pulling.has(account))return;pulling.add(account);claimed=true;setSyncMessage('Sincronizando agenda…');
      await flushPending(account);if(currentUser?.id!==account)return;
      const tombstones=removed(account);
      for(const id of [...tombstones]){const{error}=await sb.from('events').delete().eq('id',id).eq('user_id',account);if(!error)tombstones.delete(id)}
      PM.agendaWrite('deleted',[...tombstones],account);
      const{data:rows,error}=await sb.from('events').select('*').eq('user_id',account).order('date',{ascending:true});if(error)throw error;if(currentUser?.id!==account)return;
      // Merge unsent local changes over the remote snapshot. Never seed an empty account.
      const merged=new Map((rows||[]).map(r=>[r.id,fromRow(r)]));
      for(const op of pending()){if(op.type==='delete')merged.delete(op.id);else merged.set(op.id,op.event)}
      for(const id of tombstones)merged.delete(id);
      events=[...merged.values()];save();localStorage.setItem(SYNCED_USER_KEY,currentUser.id);render();
      setSyncMessage(pending().length?`${pending().length} alteração(ões) aguardando envio`:`${events.length} eventos sincronizados ✓`);
    }catch{setSyncMessage('Não foi possível sincronizar. As alterações locais continuam salvas.')}
    finally{if(claimed)pulling.delete(account)}
  }
  syncFromCloud=pullCloud;window.pecPullCloud=pullCloud;
  const card=document.querySelector('.sync-card');
  if(card&&!document.querySelector('#manualCloudSync')){const b=document.createElement('button');b.id='manualCloudSync';b.className='mini';b.textContent='Sincronizar agora';b.type='button';b.onclick=()=>pullCloud(true);card.append(b)}
  PM.ready.then(()=>{activateAccount(PM.user);return pullCloud()});addEventListener('pm:refresh',()=>pullCloud());
})();
