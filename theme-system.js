(() => {
  const KEY='pec-manager-ui-theme';
  const MODES=['system','light','dark'];
  const mq=window.matchMedia?.('(prefers-color-scheme: dark)');
  const style=document.createElement('style');
  style.id='pec-theme-style';
  style.textContent=`
  #pecThemeToggle{position:fixed;z-index:999999;right:12px;top:12px;border:1px solid rgba(127,127,127,.28);background:rgba(18,20,23,.86);color:#fff;border-radius:999px;padding:8px 10px;font:800 10px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;letter-spacing:.02em;box-shadow:0 7px 24px rgba(0,0,0,.22);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);cursor:pointer}
  body.pec-agenda-page #pecThemeToggle{top:68px}
  html[data-pec-ui="light"] #pecThemeToggle{background:rgba(255,255,255,.9);color:#16181b;border-color:#d9dde2}
  @media print{#pecThemeToggle{display:none!important}}
  html[data-pec-ui="light"]{--bg:#f3f5f7!important;--card:#ffffff!important;--card2:#f0f2f4!important;--line:#d9dee4!important;--text:#17191d!important;--muted:#67717d!important;--app:#eef0f2!important;--panel:#ffffff!important;--panel2:#f5f6f7!important;--panel-2:#f5f6f7!important}
  html[data-pec-ui="light"] body{background:#f3f5f7!important;color:#17191d}
  html[data-pec-ui="light"] .editor,html[data-pec-ui="light"] .sidebar{background:#fff!important;color:#17191d!important;border-color:#d9dee4!important}
  html[data-pec-ui="light"] .editor .lead,html[data-pec-ui="light"] .brand p,html[data-pec-ui="light"] .field-help,html[data-pec-ui="light"] .note{color:#6b737d!important}
  html[data-pec-ui="light"] .editor details,html[data-pec-ui="light"] .sidebar .section{background:#f5f6f7!important;border-color:#d9dee4!important}
  html[data-pec-ui="light"] .editor label,html[data-pec-ui="light"] .sidebar .field label,html[data-pec-ui="light"] .sidebar .switch-row{color:#30343a!important}
  html[data-pec-ui="light"] .editor input,html[data-pec-ui="light"] .editor textarea,html[data-pec-ui="light"] .editor select,html[data-pec-ui="light"] .sidebar input,html[data-pec-ui="light"] .sidebar textarea,html[data-pec-ui="light"] .sidebar select{background:#fff!important;color:#17191d!important;border-color:#cdd3da!important}
  html[data-pec-ui="light"] .sidebar .extra-card,html[data-pec-ui="light"] .sidebar .extra-main input,html[data-pec-ui="light"] .sidebar .extra-meta input,html[data-pec-ui="light"] .sidebar .extra-meta select{background:#fff!important;color:#17191d!important;border-color:#cdd3da!important}
  html[data-pec-ui="light"] .sidebar{background:linear-gradient(180deg,#fff,#f0f2f4)!important}
  html[data-pec-ui="light"] .status{background:#eef1f4!important;color:#4d5661!important;border-color:#d8dde3!important}
  html[data-pec-ui="light"] .stage,html[data-pec-ui="light"] .workspace{background:#eef0f2!important}
  html[data-pec-ui="light"] .document-shell{background:#dfe3e7!important}
  html[data-pec-ui="light"] .module,html[data-pec-ui="light"] .next{background:rgba(255,255,255,.96)!important}
  html[data-pec-ui="light"] .hero:not(.doc .hero){background:linear-gradient(145deg,#fff,#f2f4f6)!important}
  html[data-pec-ui="light"] .hero:not(.doc .hero) h1,html[data-pec-ui="light"] .hero:not(.doc .hero) h2{color:#17191d!important}
  html[data-pec-ui="light"] .hero:not(.doc .hero) p{color:#67717d!important}
  html[data-pec-ui="dark"]{--bg:#0b0c0e!important;--card:#15171a!important;--card2:#1b1e22!important;--line:#292d32!important;--text:#f6f7f8!important;--muted:#959ca6!important;--app:#0b0c0e!important;--panel:#141414!important;--panel2:#1c1c1c!important;--panel-2:#1a1d23!important}
  html[data-pec-ui="dark"] body{background:#0b0c0e!important}
  html[data-pec-ui="dark"] .workspace,html[data-pec-ui="dark"] .stage{background:#0b0c0e!important}
  html[data-pec-ui="dark"] .document-shell{background:#202329!important}
  `;
  document.head.appendChild(style);
  function getMode(){const v=localStorage.getItem(KEY);return MODES.includes(v)?v:'system'}
  function resolved(mode){return mode==='system'?(mq?.matches?'dark':'light'):mode}
  function apply(){const mode=getMode(),r=resolved(mode);document.documentElement.dataset.pecUi=r;document.documentElement.dataset.pecUiMode=mode;const b=document.getElementById('pecThemeToggle');if(b){const map={system:'◐ Automático',light:'☀ Claro',dark:'☾ Escuro'};b.textContent=map[mode];b.title='Tema do pec Manager: '+map[mode]}}
  function createButton(){if(document.getElementById('pecThemeToggle'))return;const b=document.createElement('button');b.id='pecThemeToggle';b.type='button';b.onclick=()=>{const m=getMode();localStorage.setItem(KEY,MODES[(MODES.indexOf(m)+1)%MODES.length]);apply()};document.body.appendChild(b);apply()}
  const p=location.pathname;if(p.endsWith('/agenda.html'))document.body?.classList.add('pec-agenda-page');
  apply();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',createButton);else createButton();mq?.addEventListener?.('change',()=>{if(getMode()==='system')apply()});
})();
