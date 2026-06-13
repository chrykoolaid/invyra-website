
const yearEl=document.getElementById('year');if(yearEl)yearEl.textContent=new Date().getFullYear();
const toggle=document.querySelector('.menu-toggle');const menu=document.getElementById('site-menu');if(toggle&&menu){toggle.addEventListener('click',()=>{const open=menu.classList.toggle('open');toggle.setAttribute('aria-expanded',open?'true':'false');});}
const form=document.getElementById('leadForm');const hint=document.getElementById('formHint');if(form){form.addEventListener('submit',e=>{e.preventDefault();const data=new FormData(form);const name=(data.get('name')||'').toString().trim();if(hint){hint.textContent=`Thanks ${name||'there'} — this Wave 1 site is static, so this is a local confirmation only until a future contact integration is approved.`;}form.reset();});}
const search=document.getElementById('roadmapSearch');const cat=document.getElementById('categoryFilter');const stat=document.getElementById('statusFilter');const roadmapCards=[...document.querySelectorAll('.roadmap-card')];function filterRoadmap(){const q=(search?.value||'').toLowerCase();const c=cat?.value||'all';const s=stat?.value||'all';roadmapCards.forEach(card=>{const text=card.innerText.toLowerCase();const okQ=!q||text.includes(q);const okC=c==='all'||card.dataset.category===c;const okS=s==='all'||card.dataset.status===s;card.classList.toggle('hidden',!(okQ&&okC&&okS));});} [search,cat,stat].forEach(el=>el&&el.addEventListener('input',filterRoadmap));


// Wave 4 static form confirmations and visual-only search filtering
const staticForms=[...document.querySelectorAll('.static-form')];
staticForms.forEach(form=>{form.addEventListener('submit',e=>{e.preventDefault();const hint=form.querySelector('.form-hint');const name=(new FormData(form).get('name')||'').toString().trim();if(hint){hint.textContent=(form.dataset.confirm||'Static preview only. No backend submission is connected.')+(name?` Thank you, ${name}.`:'' )}form.reset();});});
const successSearch=document.querySelector('[data-success-search]');
if(successSearch){const successCards=[...document.querySelectorAll('.success-search-card')];successSearch.addEventListener('input',()=>{const q=successSearch.value.toLowerCase().trim();successCards.forEach(card=>{const text=(card.dataset.successText||card.innerText).toLowerCase();card.classList.toggle('hidden-by-search',!!q&&!text.includes(q));});});}
