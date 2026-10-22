/* Existing data formats and cloud authentication; presentation lives in agenda.js. */
const KEY='pec-agenda-v1',VIEW_KEY='pec-agenda-view',PENDING_KEY='pec-agenda-pending-v1',SYNCED_USER_KEY='pec-agenda-synced-user';
const SUPABASE_URL='https://qmhyeotvbktdilrudwys.supabase.co';
const SUPABASE_KEY='sb_publishable_Yin9aHOMDRYJ0PsuMloVlQ_q8M7iReT';
const sb=window.PM.client;

const DEFAULT_EVENTS=[];
let events=load(),selectedMonth=null,currentView=localStorage.getItem(VIEW_KEY)||'list',selectedCalendarDay=null,currentUser=null,syncBusy=false;
function load(){try{const saved=localStorage.getItem(KEY);if(saved!==null)return (JSON.parse(saved)||[]).map(e=>({...e,completed:!!e.completed}));const seeded=DEFAULT_EVENTS.map(e=>({...e,completed:false,completedAt:null}));localStorage.setItem(KEY,JSON.stringify(seeded));return seeded}catch{return DEFAULT_EVENTS.map(e=>({...e,completed:false,completedAt:null}))}}
function save(){localStorage.setItem(KEY,JSON.stringify(events))}
function esc(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function monthKey(date){return date.slice(0,7)}
function monthLabel(key){const [y,m]=key.split('-').map(Number);return new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric'}).format(new Date(y,m-1,1)).replace(/^./,x=>x.toUpperCase())}
function dayLabel(date){const [y,m,d]=date.split('-').map(Number);return new Intl.DateTimeFormat('pt-BR',{weekday:'long'}).format(new Date(y,m-1,d)).replace(/^./,x=>x.toUpperCase())}
function displayDate(date){const [y,m,d]=date.split('-');return `${d}/${m}`}
function longDate(date){const [y,m,d]=date.split('-').map(Number);return new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'long',year:'numeric'}).format(new Date(y,m-1,d))}
function sortTime(e){if(e.timeType==='allnight')return 20*60;if(e.timeType==='tbd')return 21*60;if(!e.time)return 21*60;let[h,m]=e.time.split(':').map(Number);if(h<12)h+=24;return h*60+m}
function eventMoment(e){const[y,m,d]=e.date.split('-').map(Number);if(e.timeType==='time'&&e.time){let[h,min]=e.time.split(':').map(Number);const dt=new Date(y,m-1,d,h,min,0);if(h<12)dt.setDate(dt.getDate()+1);return dt}return new Date(y,m-1,d,e.timeType==='allnight'?20:21,0,0)}
function sorted(list){return[...list].sort((a,b)=>a.date.localeCompare(b.date)||sortTime(a)-sortTime(b))}
function timeText(e){if(e.timeType==='tbd')return'A confirmar';if(e.timeType==='allnight')return'Noite toda';return e.time||'--:--'}
function allMonths(){return[...new Set(events.map(e=>monthKey(e.date)))].sort()}

function render(){updateCloudUI();dispatchEvent(new CustomEvent('agenda:change'))}

function openForm(e=null){document.querySelector('#formTitle').textContent=e?'Editar evento':'Novo evento';document.querySelector('#eventId').value=e?.id||'';document.querySelector('#title').value=e?.title||'';document.querySelector('#date').value=e?.date||PM.today();document.querySelector('#timeType').value=e?.timeType||'time';document.querySelector('#time').value=e?.time||'23:00';document.querySelector('#place').value=e?.place||'';document.querySelector('#notes').value=e?.notes||'';document.querySelector('#deleteBtn').style.display=e?'block':'none';toggleTime();document.querySelector('#modal').classList.add('open');document.querySelector('#modal').setAttribute('aria-hidden','false');if(!document.querySelector('#modal').open)document.querySelector('#modal').showModal();requestAnimationFrame(()=>document.querySelector('#title').focus())}
function closeForm(){document.querySelector('#modal').classList.remove('open');document.querySelector('#modal').setAttribute('aria-hidden','true');document.querySelector('#modal').close()}
function toggleTime(){document.querySelector('#timeField').style.display=document.querySelector('#timeType').value==='time'?'flex':'none';document.querySelector('#time').required=document.querySelector('#timeType').value==='time'}

function pending(){try{return JSON.parse(localStorage.getItem(PENDING_KEY))||[]}catch{return[]}}
function setPending(q){localStorage.setItem(PENDING_KEY,JSON.stringify(q))}
function queueOp(op){const q=pending().filter(x=>!(x.id===op.id));q.push(op);setPending(q);updateCloudUI()}
function toRow(e){return{id:e.id,user_id:currentUser.id,title:e.title,date:e.date,time_type:e.timeType,time_value:e.timeType==='time'&&e.time?`${e.time}:00`:null,place:e.place||null,notes:e.notes||null,completed:!!e.completed,completed_at:e.completedAt||null,updated_at:new Date().toISOString()}}
function fromRow(r){return{id:r.id,title:r.title,date:r.date,timeType:r.time_type,time:r.time_value?String(r.time_value).slice(0,5):'',place:r.place||'',notes:r.notes||'',completed:!!r.completed,completedAt:r.completed_at||null}}
async function persistEvent(e){save();if(!currentUser){render();return}if(!navigator.onLine||!sb){queueOp({type:'upsert',id:e.id,event:e});render();return}let error;try{({error}=await sb.from('events').upsert(toRow(e),{onConflict:'id'}))}catch(cause){error=cause}if(error){queueOp({type:'upsert',id:e.id,event:e});setSyncMessage('Alteração guardada localmente; sincroniza depois.')}else setSyncMessage('Sincronizado na nuvem ✓');render()}
async function persistDelete(id){save();if(!currentUser){render();return}if(!navigator.onLine||!sb){queueOp({type:'delete',id});render();return}let error;try{({error}=await sb.from('events').delete().eq('id',id))}catch(cause){error=cause}if(error)queueOp({type:'delete',id});else setSyncMessage('Exclusão sincronizada ✓');render()}
async function flushPending(){if(!currentUser||!navigator.onLine||!sb)return;const q=pending();if(!q.length)return;const rest=[];for(const op of q){try{let error;if(op.type==='delete')({error}=await sb.from('events').delete().eq('id',op.id));else({error}=await sb.from('events').upsert(toRow(op.event),{onConflict:'id'}));if(error)rest.push(op)}catch{rest.push(op)}}setPending(rest)}
async function syncFromCloud(manual=false){if(!currentUser||!navigator.onLine||!sb||syncBusy)return;syncBusy=true;updateCloudUI();try{await flushPending();const{data,error}=await sb.from('events').select('*').order('date',{ascending:true});if(error)throw error;const syncedBefore=localStorage.getItem(SYNCED_USER_KEY)===currentUser.id;if((data||[]).length===0&&!syncedBefore&&events.length){const rows=events.map(toRow);const{error:upErr}=await sb.from('events').upsert(rows,{onConflict:'id'});if(upErr)throw upErr;localStorage.setItem(SYNCED_USER_KEY,currentUser.id);setSyncMessage('Agenda enviada para a nuvem ✓')}else{events=(data||[]).map(fromRow);save();localStorage.setItem(SYNCED_USER_KEY,currentUser.id);setSyncMessage(manual?'Sincronização concluída ✓':'Nuvem atualizada ✓')}}catch(err){setSyncMessage('Não foi possível sincronizar agora. Seus dados locais continuam salvos.')}finally{syncBusy=false;render()}}
function setSyncMessage(msg){document.querySelector('#syncState').textContent=msg;const a=document.querySelector('#authMessageIn');if(a)a.textContent=msg}
function updateCloudUI(){const status=document.querySelector('#status'),dot=document.querySelector('#syncDot'),state=document.querySelector('#syncState'),text=document.querySelector('#syncText');status.classList.remove('cloud','off');dot.classList.remove('ok','warn');if(!navigator.onLine){status.textContent='OFFLINE';status.classList.add('off');dot.classList.add('warn');state.textContent=pending().length?`${pending().length} alteração(ões) aguardando internet`:'Offline — dados locais disponíveis';text.textContent='A agenda continua funcionando neste aparelho e sincroniza quando a internet voltar.'}else if(currentUser){status.textContent='NUVEM ✓';status.classList.add('cloud');dot.classList.add('ok');if(!syncBusy&&!pending().length)state.textContent='Sincronizado';text.textContent=`Conectado como ${currentUser.email}. Alterações são salvas online.`}else{status.textContent='Entrar na nuvem';state.textContent='Modo local';text.textContent='Seus dados estão salvos neste aparelho. Entre na nuvem para sincronizar com outros dispositivos.'}document.querySelector('#authLoggedOut').style.display=currentUser?'none':'block';document.querySelector('#authLoggedIn').style.display=currentUser?'block':'none';if(currentUser)document.querySelector('#userEmail').textContent=currentUser.email||'Conta conectada'}

async function initAuth(){if(!sb){updateCloudUI();return}const{data}=await sb.auth.getSession();currentUser=data.session?.user||null;updateCloudUI();if(currentUser)syncFromCloud();sb.auth.onAuthStateChange((event,session)=>{currentUser=session?.user||null;updateCloudUI();if(currentUser&&(event==='SIGNED_IN'||event==='INITIAL_SESSION'))setTimeout(()=>syncFromCloud(),50)})}
function authErrorMessage(error){
  const code=error?.code,status=Number(error?.status||0);
  if(code==='invalid_credentials')return 'E-mail ou senha incorretos. Confira os dados e o preenchimento automático. Use Mostrar para conferir a senha.';
  if(code==='email_not_confirmed')return 'Confirme sua conta pelo link recebido no e-mail antes de entrar.';
  if(code==='over_request_rate_limit'||status===429)return 'Muitas tentativas em pouco tempo. Aguarde alguns minutos antes de tentar novamente.';
  if(code==='request_timeout')return 'A conexão demorou demais. Confira a internet e tente novamente.';
  if(status>=500)return 'A nuvem está temporariamente indisponível. Tente novamente em alguns instantes.';
  if(error?.name==='AuthRetryableFetchError'||error?.name==='TypeError')return 'Não foi possível conectar à nuvem. Confira a internet ou tente outra rede.';
  if(code==='user_banned')return 'Esta conta está temporariamente bloqueada. Entre em contato para verificar o acesso.';
  return 'Não foi possível entrar agora. Atualize a página e tente novamente.';
}
function setPasswordVisibility(visible){
  const input=document.querySelector('#authPassword'),button=document.querySelector('#togglePassword');
  input.type=visible?'text':'password';button.textContent=visible?'Ocultar':'Mostrar';
  button.setAttribute('aria-label',visible?'Ocultar senha':'Mostrar senha');button.setAttribute('aria-pressed',String(visible));
}

async function login(){
  const form=document.querySelector('#authLoggedOut'),button=document.querySelector('#loginBtn'),signupButton=document.querySelector('#signupBtn'),msg=document.querySelector('#authMessage');
  if(button.disabled||!form.reportValidity())return;
  if(!navigator.onLine){msg.textContent='Sem internet. Conecte-se para entrar na nuvem.';return}
  if(!sb){msg.textContent='Conexão com a nuvem indisponível. Atualize a página e tente novamente.';return}
  const email=document.querySelector('#authEmail').value.trim(),password=document.querySelector('#authPassword').value;
  setPasswordVisibility(false);
  button.disabled=true;signupButton.disabled=true;button.textContent='Entrando…';msg.textContent='Conectando à sua conta…';
  try{
    const{error}=await sb.auth.signInWithPassword({email,password});
    msg.textContent=error?authErrorMessage(error):'Login realizado ✓';
    if(!error)document.querySelector('#authPassword').value='';
  }catch(error){
    msg.textContent=authErrorMessage(error);
  }finally{
    button.disabled=false;signupButton.disabled=false;button.textContent='Entrar';
  }
}
async function signup(){const email=document.querySelector('#authEmail').value.trim(),password=document.querySelector('#authPassword').value,msg=document.querySelector('#authMessage');if(!email||password.length<6){msg.textContent='Informe um e-mail e uma senha com pelo menos 6 caracteres.';return}msg.textContent='Criando conta...';if(!sb){msg.textContent='Conexão com a nuvem indisponível.';return}const{data,error}=await sb.auth.signUp({email,password});if(error){msg.textContent=error.message;return}msg.textContent=data.session?'Conta criada e conectada ✓':'Conta criada. Confirme o e-mail recebido e depois toque em Entrar.'}

async function toggleComplete(id){const e=events.find(x=>x.id===id);if(!e)return;e.completed=!e.completed;e.completedAt=e.completed?new Date().toISOString():null;await persistEvent(e)}
async function deleteEvent(id){const e=events.find(x=>x.id===id);if(e&&confirm(`Excluir “${e.title}”?`)){const deleted=new Set(PM.read('pec-agenda-deleted-v1',[]));deleted.add(id);PM.write('pec-agenda-deleted-v1',[...deleted]);events=events.filter(x=>x.id!==id);await persistDelete(id)}}

let accountTrigger=null;
function openAccount(){
  accountTrigger=document.activeElement;
  const modal=document.querySelector('#accountModal');
  modal.classList.add('open');modal.setAttribute('aria-hidden','false');if(!modal.open)modal.showModal();updateCloudUI();
  modal.querySelector('.sheet').focus({preventScroll:true});
}
function closeAccount(){
  setPasswordVisibility(false);
  const modal=document.querySelector('#accountModal');
  const trigger=accountTrigger?.isConnected&&accountTrigger!==document.body&&!modal.contains(accountTrigger)?accountTrigger:(document.querySelector('#pmAccountLink')||document.querySelector('#status'));
  trigger.focus({preventScroll:true});
  modal.classList.remove('open');modal.setAttribute('aria-hidden','true');modal.close();
}
function handleNetwork(){updateCloudUI();if(navigator.onLine&&currentUser)syncFromCloud()}
function mountAgendaControls(){
document.querySelector('#togglePassword').onclick=()=>setPasswordVisibility(document.querySelector('#authPassword').type==='password');
document.querySelector('#eventForm').onsubmit=async ev=>{ev.preventDefault();const id=document.querySelector('#eventId').value||PM.uid('e'),old=events.find(x=>x.id===id),item={id,title:document.querySelector('#title').value.trim(),date:document.querySelector('#date').value,timeType:document.querySelector('#timeType').value,time:document.querySelector('#timeType').value==='time'?document.querySelector('#time').value:'',place:document.querySelector('#place').value.trim(),notes:document.querySelector('#notes').value.trim(),completed:!!old?.completed,completedAt:old?.completedAt||null};const i=events.findIndex(x=>x.id===id);if(i>=0)events[i]=item;else events.push(item);selectedMonth=monthKey(item.date);closeForm();await persistEvent(item);dispatchEvent(new CustomEvent('agenda:saved',{detail:{id:item.id,date:item.date}}))};
document.querySelector('#deleteBtn').onclick=()=>{const id=document.querySelector('#eventId').value;closeForm();if(id)deleteEvent(id)};document.querySelector('#addBtn').onclick=()=>openForm();document.querySelector('#closeBtn').onclick=closeForm;document.querySelector('#modal').onclick=e=>{if(e.target.id==='modal')closeForm()};document.querySelector('#timeType').onchange=toggleTime;
document.querySelector('#exportBtn').onclick=()=>{const blob=new Blob([JSON.stringify({app:'pec-agenda',version:3,exportedAt:new Date().toISOString(),events},null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`pec-agenda-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
document.querySelector('#importBtn').onclick=()=>document.querySelector('#importFile').click();document.querySelector('#importFile').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const data=JSON.parse(await f.text());if(!Array.isArray(data.events)||data.events.some(x=>!x||typeof x.id!=='string'||typeof x.title!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(x.date)||!['time','tbd','allnight'].includes(x.timeType)))throw new Error();if(confirm(`Importar ${data.events.length} eventos e substituir a agenda atual?`)){events=data.events.map(x=>({...x,completed:!!x.completed}));save();selectedMonth=null;render();if(currentUser){for(const item of events)queueOp({type:'upsert',id:item.id,event:item});syncFromCloud(true)}}}catch{alert('Arquivo de backup inválido.')}e.target.value=''};

document.querySelector('#accountModal').addEventListener('keydown',event=>{
  if(event.key==='Escape'){event.preventDefault();closeAccount();return}
  if(event.key!=='Tab')return;
  const modal=event.currentTarget,controls=[...modal.querySelectorAll('button,input,select,textarea,a[href],[tabindex="0"]')].filter(el=>!el.disabled&&el.offsetParent!==null),first=controls[0],last=controls[controls.length-1];
  if(!first)return;
  if(event.shiftKey&&(document.activeElement===first||!controls.includes(document.activeElement))){event.preventDefault();last.focus()}
  else if(!event.shiftKey&&(document.activeElement===last||!controls.includes(document.activeElement))){event.preventDefault();first.focus()}
});
document.querySelector('#accountBtn').onclick=openAccount;document.querySelector('#status').onclick=openAccount;document.querySelector('#accountClose').onclick=closeAccount;document.querySelector('#accountModal').onclick=e=>{if(e.target.id==='accountModal')closeAccount()};document.querySelector('#authLoggedOut').onsubmit=event=>{event.preventDefault();login()};document.querySelector('#signupBtn').onclick=signup;document.querySelector('#syncNowBtn').onclick=()=>syncFromCloud(true);document.querySelector('#logoutBtn').onclick=async()=>{if(sb)await sb.auth.signOut();currentUser=null;updateCloudUI()};

addEventListener('online',handleNetwork);addEventListener('offline',handleNetwork);render();
}
window.AgendaStore={get events(){return events},get user(){return currentUser},mount:mountAgendaControls,startAuth:initAuth,open:openForm,complete:toggleComplete,remove:deleteEvent,refresh:()=>syncFromCloud(true),duplicate(id){const e=events.find(e=>e.id===id);if(e){openForm({...e,title:e.title+' (cópia)'});document.querySelector('#eventId').value='';document.querySelector('#deleteBtn').style.display='none';document.querySelector('#formTitle').textContent='Duplicar evento'}}};
