(()=>{
 'use strict';document.body.classList.add('js');
 const menu=document.querySelector('.menu-toggle'),nav=document.querySelector('#navigation');menu.hidden=false;
 function close(){menu.setAttribute('aria-expanded','false');nav.classList.remove('is-open')}
 menu.onclick=()=>{const expanded=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(expanded));nav.classList.toggle('is-open',expanded)};
 nav.addEventListener('click',e=>{if(e.target.closest('a'))close()});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu.getAttribute('aria-expanded')==='true'){close();menu.focus()}});document.addEventListener('click',e=>{if(!e.target.closest('.header'))close()});
 // Contact uses the business number already published in the app; clicking only opens a draft.
 const contact=new URL('https://wa.me/5545991087615');contact.searchParams.set('text','Olá! Quero conhecer a Agenda do Artista e acompanhar o lançamento do plano de R$ 29,90 por mês.');for(const link of document.querySelectorAll('[data-contact]')){link.href=contact.href;link.target='_blank';link.rel='noopener noreferrer'}
 const screens={agenda:{src:'./marketing/agenda.webp',alt:'Calendário do sistema com eventos ilustrativos',caption:'Agenda · interface real com dados de demonstração.'},painel:{src:'./marketing/painel.webp',alt:'Painel do sistema com resumo e próximos eventos ilustrativos',caption:'Painel · interface real com dados de demonstração.'}};
 const image=document.querySelector('#previewImage'),caption=document.querySelector('#previewCaption'),dialog=document.querySelector('#previewDialog'),expand=document.querySelector('#expandPreview');let selected='agenda';
 for(const button of document.querySelectorAll('[data-preview]'))button.onclick=()=>{const screen=screens[button.dataset.preview];if(!screen)return;selected=button.dataset.preview;image.src=screen.src;image.alt=screen.alt;caption.textContent=screen.caption;for(const b of document.querySelectorAll('[data-preview]'))b.setAttribute('aria-pressed',String(b===button))};
 let previewTrigger=expand;
 function openPreview(screen,trigger,mobile=false){
  previewTrigger=trigger;dialog.classList.toggle('is-mobile-preview',mobile);dialog.querySelector('img').src=screen.src;dialog.querySelector('img').alt=screen.alt;dialog.querySelector('#previewDialogTitle').textContent=mobile?'No celular · '+screen.label:'Conheça a interface';dialog.showModal();
 }
 if(typeof dialog.showModal==='function'){
  expand.hidden=false;expand.onclick=()=>openPreview(screens[selected],expand);
  for(const button of document.querySelectorAll('[data-mobile-preview]'))button.onclick=event=>{event.preventDefault();const name=button.dataset.mobilePreview;openPreview({src:'./marketing/celular-'+name+'.webp',alt:button.querySelector('img').alt,label:name==='agenda'?'Agenda':'Painel'},button,true)};
  document.querySelector('#closePreview').onclick=()=>dialog.close();dialog.addEventListener('close',()=>previewTrigger.focus({preventScroll:true}));dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()});
 }
 if('IntersectionObserver'in window){const observer=new IntersectionObserver(items=>{for(const item of items)if(item.isIntersecting){item.target.classList.add('is-inview');observer.unobserve(item.target)}},{threshold:.12});for(const el of document.querySelectorAll('.reveal'))observer.observe(el)}
 let scheduled=false;function progress(){scheduled=false;const max=document.documentElement.scrollHeight-innerHeight;document.documentElement.style.setProperty('--progress',String(max>0?scrollY/max:0))}addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(progress)}},{passive:true});addEventListener('resize',()=>{if(innerWidth>800)close();progress()});progress();document.querySelector('#year').textContent=new Date().getFullYear();
})();
