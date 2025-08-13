/* laws-ui/main.js — full build
   - Registry fallbacks
   - Sticky toolbar; local scroll for matches
   - In-text search with highlight + Prev/Next
   - Gentle glyph normalization (visual only) on load
   - Print/Export
*/

(function () {
  // ---- Registry locations (first that works) ----
  const REGISTRY_CANDIDATES = [
    'laws.json',
    'data/laws.json',
    'data/laws/laws.json',
    'data/laws/jersey/laws.json'
  ];

  // ---- DOM ----
  const $ = (id) => document.getElementById(id);
  const els = {
    itemList: $('itemList') || $('itemlist'),  // accept either id
    listSearch: $('listSearch'),
    textSearch: $('textSearch'),
    prevBtn: $('prevBtn'),
    nextBtn: $('nextBtn'),
    docText: $('docText'),
    status: $('status'),
    jurisdiction: $('jurisdiction'),
    reference: $('reference'),
    source: $('source'),
    printBtn: $('printBtn'),
    exportBtn: $('exportBtn')
  };
  const missing = Object.entries(els).filter(([,n]) => !n).map(([k])=>k);
  if (missing.length) {
    throw new Error('Missing elements: ' + missing.join(', '));
  }

  // ---- State ----
  let registry = [];
  let current = null;
  let plainText = '';
  let hits = [];
  let hitIndex = -1;
  let lastQuery = '';

  // ---- Utils ----
  const escapeHTML = (s='') => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const debounce = (fn, ms) => { let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); }; };

  async function fetchFirstOk(urls) {
    let lastErr = '';
    for (const u of urls) {
      try {
        const r = await fetch(u, { cache: 'no-store' });
        if (!r.ok) { lastErr = `${u} → ${r.status}`; continue; }
        const json = await r.json();
        return { url: u, json };
      } catch (e) {
        lastErr = `${u} → ${e.message || e}`;
      }
    }
    throw new Error('Could not load registry. ' + lastErr);
  }

  function setStatus(msg){ els.status.textContent = msg || ''; }

  function renderList(list) {
    els.itemList.innerHTML = '';
    list.forEach((item, idx) => {
      const li = document.createElement('li');
      li.setAttribute('role','option');
      li.className = 'rule-list-item';
      li.innerHTML = `<div><strong>${escapeHTML(item.title || '')}</strong></div>
                      <div style="font-size:.85rem;color:#555">${escapeHTML(item.jurisdiction||'')}</div>`;
      li.addEventListener('click', () => selectItem(item, li));
      els.itemList.appendChild(li);
      if (idx === 0 && !current) selectItem(item, li);
    });
  }

  function markActive(liEl) {
    [...els.itemList.children].forEach(li => li.classList.remove('active'));
    if (liEl) liEl.classList.add('active');
  }

  function selectItem(item, liEl) {
    current = item;
    markActive(liEl);
    els.jurisdiction.textContent = item.jurisdiction || '—';
    els.reference.textContent = item.reference || '—';
    els.source.textContent = item.source || '—';
    loadTextFile(item.text_file);
  }

  // ---- Text loader (with gentle glyph normalization) ----
  async function loadTextFile(path) {
    resetSearchState();
    els.docText.textContent = 'Loading…';
    setStatus('Loading…');
    try {
      const r = await fetch(path, { cache: 'no-store' });
      if (!r.ok) throw new Error(`${path} → ${r.status}`);
      let txt = await r.text();

      // If HTML slipped through, stop.
      if (/<!doctype\s*html/i.test(txt) || /<html/i.test(txt)) {
        throw new Error(`${path} → looks like HTML (check "text_file" path).`);
      }

      // Gentle visual cleanup (does NOT mutate your file):
      // - odd boxes/special bullets -> standard bullet
      // - non-breaking spaces -> regular spaces
      txt = txt
        .replace(/\u0000/g, '')
        .replace(/[\u25A0\u25A1\u25CF\u25CB\uF0B7\u2022\uFFFD]/g, '•')
        .replace(/\u00A0/g, ' ');

      plainText = txt;
      els.docText.innerHTML = escapeHTML(plainText);
      setStatus(`Loaded: ${path}`);

      const q = els.textSearch.value.trim();
      if (q) highlightMatches(q);  // keep search active when switching laws
    } catch (e) {
      els.docText.textContent = `Error loading: ${path}\n${e.message || e}`;
      setStatus('Load error.');
    }
  }

  // ---- Search / highlight / navigation ----
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
      els.docText.innerHTML = escapeHTML(plainText || '');
      resetSearchState();
      setStatus('Cleared search.');
      return;
    }

    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    let i = 0;
    const html = (plainText || '').replace(rx, (m) => `<mark data-hit="${i++}">${escapeHTML(m)}</mark>`);
    els.docText.innerHTML = html;

    hits = [...els.docText.querySelectorAll('mark[data-hit]')];
    lastQuery = q;

    if (!hits.length) {
      setStatus(`No results for “${q}”.`);
      els.prevBtn.disabled = true;
      els.nextBtn.disabled = true;
      hitIndex = -1;
      return;
    }

    els.prevBtn.disabled = false;
    els.nextBtn.disabled = false;
    hitIndex = 0;
    scrollToHit(hitIndex);
    updateStatus();
  }

  // Scroll INSIDE the text panel (not the whole page), to center the hit
  function scrollToHit(i) {
    const el = hits[i];
    if (!el) return;
    const container = els.docText;
    const rect = el.getBoundingClientRect();
    const crect = container.getBoundingClientRect();
    const targetTop = (rect.top - crect.top) + container.scrollTop
                    - (container.clientHeight / 2) + (rect.height / 2);
    container.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });

    // visual focus
    hits.forEach(h => h.classList.remove('current'));
    el.classList.add('current');
  }

  function updateStatus() {
    if (hits.length) {
      els.status.textContent = `Matches: ${hits.length} — Viewing ${hitIndex + 1} of ${hits.length} — “${lastQuery}”`;
    } else {
      els.status.textContent = '';
    }
  }

  const onTextSearch = debounce(() => {
    highlightMatches(els.textSearch.value);
  }, 160);

  els.textSearch.addEventListener('input', onTextSearch);
  els.prevBtn.addEventListener('click', () => {
    if (!hits.length) return;
    hitIndex = (hitIndex - 1 + hits.length) % hits.length;
    scrollToHit(hitIndex);
    updateStatus();
  });
  els.nextBtn.addEventListener('click', () => {
    if (!hits.length) return;
    hitIndex = (hitIndex + 1) % hits.length;
    scrollToHit(hitIndex);
    updateStatus();
  });

  // ---- List filtering ----
  els.listSearch.addEventListener('input', () => {
    const q = els.listSearch.value.trim().toLowerCase();
    const filtered = registry.filter(r =>
      (r.title || '').toLowerCase().includes(q) ||
      (r.jurisdiction || '').toLowerCase().includes(q) ||
      (r.reference || '').toLowerCase().includes(q)
    );
    els.itemList.innerHTML = '';
    filtered.forEach((item) => {
      const li = document.createElement('li');
      li.className = 'rule-list-item';
      li.innerHTML = `<div><strong>${escapeHTML(item.title || '')}</strong></div>
                      <div style="font-size:.85rem;color:#555">${escapeHTML(item.jurisdiction||'')}</div>`;
      li.addEventListener('click', () => selectItem(item, li));
      els.itemList.appendChild(li);
    });
  });

  // ---- Actions ----
  els.printBtn.addEventListener('click', () => window.print());
  els.exportBtn.addEventListener('click', () => {
    const name = (current?.reference || current?.title || 'law')
      .toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
    const blob = new Blob([plainText || ''], { type:'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href:url, download:`${name}.txt` });
    document.body.appendChild(a); a.click(); URL.revokeObjectURL(url); a.remove();
  });

  // ---- Init ----
  (async function init() {
    try {
      setStatus('Loading registry…');
      const { url, json } = await fetchFirstOk(REGISTRY_CANDIDATES);
      registry = Array.isArray(json) ? json : [];
      renderList(registry);
      setStatus(`Loaded registry: ${url}`);
    } catch (e) {
      els.docText.textContent = `Error loading registry\n${e.message || e}`;
      setStatus('Error loading registry.');
    }
  })();
})();
