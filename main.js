// LAWS UI — base-URL safe, list filter, in-text search, print/export.
// Flattens laws with "parts" so each Part shows in the left list.

const REGISTRY_PATHS = ['data/laws/laws.json','data/laws.json','laws.json'];

/* base url from this script */
function getBaseUrl() {
  const s = document.currentScript || Array.from(document.scripts).find(x => /main\.js/.test(x.src));
  const u = new URL(s.src, location.href);
  u.pathname = u.pathname.replace(/[^/]*main\.js.*$/, '');
  return u.toString();
}
const BASE = getBaseUrl();
const abs = (rel) => new URL(rel, BASE).toString();

const $ = (id)=>document.getElementById(id);
const els = {
  list: $('itemList'), listSearch: $('listSearch'),
  text: $('docText'), jur: $('jurisdiction'), ref: $('reference'), src: $('source'),
  status: $('status'), textSearch: $('textSearch'), prev: $('prevBtn'), next: $('nextBtn'),
  printBtn: $('printBtn'), exportBtn: $('exportBtn')
};

let ALL = [];      // flattened items: {title, jurisdiction, reference, reference_url}
let FILTERED = [];
let ACTIVE = -1;
let originalText = '';
let matches = [], mIdx = -1;

async function fetchText(url){ const r=await fetch(url,{cache:'no-store'}); const t=await r.text().catch(()=> ''); return {ok:r.ok,status:r.status,t,url:r.url}; }
async function loadJSON(paths){
  const errs=[];
  for(const p of paths){
    try{
      const {ok,status,t,url}=await fetchText(abs(p));
      if(!ok){errs.push(`${url} → ${status}`); continue;}
      if(/<!doctype html/i.test(t) && /404|not found/i.test(t)){errs.push(`${url} → 404 HTML`); continue;}
      try{ return {data: JSON.parse(t), used:url}; }catch(e){ errs.push(`${url} → JSON parse error: ${e.message}`); }
    }catch(e){ errs.push(`${p} → ${e.message}`); }
  }
  throw new Error(errs.join('\n'));
}
const esc = (s='') => s.replace(/[&<>'"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const nameSafe = (s) => (s||'law').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');

function flatten(reg){
  const arr = Array.isArray(reg) ? reg : (Array.isArray(reg?.laws) ? reg.laws : []);
  const out=[];
  arr.forEach(law=>{
    const common={lawTitle:law.title||'Untitled', jurisdiction:law.jurisdiction||'', reference:law.reference||''};
    if(Array.isArray(law.parts) && law.parts.length){
      law.parts.forEach(p=>{
        out.push({
          title: `${common.lawTitle} — ${p.title || 'Part'}`,
          jurisdiction: common.jurisdiction,
          reference: common.reference,
          reference_url: p.reference_url || p.file || ''
        });
      });
    }else{
      out.push({
        title: common.lawTitle,
        jurisdiction: common.jurisdiction,
        reference: common.reference,
        reference_url: law.reference_url || law.file || ''
      });
    }
  });
  return out;
}

function renderList(items, active=0){
  els.list.innerHTML='';
  items.forEach((it,i)=>{
    const li=document.createElement('li');
    const b=document.createElement('button');
    b.type='button'; b.className='rule-btn'+(i===active?' active':'');
    b.textContent=`${it.title} — ${it.jurisdiction}`;
    b.addEventListener('click',()=>select(i));
    li.appendChild(b); els.list.appendChild(li);
  });
}

async function select(i){
  ACTIVE=i;
  [...document.querySelectorAll('.rule-btn')].forEach((b,idx)=>b.classList.toggle('active', idx===i));
  const it = FILTERED[i]; if(!it) return;
  els.jur.textContent = it.jurisdiction || '—';
  els.ref.textContent = it.reference || '—';
  els.src.textContent = it.reference_url || '—';
  els.text.textContent='Loading…'; els.status.textContent='';

  try{
    const {ok,status,t,url}=await fetchText(abs(it.reference_url));
    if(!ok) throw new Error(`${url} → HTTP ${status}`);
    if(/<!doctype html/i.test(t) && /404|not found/i.test(t)) throw new Error(`${url} → 404 (not found)`);
    originalText=t||''; els.text.innerHTML=esc(originalText); clearMatches();
    els.status.textContent=`Loaded: ${url}`;
  }catch(e){
    els.text.textContent=`Failed to load.\n${e.message}`; els.status.textContent=''; clearMatches();
  }
}

/* list filter */
els.listSearch.addEventListener('input',()=>{
  const q=(els.listSearch.value||'').toLowerCase();
  FILTERED = !q ? [...ALL] :
    ALL.filter(x => [x.title,x.jurisdiction,x.reference].map(s=>(s||'').toLowerCase()).join(' ').includes(q));
  renderList(FILTERED,0);
  if(FILTERED.length) select(0); else { els.text.textContent='No matches.'; clearMatches(); els.jur.textContent='—'; els.ref.textContent='—'; els.src.textContent='—'; }
});

/* in-text search */
function clearMatches(){ matches=[]; mIdx=-1; }
function highlight(q){
  if(!q){ els.text.innerHTML=esc(originalText); clearMatches(); return; }
  const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\\]\\\\]/g,'\\$&')})`,'gi');
  els.text.innerHTML = esc(originalText).replace(re,'<mark>$1</mark>');
  matches = Array.from(els.text.querySelectorAll('mark'));
  mIdx = matches.length ? 0 : -1; if(mIdx>=0) matches[mIdx].scrollIntoView({behavior:'smooth',block:'center'});
}
els.textSearch.addEventListener('input',()=>highlight(els.textSearch.value));
els.prev.addEventListener('click',()=>{ if(!matches.length) return; mIdx=(mIdx-1+matches.length)%matches.length; matches[mIdx].scrollIntoView({behavior:'smooth',block:'center'}); });
els.next.addEventListener('click',()=>{ if(!matches.length) return; mIdx=(mIdx+1)%matches.length; matches[mIdx].scrollIntoView({behavior:'smooth',block:'center'}); });

/* actions */
els.printBtn.addEventListener('click',()=>window.print());
els.exportBtn.addEventListener('click',()=>{
  const it = FILTERED[ACTIVE]; if(!it) return;
  const blob = new Blob([originalText],{type:'text/plain'});
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), {href:url, download:`${nameSafe(it.reference||it.title)}.txt`});
  document.body.appendChild(a); a.click(); URL.revokeObjectURL(url); a.remove();
});

/* init */
document.addEventListener('DOMContentLoaded', async ()=>{
  try{
    const {data,used}=await loadJSON(REGISTRY_PATHS);
    ALL = flatten(data);
    FILTERED=[...ALL];
    renderList(FILTERED,0);
    if(FILTERED.length) await select(0);
    els.status.textContent=`Loaded registry: ${used}`;
  }catch(e){
    els.text.textContent=`Error loading laws.json\n${e.message}`;
  }
});
