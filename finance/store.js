import {blank,validate} from './model.mjs';
export async function openStore(){
 await PM.ready;if(!PM.user)throw Error('Entre novamente para abrir o financeiro.');
 const userId=PM.user.id,key='artist-finance-v1:'+userId;let state=blank(),revision=0,ready=false,busy=false,note='';
 const emit=()=>dispatchEvent(new CustomEvent('finance:change'));
 const cache=()=>{try{localStorage.setItem(key,JSON.stringify({revision,state}))}catch{/* Cloud remains the source of truth. */}};
 try{const cached=JSON.parse(localStorage.getItem(key));if(cached){state=validate(cached.state);revision=cached.revision}}catch{}
 async function refresh(){if(busy)return;busy=true;ready=false;note='Atualizando seu financeiro…';emit();try{const {data,error}=await ArtistAuth.timeout(PM.client.from('finance_workspaces').select('revision,state').eq('user_id',userId).maybeSingle());if(error)throw error;state=data?validate(data.state):blank();revision=data?.revision||0;ready=true;note='Salvo na sua conta';cache()}catch{note='Não foi possível conectar ao financeiro. Confira a internet e a ativação do módulo no Supabase. Os dados disponíveis neste aparelho ficam somente para consulta.'}finally{busy=false;emit()}}
 async function change(mutate){if(busy||!ready)throw Error('Conecte e atualize o financeiro antes de salvar.');if(PM.user?.id!==userId||document.documentElement.dataset.wsAccess!=='granted')throw Error('Sessão encerrada. Entre novamente.');const next=validate(mutate(structuredClone(state)));busy=true;emit();try{const {data,error}=await ArtistAuth.timeout(PM.client.rpc('save_finance_workspace',{expected_revision:revision,next_state:next}));if(error)throw error;state=next;revision=Number(data);cache();note='Salvo na sua conta'}catch(error){ready=false;note=error?.code==='40001'?'Seu financeiro mudou em outro aparelho. Atualize e refaça esta alteração.':'Não foi possível confirmar o salvamento. Atualize e confira se o lançamento já foi salvo antes de tentar novamente.';throw Error(note)}finally{busy=false;emit()}}
 const store={get state(){return structuredClone(state)},get ready(){return ready&&!busy},get busy(){return busy},get note(){return note},change,refresh};
 await refresh();return store;
}
