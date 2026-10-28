// All amounts are integer cents. Invoice settlements are cash movements, never expenses.
export const MAX=99999999999;
export const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
export const uid=()=>crypto.randomUUID();
export const blank=()=>({version:1,accounts:[],cards:[],entries:[]});
export function cents(raw){const s=String(raw).trim();if(!/^\d+(?:,\d{1,2})?$/.test(s))throw Error('Digite o valor como 1200,50, sem pontos.');const [a,b='']=s.split(',');const n=Number(a)*100+Number(b.padEnd(2,'0'));if(!Number.isSafeInteger(n)||n>MAX)throw Error('Valor acima do permitido.');return n}
export function validDate(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s||''))return false;const d=new Date(s+'T12:00:00Z');return Number.isFinite(+d)&&d.toISOString().slice(0,10)===s&&+s.slice(0,4)>=2000&&+s.slice(0,4)<=2199}
export function addMonth(s,n){if(!validDate(s))throw Error('Data inválida.');const[y,m,d]=s.split('-').map(Number),base=new Date(Date.UTC(y,m-1+n,1,12));const day=Math.min(d,new Date(Date.UTC(base.getUTCFullYear(),base.getUTCMonth()+1,0)).getUTCDate());return `${base.getUTCFullYear()}-${String(base.getUTCMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`}
export function firstInvoice(date,card){const[y,m,d]=date.split('-').map(Number);const close=Number(card.closeDay),due=Number(card.dueDay);const closeMonth=new Date(Date.UTC(y,m-1+(d>Math.min(close,new Date(Date.UTC(y,m,0)).getUTCDate())?1:0),1,12));if(due<=close)closeMonth.setUTCMonth(closeMonth.getUTCMonth()+1);const last=new Date(Date.UTC(closeMonth.getUTCFullYear(),closeMonth.getUTCMonth()+1,0)).getUTCDate();return `${closeMonth.getUTCFullYear()}-${String(closeMonth.getUTCMonth()+1).padStart(2,'0')}-${String(Math.min(due,last)).padStart(2,'0')}`}
export function split(total,n){if(!Number.isInteger(n)||n<1||n>120||total<n)throw Error('Use de 1 a 120 parcelas, com pelo menos R$ 0,01 por parcela.');const base=Math.floor(total/n),rest=total%n;return Array.from({length:n},(_,i)=>base+(i<rest?1:0))}
function money(n,positive=false){return Number.isSafeInteger(n)&&Math.abs(n)<=MAX&&(!positive||n>0)}
function text(s){return typeof s==='string'&&s.trim().length>0&&s.length<=180}
export function validate(s){
 if(!s||s.version!==1||!['accounts','cards','entries'].every(k=>Array.isArray(s[k]))||s.accounts.length>100||s.cards.length>100||s.entries.length>20000)throw Error('Arquivo financeiro inválido ou acima do limite.');
 const ids=new Set();for(const row of [...s.accounts,...s.cards,...s.entries]){if(!/^[0-9a-f-]{36}$/i.test(row.id)||ids.has(row.id))throw Error('Identificador financeiro inválido.');ids.add(row.id)}
 for(const a of s.accounts)if(!text(a.name)||!money(a.opening))throw Error('Conta inválida.');
 for(const c of s.cards)if(!text(c.name)||!money(c.limit,true)||![c.closeDay,c.dueDay].every(n=>Number.isInteger(n)&&n>=1&&n<=31))throw Error('Cartão inválido.');
 const account=id=>s.accounts.some(a=>a.id===id),card=id=>s.cards.some(c=>c.id===id);
 for(const e of s.entries){
  if(!text(e.description)||!money(e.amount,true)||!validDate(e.date)||!['income','expense','card','transfer','payment'].includes(e.kind)||!['personal','work'].includes(e.scope)||!text(e.category)||e.paidOn!==null&&!validDate(e.paidOn))throw Error('Lançamento inválido.');
  if(e.kind==='card'){if(!card(e.cardId)||e.paidOn!==null)throw Error('Compra sem cartão válido.')}else if(!account(e.accountId))throw Error('Selecione uma conta válida.');
  if(e.kind==='transfer'&&(!account(e.targetId)||e.targetId===e.accountId)||e.kind==='payment'&&(!card(e.cardId)||!validDate((e.invoice||'')+'-01'))||['transfer','payment'].includes(e.kind)&&!e.paidOn)throw Error('Movimentação inválida.');
 }
 for(const inv of invoices(s))if(inv.paid>inv.total)throw Error('A alteração deixaria uma fatura com pagamento maior que as compras.');
 return s;
}
export function invoices(s){const map=new Map();for(const e of s.entries){if(!['card','payment'].includes(e.kind))continue;const month=e.kind==='card'?e.date.slice(0,7):e.invoice,key=e.cardId+':'+month;let row=map.get(key);if(!row){row={key,cardId:e.cardId,month,due:e.kind==='card'?e.date:month+'-01',total:0,paid:0};map.set(key,row)}if(e.kind==='card'){row.total+=e.amount;row.due=e.date>row.due?e.date:row.due}else row.paid+=e.amount}return [...map.values()].map(i=>({...i,remaining:i.total-i.paid})).sort((a,b)=>a.due.localeCompare(b.due))}
export function balances(s,asOf=today()){const result=Object.fromEntries(s.accounts.map(a=>[a.id,a.opening]));for(const e of s.entries){if(!e.paidOn||e.paidOn>asOf||e.kind==='card')continue;result[e.accountId]+=(e.kind==='income'?1:-1)*e.amount;if(e.kind==='transfer')result[e.targetId]+=e.amount}return result}
export function summary(s,month,scope='all'){const rows=s.entries.filter(e=>(scope==='all'||e.scope===scope));return{received:rows.filter(e=>e.kind==='income'&&e.paidOn?.startsWith(month)).reduce((a,e)=>a+e.amount,0),expenses:rows.filter(e=>['expense','card'].includes(e.kind)&&e.date.startsWith(month)).reduce((a,e)=>a+e.amount,0),pending:rows.filter(e=>e.kind==='expense'&&!e.paidOn&&e.date.startsWith(month)).reduce((a,e)=>a+e.amount,0),receivable:rows.filter(e=>e.kind==='income'&&!e.paidOn&&e.date.startsWith(month)).reduce((a,e)=>a+e.amount,0)}}
export function purchase(s,input){const card=s.cards.find(c=>c.id===input.cardId);if(!card)throw Error('Selecione um cartão.');const group=uid(),first=input.firstDue||firstInvoice(input.date,card);if(!validDate(first)||first<input.date)throw Error('A primeira fatura precisa vencer na data da compra ou depois.');return split(input.amount,input.installments).map((amount,i)=>({id:uid(),kind:'card',description:input.description,amount,date:addMonth(first,i),purchaseDate:input.date,cardId:card.id,scope:input.scope,category:input.category,paidOn:null,group,part:i+1,parts:input.installments}))}
export function remove(s,id){const e=s.entries.find(e=>e.id===id);if(!e)throw Error('Lançamento não encontrado.');const group=e.group;s.entries=s.entries.filter(r=>group?r.group!==group:r.id!==id);return validate(s)}
