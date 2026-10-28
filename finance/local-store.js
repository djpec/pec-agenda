import {blank,validate} from './model.mjs';
const DB='agenda-artista-finance',KEY='local';
const conflict='O financeiro mudou em outra aba. Clique em Atualizar antes de continuar.';
export async function openLocalStore(){
 let connection,state=blank(),revision=0,seenRevision=0,ready=false,busy=false,note='Abrindo os dados deste navegador…';
 const emit=()=>dispatchEvent(new CustomEvent('finance:change'));
 const channel=typeof BroadcastChannel==='function'?new BroadcastChannel('agenda-artista-finance'):null;
 const normal='Salvo neste navegador · sem sincronização entre aparelhos. Exporte backups para guardar seus dados.';
 async function db(){if(connection)return connection;connection=await new Promise((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>r.result.createObjectStore('workspaces');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onblocked=()=>reject(Error('Feche outras abas do financeiro para atualizar o armazenamento.'))});connection.onversionchange=()=>{connection.close();connection=null;ready=false;note='O armazenamento foi atualizado em outra aba. Recarregue esta página.';emit()};return connection}
 async function read(){const d=await db();return new Promise((resolve,reject)=>{const tx=d.transaction('workspaces','readonly'),r=tx.objectStore('workspaces').get(KEY);tx.oncomplete=()=>resolve(r.result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)})}
 async function persist(next,expected){const d=await db();return new Promise((resolve,reject)=>{const tx=d.transaction('workspaces','readwrite'),s=tx.objectStore('workspaces'),r=s.get(KEY);let error;
  r.onsuccess=()=>{try{if((r.result?.revision||0)!==expected)throw Error(conflict);s.put({state:next,revision:expected+1},KEY)}catch(problem){error=problem;tx.abort()}};
  tx.oncomplete=()=>resolve(expected+1);tx.onerror=()=>reject(error||tx.error);tx.onabort=()=>reject(error||tx.error||Error('Não foi possível guardar os dados.'));
 })}
 async function refresh(){if(busy)return;busy=true;ready=false;emit();try{const record=await read();state=record?validate(record.state):blank();revision=record?.revision||0;ready=revision>=seenRevision;note=ready?normal:conflict}catch{note='Não foi possível abrir o armazenamento deste navegador. Seus dados não foram substituídos. Confira as permissões e o espaço disponível.'}finally{busy=false;emit()}}
 async function change(mutate){if(busy||!ready)throw Error('Atualize o financeiro antes de salvar.');const next=validate(mutate(structuredClone(state)));busy=true;emit();try{revision=await persist(next,revision);state=next;ready=revision>=seenRevision;note=ready?normal:conflict;channel?.postMessage({revision})}catch(error){ready=false;note=error?.message===conflict?conflict:'Não foi possível salvar neste navegador. Confira o espaço e as permissões; os dados anteriores foram preservados. Clique em Atualizar.';throw Error(note)}finally{busy=false;emit()}}
 if(channel)channel.onmessage=e=>{if(Number.isInteger(e.data?.revision)&&e.data.revision>revision){seenRevision=e.data.revision;ready=false;note=conflict;emit()}};
 const store={mode:'local',get state(){return structuredClone(state)},get ready(){return ready&&!busy},get busy(){return busy},get note(){return note},refresh,change};await refresh();return store;
}
