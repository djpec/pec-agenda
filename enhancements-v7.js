(() => {
  const DELETED_KEY='pec-agenda-deleted-v1';
  const BG_KEY='pec-agenda-bg-v1';

  function getDeleted(){try{return new Set(JSON.parse(localStorage.getItem(DELETED_KEY))||[])}catch{return new Set()}}
  function setDeleted(set){localStorage.setItem(DELETED_KEY,JSON.stringify([...set]))}

  // Exclusão persistente: guarda um marcador local até a nuvem confirmar/remover.
  try{
    deleteEvent = async function(id){
      const e=events.find(x=>x.id===id);
      if(!e||!confirm(`Excluir “${e.title}”?`))return;
      const deleted=getDeleted();deleted.add(id);setDeleted(deleted);
      events=events.filter(x=>x.id!==id);save();render();
      try{await persistDelete(id)}catch(_){/* fila local já protege */}
    };
  }catch(_){ }

  // Swipe mais natural e reversível.
  try{
    bindSwipe = function(){
      const ACTION=154;
      let currentlyOpen=null;
      document.querySelectorAll('.swipe').forEach(w=>{
        const card=w.querySelector('.event');
        let startX=null,startY=null,open=false,moved=false,current=0;
        const set=x=>{current=Math.max(-ACTION,Math.min(0,x));card.style.transform=`translateX(${current}px)`};
        const close=()=>{open=false;set(0)};
        card.addEventListener('pointerdown',ev=>{
          startX=ev.clientX;startY=ev.clientY;moved=false;
          if(currentlyOpen&&currentlyOpen!==close) currentlyOpen();
          try{card.setPointerCapture(ev.pointerId)}catch(_){ }
        });
        card.addEventListener('pointermove',ev=>{
          if(startX===null)return;
          const dx=ev.clientX-startX,dy=ev.clientY-startY;
          if(Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>8)return;
          if(Math.abs(dx)>6)moved=true;
          set((open?-ACTION:0)+dx);
        });
        const finish=ev=>{
          if(startX===null)return;
          const dx=(ev?.clientX??startX)-startX;
          if(open) open=dx<48; else open=dx<-42;
          set(open?-ACTION:0);
          currentlyOpen=open?close:null;
          startX=null;startY=null;
          setTimeout(()=>{moved=false},30);
        };
        card.addEventListener('pointerup',finish);
        card.addEventListener('pointercancel',finish);
        card.addEventListener('click',()=>{
          if(moved)return;
          if(open){close();currentlyOpen=null;return}
          openForm(events.find(e=>e.id===card.dataset.card));
        });
      });
      document.querySelectorAll('[data-action]').forEach(btn=>btn.onclick=ev=>{
        ev.stopPropagation();const id=btn.dataset.id;
        if(btn.dataset.action==='complete')toggleComplete(id);else deleteEvent(id);
      });
    };
  }catch(_){ }

  function calendarMonths(){
    const now=new Date(),keys=[];
    const startY=now.getFullYear(),endY=startY+1;
    for(let y=startY;y<=endY;y++)for(let m=1;m<=12;m++)keys.push(`${y}-${String(m).padStart(2,'0')}`);
    try{for(const k of allMonths())if(!keys.includes(k))keys.push(k)}catch(_){ }
    return [...new Set(keys)].sort();
  }

  try{
    renderMonths = function(){
      const box=document.querySelector('#months');
      if(currentView==='history'){box.style.display='none';return}
      box.style.display='flex';
      const keys=currentView==='calendar'?calendarMonths():allMonths();
      if(!keys.length){box.innerHTML='';selectedMonth=null;return}
      const now=new Date(),current=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
      if(!selectedMonth||!keys.includes(selectedMonth)){
        selectedMonth=currentView==='calendar'&&keys.includes(current)?current:(keys.find(x=>x>=current)||keys[0]);
      }
      box.innerHTML=keys.map(k=>`<button class="chip ${k===selectedMonth?'active':''}" data-month="${k}">${monthLabel(k)}</button>`).join('');
      box.querySelectorAll('[data-month]').forEach(b=>b.onclick=()=>{selectedMonth=b.dataset.month;selectedCalendarDay=null;render()});
      const active=box.querySelector('.chip.active');if(active)active.scrollIntoView({inline:'center',block:'nearest',behavior:'smooth'});
    };
  }catch(_){ }

  function openForDate(date){
    openForm();
    const f=document.querySelector('#date');if(f)f.value=date;
    selectedMonth=monthKey(date);
  }

  try{
    renderCalendar = function(){
      const root=document.querySelector('#agenda');if(!selectedMonth){root.innerHTML='';return}
      const [y,m]=selectedMonth.split('-').map(Number),first=new Date(y,m-1,1),days=new Date(y,m,0).getDate(),lead=first.getDay();
      const byDay={};events.filter(e=>monthKey(e.date)===selectedMonth).forEach(e=>(byDay[Number(e.date.slice(8))]??=[]).push(e));
      const now=new Date(),todayKey=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
      if(!selectedCalendarDay||monthKey(selectedCalendarDay)!==selectedMonth){selectedCalendarDay=monthKey(todayKey)===selectedMonth?todayKey:`${selectedMonth}-01`}
      let cells='';for(let i=0;i<lead;i++)cells+='<div class="calday emptyday"></div>';
      for(let d=1;d<=days;d++){
        const date=`${selectedMonth}-${String(d).padStart(2,'0')}`,items=byDay[d]||[],allDone=items.length&&items.every(e=>e.completed),dots=items.slice(0,3).map(e=>`<i class="caldot ${e.completed?'done':''}"></i>`).join('');
        cells+=`<button class="calday ${items.length?'has':''} ${allDone?'done':''} ${date===todayKey?'today':''} ${date===selectedCalendarDay?'selected':''}" data-caldate="${date}"><span class="calnum">${d}</span><span class="caldots">${dots}${items.length>3?`<em class="calmore">+${items.length-3}</em>`:''}</span></button>`;
      }
      root.innerHTML=`<section class="calendar"><div class="weekdays"><span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span></div><div class="calgrid">${cells}</div><div class="legend"><span><i></i>Agendado</span><span><i class="g"></i>Concluído</span></div></section><div id="calendarDetail" class="calendar-detail"></div>`;
      root.querySelectorAll('[data-caldate]').forEach(b=>b.onclick=()=>{
        const date=b.dataset.caldate,items=events.filter(e=>e.date===date);
        selectedCalendarDay=date;
        if(!items.length){openForDate(date);return}
        renderCalendar();
      });
      renderCalendarDetail();
    };

    renderCalendarDetail = function(){
      const box=document.querySelector('#calendarDetail');if(!box||!selectedCalendarDay)return;
      const list=sorted(events.filter(e=>e.date===selectedCalendarDay));
      box.innerHTML=`<div class="cal-detail-title">${longDate(selectedCalendarDay)}</div>${list.map(e=>`<div class="cal-event ${e.completed?'done':''}" data-calevent="${esc(e.id)}"><span class="cal-event-time">${esc(timeText(e))}</span><span class="cal-event-main"><b>${esc(e.title)}</b><small>${esc(e.place||(e.completed?'Concluído':'Agendado'))}</small></span></div>`).join('')}<button class="calendar-add-btn" id="calendarAddBtn">+ Novo show neste dia</button>`;
      box.querySelectorAll('[data-calevent]').forEach(el=>el.onclick=()=>openForm(events.find(e=>e.id===el.dataset.calevent)));
      const add=box.querySelector('#calendarAddBtn');if(add)add.onclick=()=>openForDate(selectedCalendarDay);
    };
  }catch(_){ }

  // Reaplica os comportamentos novos e força uma leitura limpa da nuvem.
  try{render()}catch(_){ }
  setTimeout(()=>{try{if(window.pecPullCloud)window.pecPullCloud(false)}catch(_){}},600);
})();
