export const STORY_WIDTH=1080,STORY_HEIGHT=1920;
const pad=n=>String(n).padStart(2,'0');
export const dayKey=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const storyTime=e=>{const type=e.timeType||e.time_type;if(type!=='time')return type==='allnight'?20*60:Infinity;const match=/^(\d{2}):(\d{2})/.exec(String(e.time||e.time_value||''));if(!match)return Infinity;const h=+match[1];return (h<12?h+24:h)*60+Number(match[2])};
export function storyEvents(events,date,mode){const start=new Date(date+'T12:00:00');if(Number.isNaN(+start))return [];if(mode==='week')start.setDate(start.getDate()-(start.getDay()+6)%7);const end=new Date(start);if(mode==='week')end.setDate(end.getDate()+6);return events.filter(e=>!e.completed&&e.date>=dayKey(start)&&e.date<=dayKey(end)).map(e=>({...e})).sort((a,b)=>a.date.localeCompare(b.date)||storyTime(a)-storyTime(b))}
export function nextStyle(previous=-1,random=Math.random){const choices=[0,1,2,3,4].filter(i=>i!==previous);return choices[Math.floor(random()*choices.length)]}
// Quiet palettes and a single variable type family keep every model consistent.
const themes=[['#f5f3ed','#646e57','#20251f'],['#171b1a','#c1c9ba','#f4f3ed'],['#edeef0','#606b83','#202633'],['#eaf0ec','#47695b','#1c3028'],['#f1eae5','#8b6754','#32271f']];
function lines(ctx,text,width,max=3){const words=String(text||'').split(/\s+/),out=[];let line='';for(const word of words){const next=line?line+' '+word:word;if(ctx.measureText(next).width>width&&line){out.push(line);line=word}else line=next}if(line)out.push(line);const result=out.slice(0,max);if(out.length>max)result[max-1]+='…';return result}
function text(ctx,value,x,y,width,size,color,max=2,weight=400){ctx.font=`${weight} ${size}px Manrope, sans-serif`;ctx.fillStyle=color;const result=lines(ctx,value,width,max);result.forEach((line,i)=>ctx.fillText(line,x,y+i*size*1.22,width));return result.length*size*1.22}
export function drawStory(canvas,{mode,date,events,style=0,artist='pec',photo=null,logo=null,page=0,pages=1}){
 canvas.width=STORY_WIDTH;canvas.height=STORY_HEIGHT;const c=canvas.getContext('2d');let [bg,accent,ink]=themes[style];
 if(photo){bg='#171b1a';accent='#cfd7c8';ink='#ffffff'}
 c.fillStyle=bg;c.fillRect(0,0,1080,1920);
 if(photo){const scale=Math.max(1080/photo.width,1920/photo.height);c.drawImage(photo,(1080-photo.width*scale)/2,(1920-photo.height*scale)/2,photo.width*scale,photo.height*scale);const veil=c.createLinearGradient(0,0,0,1920);veil.addColorStop(0,'#101714d9');veil.addColorStop(.5,'#101714bf');veil.addColorStop(1,'#101714ed');c.fillStyle=veil;c.fillRect(0,0,1080,1920)}
 const left=96,right=984,width=888;
 // Short strokes add rhythm without competing with the event names.
 c.strokeStyle=accent;c.lineWidth=4;c.lineCap='round';
 for(let i=0;i<3;i++){const x=left+i*22;c.beginPath();c.moveTo(x,242);c.lineTo(x+29,210);c.stroke()}
 c.globalAlpha=.32;c.lineWidth=2;
 for(let i=0;i<2;i++){c.beginPath();c.moveTo(860+i*38,240);c.lineTo(940+i*38,160);c.stroke()}
 c.globalAlpha=1;
 text(c,'Agenda',left,390,width,112,ink,1,300);
 text(c,mode==='week'?'semanal.':'do dia.',left,510,width,112,ink,1,600);
 c.fillStyle=accent;c.fillRect(left,570,90+style*12,3);c.globalAlpha=.3;c.fillRect(left+116+style*12,570,34,3);c.globalAlpha=1;
 const size=events.length>4?34:42;let cursor=660;
 events.forEach(e=>{const y=cursor,dt=new Date(e.date+'T12:00:00');c.fillStyle=ink;c.globalAlpha=.14;c.fillRect(left,y-40,width,1);c.globalAlpha=1;
 text(c,dt.toLocaleDateString('pt-BR',{day:'2-digit'}),left,y+20,150,64,ink,1,300);
 const label=dt.toLocaleDateString('pt-BR',{month:'short'}).replace('.','')+' / '+dt.toLocaleDateString('pt-BR',{weekday:'short'}).replace('.','');text(c,label.toUpperCase(),left,y+58,156,18,accent,1,500);
 let titleY=y+4;
 if(mode==='day'){const type=e.timeType||e.time_type;const hour=type==='allnight'?'NOITE TODA':type==='time'?String(e.time||e.time_value||'').slice(0,5)||'A CONFIRMAR':'A CONFIRMAR';text(c,hour,300,y,684,23,accent,1,600);titleY+=38}
 const h=text(c,e.title||'Show',300,titleY,684,size,ink,2,600);
 const placeHeight=e.place?text(c,e.place,300,titleY+h+8,684,26,accent,mode==='day'||events.length>4?1:2,400):0;
 cursor+=Math.max(100,(titleY-y)+h+(placeHeight?8+placeHeight:0))+(events.length>4?20:32);
 });
 c.fillStyle=ink;c.globalAlpha=.18;c.fillRect(left,1740,width,1);c.globalAlpha=1;
 if(logo&&artist.toLowerCase()==='pec'){c.save();if(!photo&&style!==1)c.filter='brightness(0)';c.drawImage(logo,left,1784,156,61);c.restore()}else text(c,artist||'Minha agenda',left,1827,700,38,ink,1,600);
 if(pages>1)text(c,`${page+1} / ${pages}`,805,1820,179,19,accent,1,500);else{c.strokeStyle=accent;c.lineWidth=3;for(let i=0;i<2;i++){c.beginPath();c.moveTo(926+i*24,1827);c.lineTo(950+i*24,1801);c.stroke()}}return canvas
}
