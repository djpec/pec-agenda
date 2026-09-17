(() => {
  if (document.querySelector('#pecManagerBack')) return;

  const style=document.createElement('style');
  style.textContent=`
    #pecManagerBack{
      position:fixed;
      left:14px;
      bottom:18px;
      z-index:99999;
      display:flex;
      align-items:center;
      gap:8px;
      padding:10px 14px;
      border:1px solid rgba(255,255,255,.14);
      border-radius:999px;
      background:rgba(15,16,18,.92);
      color:#fff;
      text-decoration:none;
      font:800 12px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
      box-shadow:0 8px 24px rgba(0,0,0,.32);
      backdrop-filter:blur(14px);
      -webkit-backdrop-filter:blur(14px);
      transition:transform .15s ease, background .15s ease;
    }
    #pecManagerBack:hover{background:rgba(27,29,33,.96)}
    #pecManagerBack:active{transform:scale(.97)}
    #pecManagerBack .pm-home{
      width:22px;
      height:22px;
      border-radius:8px;
      background:#f2c94c;
      color:#111;
      display:grid;
      place-items:center;
      font-weight:950;
      font-size:12px;
      line-height:1;
    }
    @media(max-width:600px){
      #pecManagerBack{left:12px;bottom:76px;padding:9px 12px;font-size:11px}
      #pecManagerBack .pm-home{width:21px;height:21px}
    }
    @media print{#pecManagerBack{display:none!important}}
  `;
  document.head.appendChild(style);

  const a=document.createElement('a');
  a.id='pecManagerBack';
  a.href='./';
  a.setAttribute('aria-label','Voltar ao início do pec Manager');
  a.innerHTML='<span class="pm-home">⌂</span><span>Início</span>';
  document.body.appendChild(a);

  const params=new URLSearchParams(location.search);
  if(location.pathname.endsWith('agenda.html') && params.get('new')==='1'){
    const tryOpen=()=>{
      try{ if(typeof openForm==='function'){openForm();return true} }catch(_){ }
      return false;
    };
    let n=0;
    const timer=setInterval(()=>{n++;if(tryOpen()||n>20)clearInterval(timer)},150);
  }
})();
