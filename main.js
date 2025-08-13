// laws-ui/main.js (full build)
// Robust loader with defensive DOM binding, multi-location registry fallback,
// left list + filter, in-text search with highlight and prev/next,
// print & export, friendly errors.

// ---------- CONFIG ----------
const REGISTRY_CANDIDATES = [
  'laws.json',
  'data/laws.json',
  'data/laws/laws.json',
  'data/laws/jersey/laws.json'
];

// ---------- STATE ----------
let els = {};
let registry = [];
let current = null;
let rawText = '';
let matches = [];
let curIdx = -1;

// ---------- DOM BIND / UTIL ----------
function bindEls() {
  const $ = (s) => document.querySelector(s);
  els = {
    listSearch: $('#listSearch'),
    itemList:   $('#itemlist') || $('#ruleList'),
    textSearch: $('#textSearch'),
    prevBtn:    $('#prevBtn'),
    nextBtn:    $('#nextBtn'),
    jurisdiction: $('#jurisdiction'),
    reference:  $('#reference'),
    source:     $('#source'),
    docText:    $('#docText'),
    status:     $('#status'),
    printBtn:   $('#printBtn'),
    exportBtn:  $('#exportBtn'),
  };
  const missing = Object.entries(els).filter(([,n]) => !n).map(([k])=>k);
  if (missing.length){
    throw new Error(`Missing DOM nodes: ${missing.join(', ')}. Ensure ids are present.`);
  }
}

const setStatus = (m) => { els.status.textContent = m || ''; };
const esc = (s) => s
  .replace(/&/g,'&amp;').replace(/</g,'&lt;')
  .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');

function setMeta(it){
  els.jurisdiction.textContent = it?.jurisdiction || '—';
  els.reference.textContent = it?.reference || '—';
  els.source.textContent = it?.source || '—';
}
function setDocText(txt){ els.docText.innerHTML = esc(txt || ''); }
function showError(title, detail){ setDocText(`${title}\n${detail||''}`.trim()); }

// ---------- SEARCH / HIGHLIGHT ----------
function computeMatches(q){
  matches = []; curIdx = -1;
  if (!q || !rawText) return;
  const safe = q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const re = new RegExp(safe,'gi');
  let m;
  while ((m = re.exec(rawText)) !== null){
    matches.push({ start:m.index, end:m.index + m[0].length });
    if (m.index === re.lastIndex) re.lastIndex++;
  }
  if (matches.length) curIdx = 0;
}
function renderHighlights(){
  if (!rawText || matches.length === 0){ setDocText(rawText); return; }
  let out='', pos=0;
  for (let i=0;i<matches.length;i++){
    const {start,end} = matches[i];
    if (start < pos) continue;
    out += esc(rawText.slice(pos,start));
    out += `<mark class="${i===curIdx?'current':''}">${esc(rawText.slice(start,end))}</mark>`;
    pos = end;
  }
  out += esc(rawText.slice(pos));
  els.docText.innerHTML = out;
  if (curIdx >= 0){
    const marks = els.docText.querySelectorAll('mark');
    const node = marks[curIdx];
    if (node) node.scrollIntoView({behavior:'smooth', block:'center'});
  }
}
function updateNavButtons(){
  const on = matches.length > 0;
  els.prevBtn.disabled = !on;
  els.nextBtn.disabled = !on;
}
function onTextSearch(){
  const q = els.textSearch.value.trim();
  computeMatches(q);
  renderHighlights();
  updateNavButtons();
  setStatus(q ? `Found ${matches.length} match${matches.length===1?'':'es'}.` : '');
}
function goto(delta){
  if (!matches.length) return;
  curIdx = (curIdx + delta + matches.length) % matches.length;
  renderHighlights();
}

// ---------- LIST ----------
function buildList(items){
  els.itemList.innerHTML = '';
  items.forEach((it, idx)=>{
    const li = document.createElement('li');
    li.className = 'rule-list-item';
    li.tabIndex = 0;
    li.dataset.idx = String(idx);
    li.textContent = it.title || '(untitled)';
    li.addEventListener('click', ()=> select(idx));
    li.addEventListener('keydown', (e)=>{
      if (e.key==='Enter' || e.key===' '){ e.preventDefault(); select(idx); }
    });
    els.itemList.appendChild(li);
  });
}
function filterList(term){
  const q = (term||'').toLowerCase();
  els.itemList.querySelectorAll('li').forEach(li=>{
    const it = registry[Number(li.dataset.idx)];
    const hay = `${it.title||''} ${it.jurisdiction||''} ${it.reference||''}`.toLowerCase();
    li.style.display = (!q || hay.includes(q)) ? '' : 'none';
  });
}
function markActive(idx){
  els.itemList.querySelectorAll('li').forEach(li=>li.classList.remove('active'));
  const target = [...els.itemList.querySelectorAll('li')].find(li=>Number(li.dataset.idx)===idx);
  if (target){ target.classList.add('active'); target.scrollIntoView({block:'nearest'}); }
}

// ---------- LOADERS ----------
async function fetchFirstOk(urls){
  let last;
  for (const u of urls){
    try{
      setStatus(`Loading registry: ${u}`);
      const r = await fetch(u, {cache:'no-store'});
      if (!r.ok) throw new Error(r.status);
      return await r.json();
    }catch(e){ last = `${u} → ${e.message||e}`; }
  }
  throw new Error(`All registry paths failed. Last: ${last}`);
}
async function loadRegistry(){
  const data = await fetchFirstOk(REGISTRY_CANDIDATES);
  if (!Array.isArray(data)) throw new Error('laws.json must be a JSON array.');
  registry = data;
  setStatus('');
}

async function fetchText(url){
  setStatus(`Loading: ${url}`);
  const r = await fetch(url, {cache:'no-store'});
  if (!r.ok) throw new Error(`${r.status}`);
  const txt = await r.text();
  if (/<!doctype\s+html/i.test(txt) || /<html/i.test(txt)){
    throw new Error('Received HTML instead of plain text. Check "text_file" path.');
  }
  return txt;
}

// ---------- SELECTION ----------
async function select(idx){
  try{
    const it = registry[idx]; if (!it) return;
    markActive(idx);
    current = it;
    setMeta(it);
    setDocText('Loading…');
    matches = []; curIdx = -1; updateNavButtons();

    if (!it.text_file) throw new Error('Entry missing "text_file".');
    rawText = await fetchText(it.text_file);
    setDocText(rawText);
    setStatus(`Loaded: ${it.text_file}`);
  }catch(e){
    rawText=''; matches=[]; curIdx=-1; updateNavButtons();
    showError('Error loading law:', e.message||String(e));
    setStatus('');
    console.error(e);
  }
}

// ---------- ACTIONS ----------
function doPrint(){ window.print(); }
function doExport(){
  try{
    const base = (current?.title||'law').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
    const blob = new Blob([rawText||''], {type:'text/plain;charset=utf-8'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${base||'document'}.txt`;
    document.body.appendChild(a); a.click();
    setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },0);
  }catch(e){ setStatus(`Export failed: ${e.message||e}`); }
}

// ---------- INIT ----------
async function init(){
  try{
    bindEls();

    // events
    els.listSearch.addEventListener('input', ()=> filterList(els.listSearch.value));
    els.textSearch.addEventListener('input', onTextSearch);
    els.prevBtn.addEventListener('click', ()=> goto(-1));
    els.nextBtn.addEventListener('click', ()=> goto(+1));
    els.printBtn.addEventListener('click', doPrint);
    els.exportBtn.addEventListener('click', doExport);

    await loadRegistry();
    buildList(registry);
    filterList('');

    const first = [...els.itemList.querySelectorAll('li')]
      .find(li => li.style.display !== 'none');
    if (first) select(Number(first.dataset.idx));
    else setDocText('No entries in registry.');
  }catch(e){
    showError('Error loading laws.json', e.message||String(e));
    console.error(e);
  }
}

document.addEventListener('DOMContentLoaded', init);
