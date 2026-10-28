// Recurring calendar rules, computed locally. Annual municipal decrees are not fetched.
const pad=n=>String(n).padStart(2,'0');
export const FOZ={city:'Foz do Iguaçu',uf:'PR',customHolidays:[]};
const fold=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
export const supportsCity=profile=>fold(profile.city)==='foz do iguacu'&&String(profile.uf).toUpperCase()==='PR';
function iso(d){return `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}`}
function easter(year){const a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),month=Math.floor((h+l-7*m+114)/31),day=(h+l-7*m+114)%31+1;return new Date(Date.UTC(year,month-1,day,12))}
export function holidayCalendar(year,profile=FOZ){
 const map=new Map(),add=(date,name,kind)=>{if(!map.has(date))map.set(date,[]);map.get(date).push({name,kind})};
 for(const[date,name]of [['01-01','Confraternização Universal'],['04-21','Tiradentes'],['05-01','Dia do Trabalho'],['09-07','Independência do Brasil'],['10-12','Nossa Senhora Aparecida'],['11-02','Finados'],['11-15','Proclamação da República'],['12-25','Natal']])add(year+'-'+date,name,'national');
 if(year>=2024)add(year+'-11-20','Dia da Consciência Negra','national');
 if(supportsCity(profile)){add(year+'-06-10','Aniversário de Foz do Iguaçu','municipal');add(year+'-06-24','São João Batista','municipal');for(const[offset,name]of [[-2,'Sexta-feira da Paixão'],[60,'Corpus Christi']]){const d=easter(year);d.setUTCDate(d.getUTCDate()+offset);add(iso(d),name,'municipal')}}
 for(const row of profile.customHolidays||[]){if(!row||typeof row.name!=='string'||!row.name.trim()||row.name.length>80)continue;const date=/^\d{2}-\d{2}$/.test(row.date)?year+'-'+row.date:row.date;if(!/^\d{4}-\d{2}-\d{2}$/.test(date||'')||!date.startsWith(year+'-'))continue;const d=new Date(date+'T12:00:00Z');if(!Number.isFinite(+d)||iso(d)!==date)continue;add(date,row.name.trim(),'custom')}
 return map;
}
export function holidayLookup(years,profile){const map=new Map();for(const year of [...new Set(years)])for(const [date,events]of holidayCalendar(year,profile))map.set(date,events);return map}
