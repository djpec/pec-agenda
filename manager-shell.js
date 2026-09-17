(() => {
  const KEY='pec-manager-theme';
  const ORDER=['auto','dark','light'];
  const LABEL={auto:'Automático',dark:'Escuro',light:'Claro'};
  const ICON={auto:'◐',dark:'☾',light:'☀'};
  function selected(){return localStorage.getItem(KEY)||'auto'}
  function resolved(mode){return mode==='auto'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):mode}
  function apply(mode=selected()){
    const r=resolved(mode);
    document.documentElement.dataset.pmTheme=r;
    document.documentElement.dataset.pmThemeMode=mode;
    const b=document.querySelector('#pmThemeBtn');
    if(b)b.innerHTML=`<span>${ICON[mode]}</span><span>${LABEL[mode]}</span>`;
  }
  const css=document.createElement('style');
  css.textContent=`
#pmShell{position:fixed;right:12px;bottom:calc(14px + env(safe-area-inset-bottom));z-index:2147483000;display:flex;gap:7px;align-items:center;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
.pm-shell-btn{height:38px;border:1px solid rgba(255,255,255,.13);border-radius:999px;background:rgba(14,15,17,.92);color:#fff;padding:0 12px;display:flex;align-items:center;gap:7px;text-decoration:none;font-size:11px;font-weight:850;box-shadow:0 8px 24px rgba(0,0,0,.24);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);cursor:pointer}.pm-home{width:38px;padding:0;justify-content:center}.pm-home b{width:22px;height:22px;border-radius:7px;background:#f2c94c;color:#111;display:grid;place-items:center;font-size:11px;letter-spacing:-1px}.pm-shell-btn:active{transform:scale(.98)}
html[data-pm-theme="light"] body{color-scheme:light}
html[data-pm-theme="dark"] body{color-scheme:dark}
html[data-pm-theme="light"] body:not([data-theme]){--bg:#eceeed;--card:#ffffff;--card2:#f4f5f4;--line:#d8dcda;--text:#171918;--muted:#717873}
html[data-pm-theme="light"] body:not([data-theme]) .hero,html[data-pm-theme="light"] body:not([data-theme]) .module,html[data-pm-theme="light"] body:not([data-theme]) .event,html[data-pm-theme="light"] body:not([data-theme]) .sync-card{box-shadow:0 12px 34px rgba(0,0,0,.08)}
html[data-pm-theme="light"] body:not([data-theme]) .status{background:#e3e5e4;color:#5d635f}
html[data-pm-theme="light"] body[data-theme] {--app:#eceeed;--panel:#f7f8f7;--panel2:#ffffff}
html[data-pm-theme="light"] body[data-theme] .editor{color:#171918;border-right-color:#d8dcda}
html[data-pm-theme="light"] body[data-theme] .editor .lead,html[data-pm-theme="light"] body[data-theme] .note{color:#6e746f}
html[data-pm-theme="light"] body[data-theme] details{border-color:#d8dcda;background:#fff}
html[data-pm-theme="light"] body[data-theme] label{color:#333733}
html[data-pm-theme="light"] body[data-theme] input,html[data-pm-theme="light"] body[data-theme] textarea,html[data-pm-theme="light"] body[data-theme] select{background:#f6f7f6;color:#171918;border-color:#d0d4d1}
html[data-pm-theme="light"] body[data-theme] .editor-item{background:#f8f8f7;border-color:#d8dcda}
html[data-pm-theme="light"] body[data-theme] .secondary{background:#e4e6e4;color:#171918}
html[data-pm-theme="light"] body .sidebar{background:linear-gradient(180deg,#f8f9f8,#eceeed)!important;color:#171918!important;border-right-color:#d8dcda!important}
html[data-pm-theme="light"] body .sidebar .brand p,html[data-pm-theme="light"] body .sidebar .field-help{color:#6e746f!important}
html[data-pm-theme="light"] body .sidebar .section{background:#fff!important;border-color:#d8dcda!important}
html[data-pm-theme="light"] body .sidebar .field label,html[data-pm-theme="light"] body .sidebar .switch-row{color:#303430!important}
html[data-pm-theme="light"] body .sidebar input,html[data-pm-theme="light"] body .sidebar select,html[data-pm-theme="light"] body .sidebar textarea{background:#f6f7f6!important;color:#171918!important;border-color:#d0d4d1!important}
html[data-pm-theme="light"] body .sidebar .btn-secondary{background:#e4e6e4!important;color:#171918!important;border-color:#d2d6d3!important}
@media print{#pmShell{display:none!important}}
@media(max-width:600px){#pmShell{right:9px;bottom:calc(9px + env(safe-area-inset-bottom))}.pm-shell-btn{height:36px;padding:0 10px}.pm-home{width:36px}}
`;
  document.head.appendChild(css);
  const shell=document.createElement('div'); shell.id='pmShell';
  const isHome=location.pathname.endsWith('/')||location.pathname.endsWith('/index.html');
  if(!isHome){const a=document.createElement('a');a.href='./';a.className='pm-shell-btn pm-home';a.title='pec Manager';a.innerHTML='<b>pec</b>';shell.appendChild(a)}
  const btn=document.createElement('button');btn.id='pmThemeBtn';btn.className='pm-shell-btn';btn.type='button';btn.onclick=()=>{const m=selected(),n=ORDER[(ORDER.indexOf(m)+1)%ORDER.length];localStorage.setItem(KEY,n);apply(n)};shell.appendChild(btn);document.body.appendChild(shell);
  apply();
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change',()=>{if(selected()==='auto')apply('auto')});
})();
