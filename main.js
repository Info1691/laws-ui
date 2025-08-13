/* Laws Repository — robust loader + in-text search with highlights and prev/next
   Works with:
   - data/laws/<jurisdiction>/laws.json
   - or fallback: ./laws.json
*/

(function () {
  const els = {
    itemList: document.getElementById('itemList'),
    listSearch: document.getElementById('listSearch'),
    textSearch: document.getElementById('textSearch'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    docText: document.getElementById('docText'),
    status: document.getElementById('status'),
    jurisdiction: document.getElementById('jurisdiction'),
    reference: document.getElementById('reference'),
    source: document.getElementById('source'),
    printBtn: document.getElementById('printBtn'),
    exportBtn: document.getElementById('exportBtn'),
  };

  // ---- Config: where to find the registry ----
  const CANDIDATE_REGISTRIES = [
    'data/laws/jersey/laws.json',
    'data/laws/laws.json',
    'laws.json'
  ];

  // ---- State ----
  let registry = [];
  let filtered = [];
  let current = null;               // current registry item
  let plainText = '';               // raw loaded text
  let hits = [];                    // NodeList of <mark> or coords
  let hitIndex = -1;                // current hit pointer
  let lastQuery = '';

  // ---- Utilities ----
  const escapeHTML = (s) => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const debounce = (fn, ms) => { let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); }; };

  async function fetchFirstOk(urls) {
    for (const u of urls) {
      try {
        const r = await fetch(u, {cache:'no-store'});
        if (r.ok) return { url: u, json: await r.json() };
      } catch {}
    }
    throw new Error('Could not load laws.json from any known location.');
  }

  // ---- Rendering list ----
  function renderList(list) {
    els.itemList.innerHTML = '';
    list.forEach((item, idx) => {
      const li = document.createElement('li');
      li.setAttribute('role','option');
      li.innerHTML = `<div><strong>${escapeHTML(item.title || '')}</strong></div>
                      <div style="font-size:.85rem;color:#555">${escapeHTML(item.jurisdiction||'')}</div>`;
      li.addEventListener('click', () => selectItem(item, li));
      els.itemList.appendChild(li);
      // Preselect first if nothing selected
      if (idx === 0 && !current) {
        selectItem(item, li);
      }
    });
  }

  function selectItem(item, liEl) {
    current = item;
    // active class
    [...els.itemList.children].forEach(li => li.classList.remove('active'));
    if (liEl) liEl.classList.add('active');
    // meta
    els.jurisdiction.textContent = item.jurisdiction || '—';
    els.reference.textContent = item.reference || '—';
    els.source.textContent = item.source || '—';
    // load text
    loadTextFile(item.text_file);
  }

  // ---- Load and show text ----
  async function loadTextFile(path) {
    resetSearchState();
    els.status.textContent = 'Loading…';
    els.docText.innerHTML = 'Loading…';
    try {
      const r = await fetch(path, {cache:'no-store'});
      if (!r.ok) throw new Error(`${path} → ${r.status}`);
      // Force UTF-8 text
      plainText = await r.text();
      els.docText.innerHTML = escapeHTML(plainText);
      els.status.textContent = `Loaded: ${path}`;
      // If there’s an active query, re-run highlight (e.g., when switching laws)
      if (els.textSearch.value.trim()) {
        highlightMatches(els.textSearch.value.trim());
      }
    } catch (e) {
      els.docText.textContent = `Error loading: ${path}\n${e.message}`;
      els.status.textContent = 'Load error.';
    }
  }

  // ---- Search & highlight ----
  function resetSearchState() {
    hits = [];
    hitIndex = -1;
    lastQuery = '';
    els.prevBtn.disabled = true;
    els.nextBtn.disabled = true;
  }

  function highlightMatches(query) {
    const q = query.trim();
    if (!q) {
      // remove marks → revert to plain text
      els.docText.innerHTML = escapeHTML(plainText || '');
      resetSearchState();
      els.status.textContent = 'Cleared search.';
      return;
    }

    // Build safe regex (case-insensitive)
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');

    // Replace with markers; number hits deterministically
    let hitCounter = 0;
    const replaced = (plainText || '').replace(rx, (m) => {
      const id = hitCounter++;
      return `<mark data-hit="${id}">${escapeHTML(m)}</mark>`;
    });

    els.docText.innerHTML = replaced;
    hits = [...els.docText.querySelectorAll('mark[data-hit]')];
    lastQuery = q;

    if (hits.length === 0) {
      els.status.textContent = `No results for “${q}”.`;
      els.prevBtn.disabled = true;
      els.nextBtn.disabled = true;
      hitIndex = -1;
      return;
    }

    // enable nav
    els.prevBtn.disabled = false;
    els.nextBtn.disabled = false;

    // jump to first
    hitIndex = 0;
    scrollToHit(hitIndex);
    updateStatus();
  }

  function scrollToHit(i) {
    const el = hits[i];
    if (!el) return;
    el.scrollIntoView({behavior:'smooth', block:'center'});
    // visual cue for current hit
    hits.forEach(h => h.style.outline = '');
    el.style.outline = '2px solid #ffa600';
  }

  function updateStatus() {
    if (hits.length) {
      els.status.textContent = `Matches: ${hits.length}  —  Viewing ${hitIndex + 1} of ${hits.length}  —  Query: “${lastQuery}”`;
    } else {
      els.status.textContent = '';
    }
  }

  // ---- Events ----
  const onTextSearch = debounce(() => {
    highlightMatches(els.textSearch.value);
  }, 180);

  els.textSearch.addEventListener('input', onTextSearch);

  els.prevBtn.addEventListener('click', () => {
    if (!hits.length) return;
    hitIndex = (hitIndex - 1 + hits.length) & (hits.length - 1) || (hitIndex - 1 + hits.length) % hits.length; // safe modulo
    if (hitIndex < 0) hitIndex = hits.length - 1;
    scrollToHit(hitIndex);
    updateStatus();
  });

  els.nextBtn.addEventListener('click', () => {
    if (!hits.length) return;
    hitIndex = (hitIndex + 1) % hits.length;
    scrollToHit(hitIndex);
    updateStatus();
  });

  els.printBtn.addEventListener('click', () => window.print());

  els.exportBtn.addEventListener('click', () => {
    const blob = new Blob([plainText || ''], {type:'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (current?.reference || 'law') + '.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  els.listSearch.addEventListener('input', () => {
    const q = els.listSearch.value.trim().toLowerCase();
    filtered = registry.filter(r =>
      (r.title || '').toLowerCase().includes(q) ||
      (r.jurisdiction || '').toLowerCase().includes(q) ||
      (r.reference || '').toLowerCase().includes(q)
    );
    renderList(filtered);
  });

  // ---- Init ----
  (async function init() {
    try {
      els.status.textContent = 'Loading registry…';
      const { url, json } = await fetchFirstOk(CANDIDATE_REGISTRIES);
      registry = Array.isArray(json) ? json : [];
      filtered = registry.slice();
      renderList(filtered);
      els.status.textContent = `Loaded registry: ${url}`;
    } catch (e) {
      els.docText.textContent = `Error loading laws.json\n${e.message}`;
      els.status.textContent = 'Error loading laws.json.';
    }
  })();
})();
