(() => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  let pulling = false;

  function addManualSyncButton() {
    if (document.querySelector('#manualCloudSync')) return;
    const card = document.querySelector('.sync-card');
    if (!card) return;
    const btn = document.createElement('button');
    btn.id = 'manualCloudSync';
    btn.className = 'mini';
    btn.type = 'button';
    btn.textContent = 'Sincronizar agora';
    btn.style.marginTop = '12px';
    btn.onclick = () => pullCloud(true);
    card.appendChild(btn);
  }

  async function fetchRowsDirect(session) {
    const url = `${SUPABASE_URL}/rest/v1/events?select=*&order=date.asc`;
    const res = await fetch(url, {
      cache: 'no-store',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${session.access_token}`,
        Accept: 'application/json'
      }
    });
    if (!res.ok) throw new Error(`REST ${res.status}`);
    return await res.json();
  }

  async function pullCloud(manual = false) {
    if (pulling || !navigator.onLine) return;
    if (typeof sb === 'undefined' || !sb) return;
    pulling = true;
    try {
      if (typeof setSyncMessage === 'function') setSyncMessage('Buscando agenda na nuvem...');
      const { data: sessionData, error: sessionError } = await sb.auth.getSession();
      if (sessionError || !sessionData?.session) {
        if (typeof setSyncMessage === 'function') setSyncMessage('Entre na conta para sincronizar.');
        return;
      }

      const session = sessionData.session;
      if (typeof currentUser !== 'undefined') currentUser = session.user;

      let rows = [];
      let queryError = null;
      try {
        const result = await sb.from('events').select('*').order('date', { ascending: true });
        rows = result.data || [];
        queryError = result.error || null;
      } catch (err) {
        queryError = err;
      }

      if (queryError || rows.length === 0) {
        try {
          const directRows = await fetchRowsDirect(session);
          if (Array.isArray(directRows)) rows = directRows;
        } catch (err) {
          if (queryError) throw queryError;
        }
      }

      if (rows.length > 0) {
        events = rows.map(fromRow);
        save();
        selectedMonth = null;
        selectedCalendarDay = null;
        localStorage.setItem(SYNCED_USER_KEY, session.user.id);
        if (typeof setPending === 'function') setPending([]);
        if (typeof setSyncMessage === 'function') setSyncMessage(`${rows.length} eventos sincronizados ✓`);
        if (typeof render === 'function') render();
        if (typeof updateCloudUI === 'function') updateCloudUI();
        const state = document.querySelector('#syncState');
        if (state) state.textContent = `${rows.length} eventos na nuvem ✓`;
        return;
      }

      // Proteção para navegador novo: se a conta estiver vazia por algum motivo,
      // mantém a agenda padrão visível e tenta enviá-la para a nuvem.
      if ((!events || events.length === 0) && typeof DEFAULT_EVENTS !== 'undefined' && DEFAULT_EVENTS.length) {
        events = DEFAULT_EVENTS.map(e => ({ ...e, completed: false, completedAt: null }));
        save();
        if (typeof render === 'function') render();
        try {
          const payload = events.map(toRow);
          const { error: uploadError } = await sb.from('events').upsert(payload, { onConflict: 'id' });
          if (!uploadError) {
            localStorage.setItem(SYNCED_USER_KEY, session.user.id);
            if (typeof setSyncMessage === 'function') setSyncMessage(`${events.length} eventos enviados para a nuvem ✓`);
          }
        } catch (_) {}
      } else if (typeof setSyncMessage === 'function') {
        setSyncMessage(manual ? 'Nenhum evento encontrado na nuvem.' : 'Nuvem conectada.');
      }
    } catch (err) {
      console.error('pec Agenda cloud sync:', err);
      if (typeof setSyncMessage === 'function') setSyncMessage('Falha ao puxar a nuvem. Seus dados locais continuam salvos.');
    } finally {
      pulling = false;
      addManualSyncButton();
    }
  }

  // Substitui a sincronização antiga por uma leitura mais robusta.
  try {
    syncFromCloud = pullCloud;
  } catch (_) {}

  window.pecPullCloud = pullCloud;
  addManualSyncButton();
  window.addEventListener('load', () => setTimeout(() => pullCloud(false), 900));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') setTimeout(() => pullCloud(false), 250);
  });
  window.addEventListener('online', () => setTimeout(() => pullCloud(false), 250));
})();
