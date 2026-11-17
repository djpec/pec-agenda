const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const p=await b.newPage();
  await p.goto('http://127.0.0.1:8774/agenda.html');
  await p.waitForFunction(()=>document.documentElement.dataset.workspaceReady==='true');
  const result=await p.evaluate(async()=>{
   const {drawStory}=await import('/ui/story-art.mjs?v=10');
   await document.fonts.ready;
   const samples=[];
   for(const count of [1,6,8,13,31,60]){
    for(let style=0;style<5;style++)for(const mode of ['day','week','month']){
     const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d'),calls=[];
     const original=ctx.fillText.bind(ctx);
     ctx.fillText=function(value,x,y,...rest){
      const m=this.measureText(value),t=this.getTransform();
      if(y>=620&&(y<1740||t.a!==1||t.d!==1||t.e!==0||t.f!==0)){
       const left=this.textAlign==='center'?x-m.width/2:this.textAlign==='right'?x-m.width:x;
       const a=new DOMPoint(left,y-m.actualBoundingBoxAscent).matrixTransform(t);
       const z=new DOMPoint(left+Math.min(m.width,rest[0]||m.width),y+m.actualBoundingBoxDescent).matrixTransform(t);
       calls.push({value,top:a.y,bottom:z.y,left:a.x,right:z.x});
      }
      return original(value,x,y,...rest);
     };
     const events=Array.from({length:count},(_,i)=>({date:'2026-11-'+String(i%30+1).padStart(2,'0'),title:'Evento '+i,place:'Local para divulgação do evento',timeType:'time',time:'23:00'}));
     drawStory(canvas,{mode,date:'2026-11-15',style,events});
     for(let i=0;i<count;i++)if(!calls.some(c=>c.value==='Evento '+i))throw Error('Missing event '+JSON.stringify({count,style,mode,i}));
     for(const c of calls)if(c.top<600||c.bottom>1720||c.left<90||c.right>990)throw Error('Overflow '+JSON.stringify({count,style,mode,...c}));
     if(mode==='month'&&((count===13&&style===0)||(count===31&&style===1)))samples.push({count,image:canvas.toDataURL()});
    }
   }
   return samples;
  });
  for(const sample of result)require('fs').writeFileSync('/tmp/story-fit-'+sample.count+'.png',Buffer.from(sample.image.split(',')[1],'base64'));
  console.log('PASS 90 layouts: every event rendered inside list bounds, 1–60 events, all models and formats');
 }finally{await b.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
