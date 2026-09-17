(() => {
  const params=new URLSearchParams(location.search);
  if(params.get('new')==='1')openForm();
  if(params.get('account')==='1')openAccount();
  // The shared appearance controls replace the earlier independent background panel.
  document.querySelector('.personalize-card')?.remove();
})();
