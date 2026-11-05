export const STORY_WIDTH=1080,STORY_HEIGHT=1920;
const pad=n=>String(n).padStart(2,'0');
export const dayKey=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const storyTime=e=>{const type=e.timeType||e.time_type;if(type!=='time')return type==='allnight'?20*60:Infinity;const match=/^(\d{2}):(\d{2})/.exec(String(e.time||e.time_value||''));if(!match)return Infinity;const h=+match[1];return (h<12?h+24:h)*60+Number(match[2])};
export function storyEvents(events,date,mode){const start=new Date(date+'T12:00:00');if(Number.isNaN(+start))return [];if(mode==='week')start.setDate(start.getDate()-(start.getDay()+6)%7);const end=new Date(start);if(mode==='week')end.setDate(end.getDate()+6);return events.filter(e=>!e.completed&&e.date>=dayKey(start)&&e.date<=dayKey(end)).map(e=>({...e})).sort((a,b)=>a.date.localeCompare(b.date)||storyTime(a)-storyTime(b))}
export function nextStyle(previous=-1,random=Math.random){const choices=[0,1,2,3,4].filter(i=>i!==previous);return choices[Math.floor(random()*choices.length)]}
// Each model has its own type, composition and geometric signature.
export const STORY_PALETTES={
 graphite:{name:'Grafite',background:'#171b1a',accent:'#c1c9ba'},
 midnight:{name:'Azul noturno',background:'#101b2e',accent:'#adc8ee'},
 forest:{name:'Verde profundo',background:'#102b24',accent:'#abcfbb'},
 wine:{name:'Vinho',background:'#2b1725',accent:'#e0b6c5'},
 charcoal:{name:'Preto e dourado',background:'#161616',accent:'#d5bb81'},
 sand:{name:'Areia clara',background:'#f5f3ed',accent:'#646e57'},
 ice:{name:'Gelo',background:'#edeef0',accent:'#606b83'}
};
const validColor=v=>/^#[0-9a-f]{6}$/i.test(v||'');
const luminance=hex=>{const rgb=hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722};
const contrast=(a,b)=>(Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);
export function storyColors(palette='graphite',background,highlight){const preset=STORY_PALETTES[palette]||STORY_PALETTES.graphite,bg=validColor(background)?background:preset.background,ink=luminance(bg)>.3?'#20251f':'#f7f7f2';let accent=validColor(highlight)?highlight:preset.accent;if(contrast(bg,accent)<3)accent=ink;return{bg,accent,ink,dark:luminance(bg)<=.3}}

function lines(ctx,text,width,max=3){const words=String(text||'').split(/\s+/),out=[];let line='';for(const word of words){const next=line?line+' '+word:word;if(ctx.measureText(next).width>width&&line){out.push(line);line=word}else line=next}if(line)out.push(line);const result=out.slice(0,max);if(out.length>max)result[max-1]+='…';return result}
export const STORY_STYLES=['Editorial','Órbita','Pôster','Colagem','Traço'];
function text(ctx,value,x,y,width,size,color,max=2,weight=400,font='Manrope, sans-serif'){ctx.font=`${weight} ${size}px ${font}`;ctx.fillStyle=color;const result=lines(ctx,value,width,max);result.forEach((line,i)=>ctx.fillText(line,x,y+i*size*1.22,width));return result.length*size*1.22}
export function drawStory(canvas,{mode,date,events,style=0,palette='graphite',background=null,highlight=null,artist='pec',photo=null,photoOpacity=35,logo=null,page=0,pages=1}){
 canvas.width=STORY_WIDTH;canvas.height=STORY_HEIGHT;const c=canvas.getContext('2d');const {bg,accent,ink,dark}=storyColors(palette,background,highlight);
 c.fillStyle=bg;c.fillRect(0,0,1080,1920);
 if(photo){const scale=Math.max(1080/photo.width,1920/photo.height);c.globalAlpha=Math.max(0,Math.min(100,Number.isFinite(Number(photoOpacity))?Number(photoOpacity):35))/100;c.drawImage(photo,(1080-photo.width*scale)/2,(1920-photo.height*scale)/2,photo.width*scale,photo.height*scale);c.globalAlpha=1;const veil=c.createLinearGradient(0,0,0,1920);veil.addColorStop(0,bg+'26');veil.addColorStop(.5,bg+'0d');veil.addColorStop(1,bg+'4d');c.fillStyle=veil;c.fillRect(0,0,1080,1920)}
 const left=96,right=984,width=888;
 const serif='Georgia, "Times New Roman", serif',mono='"Courier New", monospace';
 const headingFont=style===0?serif:style===4?mono:'Manrope, sans-serif';
 const eventFont=style===0?serif:'Manrope, sans-serif';
 // Different shapes live in the header margins and keep the list unobstructed.
 c.strokeStyle=accent;c.fillStyle=accent;c.lineWidth=3;c.lineCap='round';
 if(style===0){c.beginPath();c.arc(925,220,52,0,Math.PI*2);c.stroke();c.beginPath();c.arc(897,220,52,0,Math.PI*2);c.stroke();c.fillRect(left,223,94,3)}
 if(style===1){for(let i=0;i<3;i++){c.globalAlpha=.6-i*.14;c.beginPath();c.arc(540,244,44+i*20,Math.PI,Math.PI*2);c.stroke()}c.globalAlpha=1;c.beginPath();c.arc(540,244,6,0,Math.PI*2);c.fill()}
 if(style===2){c.save();c.translate(145,225);c.rotate(-.2);c.fillRect(-48,-48,96,96);c.globalAlpha=.35;c.strokeRect(-20,-20,96,96);c.restore()}
 if(style===3){c.save();c.translate(900,215);c.rotate(.25);c.globalAlpha=.18;c.fillRect(-110,-26,220,52);c.restore();for(let i=0;i<5;i++){c.beginPath();c.moveTo(left+i*22,242);c.lineTo(left+34+i*22,200);c.stroke()}}
 if(style===4){c.beginPath();c.moveTo(left,225);c.bezierCurveTo(135,170,165,280,205,225);c.bezierCurveTo(245,170,275,280,315,225);c.stroke();c.strokeRect(923,190,44,44);c.fillRect(944,211,44,44)}
 c.globalAlpha=1;
 const headerX=style===1?540:style===2?right:left;
 c.textAlign=style===1?'center':style===2?'right':'left';
 const first=style===2?'AGENDA':'Agenda',second=mode==='week'?(style===2?'SEMANAL':'semanal.'):(style===2?'DO DIA':'do dia.');
 text(c,first,headerX,style===3?365:390,width,style===4?96:112,ink,1,style===2?800:300,headingFont);
 text(c,second,headerX,style===3?495:510,width,style===4?96:112,ink,1,style===2?800:style===0?400:600,headingFont);
 c.textAlign='left';c.fillStyle=accent;
 if(style===0){c.fillRect(left,566,150,2);c.beginPath();c.arc(left+166,567,4,0,Math.PI*2);c.fill()}
 if(style===1){c.beginPath();c.moveTo(516,560);c.lineTo(540,574);c.lineTo(564,560);c.stroke()}
 if(style===2)c.fillRect(right-180,565,180,9);
 if(style===3){c.save();c.translate(left,558);c.rotate(-.025);c.globalAlpha=.22;c.fillRect(0,0,320,22);c.restore()}
 if(style===4){for(let i=0;i<4;i++)c.fillRect(left+i*34,565,20,3)}
 c.globalAlpha=1;
 const size=events.length>4?34:42;let cursor=660;
 events.forEach((e,index)=>{const y=cursor,dt=new Date(e.date+'T12:00:00');c.fillStyle=ink;c.globalAlpha=.14;if(style===3)c.fillRect(left,y-22,3,94);else c.fillRect(left,y-40,width,1);c.globalAlpha=1;
 const rightDate=style===2,dateX=rightDate?840:left,titleX=rightDate?left:300,textWidth=rightDate?688:684;
 if(style===1){c.strokeStyle=accent;c.globalAlpha=.32;c.beginPath();c.arc(dateX+45,y+5,50,0,Math.PI*2);c.stroke();c.globalAlpha=1}
 text(c,dt.toLocaleDateString('pt-BR',{day:'2-digit'}),dateX,y+20,150,style===1?52:64,ink,1,style===2?700:300,style===4?mono:'Manrope, sans-serif');
 const label=dt.toLocaleDateString('pt-BR',{month:'short'}).replace('.','')+' / '+dt.toLocaleDateString('pt-BR',{weekday:'short'}).replace('.','');text(c,label.toUpperCase(),dateX,y+68,156,18,accent,1,500);
 let titleY=y+4;
 if(mode==='day'){const type=e.timeType||e.time_type;const hour=type==='allnight'?'NOITE TODA':type==='time'?String(e.time||e.time_value||'').slice(0,5)||'A CONFIRMAR':'A CONFIRMAR';text(c,hour,titleX,y,textWidth,23,accent,1,600);titleY+=38}
 const h=text(c,e.title||'Show',titleX,titleY,textWidth,size,ink,2,style===0?400:600,eventFont);
 const placeHeight=e.place?text(c,e.place,titleX,titleY+h+8,textWidth,26,accent,mode==='day'||events.length>4?1:2,400):0;
 cursor+=Math.max(100,(titleY-y)+h+(placeHeight?8+placeHeight:0))+(events.length>4?20:32);
 });
 c.fillStyle=ink;c.globalAlpha=.18;c.fillRect(left,1740,width,1);c.globalAlpha=1;
 const brandX=style===1?462:style===2?828:left;
 if(logo&&artist.toLowerCase()==='pec'){c.save();if(!dark)c.filter='brightness(0)';c.drawImage(logo,brandX,1784,156,61);c.restore()}else{c.textAlign=style===1?'center':style===2?'right':'left';text(c,artist||'Minha agenda',style===1?540:style===2?right:left,1827,700,38,ink,1,600);c.textAlign='left'}
 if(pages>1)text(c,`${page+1} / ${pages}`,style===2?left:805,1820,179,19,accent,1,500);else{c.strokeStyle=accent;c.lineWidth=2;const x=style===2?left:940;if(style===0||style===1){c.beginPath();c.arc(x,1814,17,0,Math.PI*2);c.stroke()}else if(style===3)c.strokeRect(x-17,1797,34,34);else{c.beginPath();c.moveTo(x-18,1827);c.lineTo(x+9,1800);c.stroke()}}return canvas
}
