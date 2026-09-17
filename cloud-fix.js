/* Pull only after flushing the offline queue. Failed writes must survive a pull. */
(() => {
  let pulling=false;
  const deletedKey='pec-agenda-deleted-v1';
  function removed(){return new Set(PM.read(deletedKey,[]))}
  async function pullCloud(manual=false){
    if(pulling||!navigator.onLine||!sb)return;pulling=true;
    try{
      const session=await PM.session();if(!session){setSyncMessage('Entre na conta para sincronizar.');return}
      currentUser=session.user;setSyncMessage('Sincronizando agenda…');
      await flushPending();
      const tombstones=removed();
      for(const id of [...tombstones]){const{error}=await sb.from('events').delete().eq('id',id).eq('user_id',currentUser.id);if(!error)tombstones.delete(id)}
      PM.write(deletedKey,[...tombstones]);
      const{data:rows,error}=await sb.from('events').select('*').eq('user_id',currentUser.id).order('date',{ascending:true});if(error)throw error;
      // Merge unsent local changes over the remote snapshot. Never seed an empty account.
      const merged=new Map((rows||[]).map(r=>[r.id,fromRow(r)]));
      for(const op of pending()){if(op.type==='delete')merged.delete(op.id);else merged.set(op.id,op.event)}
      for(const id of tombstones)merged.delete(id);
      events=[...merged.values()];save();localStorage.setItem(SYNCED_USER_KEY,currentUser.id);render();
      setSyncMessage(pending().length?`${pending().length} alteração(ões) aguardando envio`:`${events.length} eventos sincronizados ✓`);
    }catch{setSyncMessage('Não foi possível sincronizar. As alterações locais continuam salvas.')}
    finally{pulling=false}
  }
  syncFromCloud=pullCloud;window.pecPullCloud=pullCloud;
  const card=document.querySelector('.sync-card');
  if(card&&!document.querySelector('#manualCloudSync')){const b=document.createElement('button');b.id='manualCloudSync';b.className='mini';b.textContent='Sincronizar agora';b.type='button';b.onclick=()=>pullCloud(true);card.append(b)}
  PM.ready.then(()=>pullCloud());addEventListener('pm:refresh',()=>pullCloud());
})();
