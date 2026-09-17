(() => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const DELETED_KEY = 'pec-agenda-deleted-v1';
  let pulling = false;

  function deletedIds(){
    try { return new Set(JSON.parse(localStorage.getItem(DELETED_KEY)) || []); }
    catch { return new Set(); }
  }

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

  async function enforceDeleted(session){
    const ids = [...deletedIds()];
    if (!ids.length || !navigator.onLine) return;
    for (const id of ids) {
      try { await sb.from('events').delete().eq('id', id); } catch (_) {}
    }
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
      await enforceDeleted(session);

      let rows = [];
      let queryError = null;
      try {
        const result = await sb.from('events').select('*').order('date', { ascending: true });
        rows = result.data || [];
        queryError = result.error || null;
      } catch (err) {
        queryError = err;
      }

      if (queryError) {
        rows = await fetchRowsDirect(session);
      }

      const removed = deletedIds();
      rows = (rows || []).filter(r => !removed.has(r.id));

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

      // Conta vazia: só envia o que realmente existe no aparelho.
      // Não recria a agenda padrão, para eventos cancelados/excluídos não voltarem.
      const syncedBefore = localStorage.getItem(SYNCED_USER_KEY) === session.user.id;
      if (!syncedBefore && Array.isArray(events) && events.length) {
        const safeEvents = events.filter(e => !removed.has(e.id));
        if (safeEvents.length) {
          const payload = safeEvents.map(toRow);
          const { error: uploadError } = await sb.from('events').upsert(payload, { onConflict: 'id' });
          if (uploadError) throw uploadError;
          localStorage.setItem(SYNCED_USER_KEY, session.user.id);
          if (typeof setSyncMessage === 'function') setSyncMessage(`${safeEvents.length} eventos enviados para a nuvem ✓`);
          events = safeEvents;
          save();
          if (typeof render === 'function') render();
          return;
        }
      }

      events = [];
      save();
      selectedMonth = null;
      selectedCalendarDay = null;
      localStorage.setItem(SYNCED_USER_KEY, session.user.id);
      if (typeof render === 'function') render();
      if (typeof setSyncMessage === 'function') setSyncMessage(manual ? 'Agenda sincronizada: nenhum evento na nuvem.' : 'Nuvem conectada.');
    } catch (err) {
      console.error('pec Agenda cloud sync:', err);
      if (typeof setSyncMessage === 'function') setSyncMessage('Falha ao puxar a nuvem. Seus dados locais continuam salvos.');
    } finally {
      pulling = false;
      addManualSyncButton();
    }
  }

  try { syncFromCloud = pullCloud; } catch (_) {}

  window.pecPullCloud = pullCloud;
  addManualSyncButton();
  window.addEventListener('load', () => setTimeout(() => pullCloud(false), 700));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') setTimeout(() => pullCloud(false), 250);
  });
  window.addEventListener('online', () => setTimeout(() => pullCloud(false), 250));
})();
