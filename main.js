// laws-ui/main.js
// Works with:
//   - Registry at:  laws.json   (root of repo)
//   - Each entry has: { title, jurisdiction, reference, source, text_file }
//
// No writes. Reads TXT files only. Highlights search terms inside <pre>.

(() => {
  // ---------- CONFIG ----------
  const LAWS_REGISTRY_URL = 'laws.json';

  // ---------- DOM ----------
  const els = {
    listSearch:   document.getElementById('listSearch'),
    itemList:     document.getElementById('itemlist'),
    textSearch:   document.getElementById('textSearch'),
    prevBtn:      document.getElementById('prevBtn'),
    nextBtn:      document.getElementById('nextBtn'),
    jurisdiction: document.getElementById('jurisdiction'),
    reference:    document.getElementById('reference'),
    source:       document.getElementById('source'),
    docText:      document.getElementById('docText'),
    status:       document.getElementById('status'),
    printBtn:     document.getElementById('printBtn'),
    exportBtn:    document.getElementById('exportBtn')
  };

  // ---------- STATE ----------
  let registry = [];              // loaded laws.json
  let current = null;             // current law object
  let rawText = '';               // current raw text
  let matches = [];               // [{start, end}]
  let curIdx = -1;                // index into matches

  // ---------- UTIL ----------
  const setStatus  = (msg) => (els.status.textContent = msg || '');
  const escapeHtml = (s) => s
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');

  function clearMeta() {
    els.jurisdiction.textContent = '—';
    els.reference.textContent    = '—';
    els.source.textContent       = '—';
  }

  function setMeta(it) {
    els.jurisdiction.textContent = it?.jurisdiction || '—';
    els.reference.textContent    = it?.reference    || '—';
    els.source.textContent       = (it?.source || '—');
  }

  function setDocText(s) {
    // Render plain text (no highlights). We use innerHTML with escaped content
    // so later we can inject <mark> for highlights without re-wrapping <pre>.
    els.docText.innerHTML = escapeHtml(s || '');
  }

  function showErrorPanel(title, detail) {
    setDocText(`${title}\n${detail || ''}`.trim());
  }

  // Build highlighted HTML from rawText + matches; focus current match.
  function renderHighlights() {
    if (!rawText || matches.length === 0) {
      setDocText(rawText);
      return;
    }
    let out = '';
    let pos = 0;
    for (let i = 0; i < matches.length; i++) {
      const m = matches[i];
      if (m.start < pos) continue; // safety
      out += escapeHtml(rawText.slice(pos, m.start));
      const inner = escapeHtml(rawText.slice(m.start, m.end));
      const cls = (i === curIdx) ? 'current' : '';
      out += `<mark class="${cls}">${inner}</mark>`;
      pos = m.end;
    }
    out += escapeHtml(rawText.slice(pos));
    els.docText.innerHTML = out;

    // Scroll the current mark into view if we have one
    if (curIdx >= 0) {
      const marks = els.docText.querySelectorAll('mark');
      const node = marks[curIdx];
      if (node) node.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }

  // Compute match ranges for query (case-insensitive).
  function computeMatches(q) {
    matches = [];
    curIdx = -1;
    if (!q || !rawText) return;

    // Escape regex special chars in q
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(safe, 'gi');
    let m;
    while ((m = re.exec(rawText)) !== null) {
      matches.push({ start: m.index, end: m.index + m[0].length });
      // Avoid infinite loops on zero-length matches (shouldn't happen here)
      if (m.index === re.lastIndex) re.lastIndex++;
    }
    if (matches.length) curIdx = 0;
  }

  function onSearchChange() {
    const q = els.textSearch.value.trim();
    computeMatches(q);
    renderHighlights();
    updateNavButtons();
    setStatus(q ? `Found ${matches.length} match${matches.length===1?'':'es'}.` : '');
  }

  function updateNavButtons() {
    const has = matches.length > 0;
    els.prevBtn.disabled = !has;
    els.nextBtn.disabled = !has;
  }

  function goto(delta) {
    if (!matches.length) return;
    curIdx = (curIdx + delta + matches.length) % matches.length;
    renderHighlights();
  }

  // ---------- LIST ----------
  function buildList(items) {
    els.itemList.innerHTML = '';
    items.forEach((it, idx) => {
      const li = document.createElement('li');
      li.className = 'rule-list-item';
      li.tabIndex = 0;
      li.dataset.idx = String(idx);
      li.textContent = it.title || '(untitled)';
      li.addEventListener('click', () => select(idx));
      li.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(idx); }
      });
      els.itemList.appendChild(li);
    });
  }

  function filterList(term) {
    const q = (term || '').toLowerCase();
    const lis = els.itemList.querySelectorAll('li');
    lis.forEach(li => {
      const idx = Number(li.dataset.idx);
      const it = registry[idx];
      const hay =
        `${it.title || ''} ${it.jurisdiction || ''} ${it.reference || ''}`.toLowerCase();
      li.style.display = (!q || hay.includes(q)) ? '' : 'none';
    });
  }

  function markActiveInList(idx) {
    const lis = els.itemList.querySelectorAll('li');
    lis.forEach(li => li.classList.remove('active'));
    const target = [...lis].find(li => Number(li.dataset.idx) === idx);
    if (target) {
      target.classList.add('active');
      target.scrollIntoView({ block: 'nearest' });
    }
  }

  // ---------- LOADERS ----------
  async function loadRegistry() {
    setStatus(`Loading registry: ${location.origin}${location.pathname.replace(/\/$/, '')}/${LAWS_REGISTRY_URL}`);
    const res = await fetch(LAWS_REGISTRY_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error(`${LAWS_REGISTRY_URL} → ${res.status}`);
    let data;
    try {
      data = await res.json();
    } catch (e) {
      throw new Error(`JSON parse error for ${LAWS_REGISTRY_URL}: ${e.message}`);
    }
    if (!Array.isArray(data)) throw new Error('laws.json must be an array');
    registry = data;
    setStatus('');
  }

  async function loadLawText(item) {
    const url = item?.text_file;
    if (!url || !url.trim()) {
      throw new Error('Missing "text_file" for the selected entry.');
    }
    setStatus(`Loading: ${url}`);
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`${url} → ${res.status}`);
    const txt = await res.text();

    // Guard: if path is wrong and returns an HTML page, warn instead of dumping HTML
    if (/<!doctype\s+html/i.test(txt) || /<html/i.test(txt)) {
      throw new Error(`${url} → looks like HTML (check path/filename).`);
    }
    return txt;
  }

  // ---------- SELECTION ----------
  async function select(idx) {
    try {
      const it = registry[idx];
      if (!it) return;

      // Update sidebar selection and meta
      markActiveInList(idx);
      current = it;
      setMeta(it);
      setDocText('Loading…');
      setStatus('');

      rawText = await loadLawText(it);
      setDocText(rawText);

      // Reset search state
      els.textSearch.value = '';
      matches = [];
      curIdx = -1;
      updateNavButtons();
      setStatus(`Loaded: ${it.text_file}`);
    } catch (e) {
      clearMeta();
      rawText = '';
      matches = [];
      curIdx = -1;
      updateNavButtons();
      showErrorPanel('Error loading law:', e.message || String(e));
      setStatus('');
      console.error(e);
    }
  }

  // ---------- ACTIONS ----------
  function doPrint() {
    window.print();
  }

  function doExport() {
    try {
      const title = (current?.title || 'law').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
      const blob = new Blob([rawText || ''], { type: 'text/plain;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${title || 'document'}.txt`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(a.href);
        a.remove();
      }, 0);
    } catch (e) {
      setStatus(`Export failed: ${e.message || e}`);
    }
  }

  // ---------- INIT ----------
  async function init() {
    // Wire events
    els.listSearch?.addEventListener('input', () => filterList(els.listSearch.value));
    els.textSearch?.addEventListener('input', onSearchChange);
    els.prevBtn?.addEventListener('click', () => goto(-1));
    els.nextBtn?.addEventListener('click', () => goto(+1));
    els.printBtn?.addEventListener('click', doPrint);
    els.exportBtn?.addEventListener('click', doExport);

    // Load registry and build list
    try {
      await loadRegistry();
      buildList(registry);
      filterList(''); // ensure all visible
      // Auto-select first visible item
      const first = els.itemList.querySelector('li[style=""] , li:not([style])') || els.itemList.querySelector('li');
      if (first) select(Number(first.dataset.idx));
      else {
        setDocText('No laws found in registry.');
      }
    } catch (e) {
      showErrorPanel('Error loading laws.json', `${LAWS_REGISTRY_URL} → ${e.message || e}`);
      console.error(e);
    }
  }

  // Kick off
  document.addEventListener('DOMContentLoaded', init);
})();
