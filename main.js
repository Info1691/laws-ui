// laws-ui/main.js
// Full build: robust loader, list + filter, in-text search with highlights,
// prev/next navigation, print/export, defensive error handling, and
// tolerant DOM id lookups to avoid regressions.

// ---------------- CONFIG ----------------
const REGISTRY_CANDIDATES = ['laws.json', 'data/laws.json']; // try root first
const REGISTRY_MUST_BE_ARRAY = true; // sanity guard

// ---------------- DOM (tolerant selectors) ----------------
const $ = (sel) => document.querySelector(sel);
const els = {
  // left list/filter
  listSearch: $('#listSearch'),
  itemList: $('#itemlist') || $('#ruleList'), // accept either id

  // top text search + nav
  textSearch: $('#textSearch'),
  prevBtn: $('#prevBtn'),
  nextBtn: $('#nextBtn'),

  // meta
  jurisdiction: $('#jurisdiction'),
  reference: $('#reference'),
  source: $('#source'),

  // viewer + status + actions
  docText: $('#docText'),
  status: $('#status'),
  printBtn: $('#printBtn'),
  exportBtn: $('#exportBtn')
};

function assertDom() {
  const missing = Object.entries(els)
    .filter(([, node]) => !node)
    .map(([k]) => k);
  if (missing.length) {
    throw new Error(
      `Missing required DOM nodes: ${missing.join(', ')}. ` +
      `Ensure your index.html has ids: listSearch, (itemlist or ruleList), textSearch, prevBtn, nextBtn, jurisdiction, reference, source, docText, status, printBtn, exportBtn.`
    );
  }
}
assertDom();

// ---------------- STATE ----------------
let registry = [];    // array of law entries
let current = null;   // current selected entry
let rawText = '';     // loaded text
let matches = [];     // [{start,end}]
let curIdx = -1;      // pointer into matches

// ---------------- UTIL ----------------
const setStatus = (msg) => { els.status.textContent = msg || ''; };
const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
   .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
   .replace(/'/g, '&#39;');

function clearMeta() {
  els.jurisdiction.textContent = '—';
  els.reference.textContent = '—';
  els.source.textContent = '—';
}
function setMeta(it) {
  els.jurisdiction.textContent = it?.jurisdiction || '—';
  els.reference.textContent = it?.reference || '—';
  els.source.textContent = it?.source || '—';
}
function setDocText(txt) {
  // We render as HTML (escaped) so we can inject <mark> nodes for highlights.
  els.docText.innerHTML = esc(txt || '');
}
function showError(title, detail) {
  setDocText(`${title}\n${detail || ''}`.trim());
}

// ---------------- HIGHLIGHT / SEARCH ----------------
function computeMatches(q) {
  matches = [];
  curIdx = -1;
  if (!q || !rawText) return;
  const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(safe, 'gi');
  let m;
  while ((m = re.exec(rawText)) !== null) {
    matches.push({ start: m.index, end: m.index + m[0].length });
    if (m.index === re.lastIndex) re.lastIndex++; // safety
  }
  if (matches.length) curIdx = 0;
}

function renderHighlights() {
  if (!rawText || matches.length === 0) {
    setDocText(rawText);
    return;
  }
  let out = '';
  let pos = 0;
  for (let i = 0; i < matches.length; i++) {
    const { start, end } = matches[i];
    if (start < pos) continue;
    out += esc(rawText.slice(pos, start));
    const inner = esc(rawText.slice(start, end));
    out += `<mark class="${i === curIdx ? 'current' : ''}">${inner}</mark>`;
    pos = end;
  }
  out += esc(rawText.slice(pos));
  els.docText.innerHTML = out;

  // Bring the current match into view
  if (curIdx >= 0) {
    const marks = els.docText.querySelectorAll('mark');
    const node = marks[curIdx];
    if (node) node.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function updateNavButtons() {
  const on = matches.length > 0;
  els.prevBtn.disabled = !on;
  els.nextBtn.disabled = !on;
}

function onTextSearch() {
  const q = els.textSearch.value.trim();
  computeMatches(q);
  renderHighlights();
  updateNavButtons();
  setStatus(q ? `Found ${matches.length} match${matches.length === 1 ? '' : 'es'}.` : '');
}

function goto(delta) {
  if (!matches.length) return;
  curIdx = (curIdx + delta + matches.length) % matches.length;
  renderHighlights();
}

// ---------------- LIST ----------------
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
    const hay = `${it.title || ''} ${it.jurisdiction || ''} ${it.reference || ''}`.toLowerCase();
    li.style.display = (!q || hay.includes(q)) ? '' : 'none';
  });
}

function markActive(idx) {
  const lis = els.itemList.querySelectorAll('li');
  lis.forEach(li => li.classList.remove('active'));
  const target = [...lis].find(li => Number(li.dataset.idx) === idx);
  if (target) {
    target.classList.add('active');
    target.scrollIntoView({ block: 'nearest' });
  }
}

// ---------------- LOADERS ----------------
async function fetchFirstOk(urls) {
  let lastErr;
  for (const u of urls) {
    try {
      setStatus(`Loading registry: ${u}`);
      const res = await fetch(u, { cache: 'no-store' });
      if (!res.ok) throw new Error(`${res.status}`);
      return await res.json();
    } catch (e) {
      lastErr = `${u} → ${e.message || e}`;
    }
  }
  throw new Error(`All candidates failed. Last: ${lastErr}`);
}

async function loadRegistry() {
  const data = await fetchFirstOk(REGISTRY_CANDIDATES);
  if (REGISTRY_MUST_BE_ARRAY && !Array.isArray(data)) {
    throw new Error('laws.json must be a JSON array.');
  }
  registry = data;
  setStatus('');
}

async function fetchText(url) {
  setStatus(`Loading: ${url}`);
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  const txt = await res.text();
  // Guard against wrong path returning HTML
  if (/<!doctype\s+html/i.test(txt) || /<html/i.test(txt)) {
    throw new Error(`${url} → looks like HTML (check path/filename).`);
  }
  return txt;
}

// ---------------- SELECTION ----------------
async function select(idx) {
  try {
    const it = registry[idx];
    if (!it) return;

    markActive(idx);
    current = it;
    setMeta(it);
    setDocText('Loading…');
    matches = [];
    curIdx = -1;
    updateNavButtons();

    const url = it.text_file;
    if (!url) throw new Error('Missing "text_file" for this entry.');

    rawText = await fetchText(url);
    setDocText(rawText);
    setStatus(`Loaded: ${url}`);
  } catch (e) {
    clearMeta();
    rawText = '';
    matches = [];
    curIdx = -1;
    updateNavButtons();
    showError('Error loading law:', e.message || String(e));
    setStatus('');
    console.error(e);
  }
}

// ---------------- ACTIONS ----------------
function doPrint() {
  window.print();
}
function doExport() {
  try {
    const base = (current?.title || 'law').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const blob = new Blob([rawText || ''], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${base || 'document'}.txt`;
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

// ---------------- INIT ----------------
async function init() {
  // Wire events
  els.listSearch.addEventListener('input', () => filterList(els.listSearch.value));
  els.textSearch.addEventListener('input', onTextSearch);
  els.prevBtn.addEventListener('click', () => goto(-1));
  els.nextBtn.addEventListener('click', () => goto(+1));
  els.printBtn.addEventListener('click', doPrint);
  els.exportBtn.addEventListener('click', doExport);

  // Load registry → build list → select first visible
  try {
    await loadRegistry();
    buildList(registry);
    filterList('');
    const firstVisible =
      [...els.itemList.querySelectorAll('li')].find(li => li.style.display !== 'none');
    if (firstVisible) {
      select(Number(firstVisible.dataset.idx));
    } else {
      setDocText('No entries in registry.');
    }
  } catch (e) {
    showError('Error loading laws.json', e.message || String(e));
    console.error(e);
  }
}

document.addEventListener('DOMContentLoaded', init);
