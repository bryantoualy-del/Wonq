
(()=>{
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Math.random().toString(36).slice(2,10)+Date.now().toString(36);
const categories=[
 {id:'quest',name:'Quêtes',color:'#66b9b5'},
 {id:'people',name:'Personnages',color:'#b39bea'},
 {id:'places',name:'Lieux',color:'#d4bb88'},
 {id:'clues',name:'Indices',color:'#7eafcc'},
 {id:'memory',name:'Souvenirs',color:'#d59e91'}
];
const skills=[
 ['Athlétisme','FOR',0],['Acrobaties','DEX',3],['Discrétion','DEX',3],['Escamotage','DEX',3],
 ['Arcanes','INT',3],['Histoire','INT',6],['Investigation','INT',1],['Nature','INT',1],['Religion','INT',1],
 ['Dressage','SAG',2],['Intuition','SAG',7],['Médecine','SAG',2],['Perception','SAG',4],['Survie','SAG',2],
 ['Intimidation','CHA',6],['Persuasion','CHA',8],['Représentation','CHA',6],['Tromperie','CHA',6]
];
const inventory=[
 ['La Longue Mémoire',1,'Porté','Très rare','pipe',1],['Bâton du Vagabond Gris',1,'Porté','Rare','staff',1],['Registre des Absents',1,'Porté','Peu commun','register',1],['Sac sans fond',1,'Porté','Peu commun','bag',1],['Tige inamovible',1,'Porté','Peu commun','rod',1],['Armure de cuir',1,'Porté','Ordinaire'],['Dague',1,'Porté','Ordinaire','combat'],
 ['Corde de soie · 15 m',1,'Sac sans fond','Ordinaire'],['Pitons',10,'Sac sans fond','Ordinaire'],['Marteau',1,'Sac sans fond','Ordinaire'],['Pied-de-biche',1,'Sac sans fond','Ordinaire'],['Rations',3,'Sac sans fond','Ordinaire'],['Outre',1,'Sac sans fond','Ordinaire'],['Couverture',1,'Sac sans fond','Ordinaire'],['Lanterne sourde',1,'Sac sans fond','Ordinaire','lantern'],['Fioles d’huile',4,'Sac sans fond','Ordinaire'],['Craie',1,'Sac sans fond','Ordinaire'],['Ficelle',1,'Sac sans fond','Ordinaire'],['Miroir d’acier',1,'Sac sans fond','Ordinaire'],
 ['Plume, encre et papier',1,'Sac sans fond','Ordinaire','journal'],['Flûte',1,'Porté','Ordinaire','inspiration'],['Boîtes de tabac',3,'Sac sans fond','Ordinaire','reaction']
].map((x,i)=>({id:'wonq-item-'+i,name:x[0],qty:x[1],container:x[2],rarity:x[3],icon:x[4]||'',featured:!!x[5]}));
let socialTab='skills',journalTab='notes',noteFilter='',noteSearch='',socialSearch='';

function ensureState(){
 if(!Array.isArray(S.personalNotes))S.personalNotes=[];
 if(!Array.isArray(S.noteCategories))S.noteCategories=clone(categories);
 if(!Array.isArray(S.absentRegister))S.absentRegister=[];
 if(!Array.isArray(S.socialInventory))S.socialInventory=clone(inventory);
 else{
  const canonical=new Map(inventory.map(i=>[i.name,i]));
  S.socialInventory.forEach(i=>Object.assign(i,{icon:canonical.get(i.name)?.icon||'',featured:!!canonical.get(i.name)?.featured}));
  inventory.forEach(i=>{if(!S.socialInventory.some(x=>x.name===i.name))S.socialInventory.push(clone(i))});
 }
}
function signed(n){return n>=0?'+'+n:String(n)}
function roll20(){const a=die(20),b=die(20);return rollMode==='adv'?{n:Math.max(a,b),detail:`${a}, ${b} → meilleur`}:rollMode==='dis'?{n:Math.min(a,b),detail:`${a}, ${b} → moins bon`}:{n:a,detail:String(a)}}

function installShell(){
 if(!$('#social')){const section=document.createElement('section');section.className='view';section.id='social';section.innerHTML='<div class="grid"><article class="panel full"><div class="eyebrow">Une halte sur le chemin</div><h2>Rencontres & souvenirs</h2><div id="socialMount"></div></article></div>';$('#journal').before(section)}
 if(!$('.nav [data-view="social"]')){const b=document.createElement('button');b.dataset.view='social';b.textContent='Social';const journalButton=$('.nav [data-view="journal"]');$('.nav').insertBefore(b,journalButton);b.onclick=()=>{$$('.nav button').forEach(x=>x.classList.toggle('active',x===b));$$('.view').forEach(v=>v.classList.toggle('active',v.id==='social'));renderSocial();scrollTo({top:0,behavior:'smooth'})}}
 if(!$('#wonqEditor')){const d=document.createElement('dialog');d.id='wonqEditor';d.className='wonq-editor';d.innerHTML='<form method="dialog"><div class="journal-head"><h2 id="editorTitle"></h2><button value="cancel" class="ability">Fermer</button></div><div id="editorBody"></div></form>';document.body.appendChild(d)}
}
function tabs(active,items,kind){return `<div class="social-tabs">${items.map(([id,label])=>`<button class="ability ${active===id?'on':''}" data-${kind}="${id}">${label}</button>`).join('')}</div>`}

function renderSocial(){
 const root=$('#socialMount');if(!root)return;
 const head=tabs(socialTab,[['skills','Compétences'],['inventory','Inventaire'],['register','Registre des Absents']],'social-tab');
 if(socialTab==='skills')root.innerHTML=head+`<div class="options"><button class="toggle social-mode ${rollMode==='normal'?'on':''}" data-mode="normal">Normal</button><button class="toggle social-mode ${rollMode==='adv'?'on':''}" data-mode="adv">Avantage</button><button class="toggle social-mode ${rollMode==='dis'?'on':''}" data-mode="dis">Désavantage</button></div><div class="social-skills">${skills.map((s,i)=>`<button class="social-skill" data-skill="${i}"><span><b>${s[0]}</b><small>${s[1]}</small></span><strong>${signed(s[2])}</strong></button>`).join('')}</div><div class="social-passives"><span>Perception passive <b>14</b></span><span>Intuition passive <b>17</b></span><span>Investigation passive <b>11</b></span></div><p class="meta">Langues : commun, elfique, géant, céleste · Instruments : flûte, flûte de pan, cor.</p>`;
 else if(socialTab==='inventory'){const items=S.socialInventory.filter(i=>i.name.toLowerCase().includes(socialSearch.toLowerCase())).sort((a,b)=>(b.featured-a.featured)||!!b.icon-!!a.icon);root.innerHTML=head+`<input id="socialSearch" class="number" type="search" placeholder="Rechercher dans le sac…" value="${esc(socialSearch)}"><div class="inventory-grid">${items.map(i=>`<article class="inventory-card ${i.icon?'illustrated':''} ${i.featured?'signature-item':''}">${i.icon?`<div class="inventory-visual"><img src="assets/inventory/${esc(i.icon)}.png" alt="" loading="lazy">${i.featured?'<span>Objet signature</span>':''}</div>`:''}<div class="inventory-copy"><b>${esc(i.name)}</b><small>${esc(i.rarity)} · ${esc(i.container)}</small></div><strong class="item-qty">×${i.qty}</strong></article>`).join('')}</div>`}
 else root.innerHTML=head+`<button class="primary teal" id="addAbsent">Ajouter une personne au registre</button><div class="register-grid">${S.absentRegister.map(x=>`<article class="register-card" data-register="${x.id}"><div class="resource-head"><b>${esc(x.name||'Sans nom')}</b><span class="badge">${esc(x.status)}</span></div><p>${esc(x.description||'Aucun souvenir consigné.')}</p><div class="row"><button class="ability" data-edit-register="${x.id}">Modifier</button><button class="ability" data-delete-register="${x.id}">Retirer</button></div></article>`).join('')||'<div class="empty">Le Registre attend le nom du prochain absent.</div>'}</div>`;
 root.querySelectorAll('[data-social-tab]').forEach(b=>b.onclick=()=>{socialTab=b.dataset.socialTab;renderSocial()});
 root.querySelectorAll('.social-mode').forEach(b=>b.onclick=()=>{rollMode=b.dataset.mode;renderSocial()});
 root.querySelectorAll('[data-skill]').forEach(b=>b.onclick=()=>{const s=skills[+b.dataset.skill],r=roll20(),total=r.n+s[2];record(`Test · ${s[0]}`,`d20 ${r.detail} ${signed(s[2])} = ${total}.`,'spirit')});
 $('#socialSearch')?.addEventListener('input',e=>{socialSearch=e.target.value;renderSocial()});
 $('#addAbsent')?.addEventListener('click',()=>editRegister());
 root.querySelectorAll('[data-edit-register]').forEach(b=>b.onclick=()=>editRegister(b.dataset.editRegister));
 root.querySelectorAll('[data-delete-register]').forEach(b=>b.onclick=()=>{if(!confirm('Retirer cette entrée du Registre ?'))return;S.absentRegister=S.absentRegister.filter(x=>x.id!==b.dataset.deleteRegister);save();renderSocial()});
}

function editRegister(id){const x=clone(S.absentRegister.find(x=>x.id===id)||{id:uid(),name:'',description:'',status:'À retrouver'});openEditor(id?'Modifier le Registre':'Nouvel absent',`<label>Nom ou désignation<input class="number" name="name" value="${esc(x.name)}"></label><label>Description et lien personnel<textarea name="description">${esc(x.description)}</textarea></label><label>Statut<select name="status"><option ${x.status==='À retrouver'?'selected':''}>À retrouver</option><option ${x.status==='Revenu'?'selected':''}>Revenu</option><option ${x.status==='Décès confirmé'?'selected':''}>Décès confirmé</option></select></label><button class="primary teal" value="save">Enregistrer</button>`,fd=>{Object.assign(x,{name:fd.get('name'),description:fd.get('description'),status:fd.get('status')});const i=S.absentRegister.findIndex(v=>v.id===x.id);i<0?S.absentRegister.push(x):S.absentRegister[i]=x;save();renderSocial()})}

function enhanceJournalLegacy(){
 const view=$('#journal'),grid=view?.querySelector('.grid');if(!grid)return;
 let controls=$('#journalModeTabs');if(!controls){controls=document.createElement('div');controls.id='journalModeTabs';controls.className='social-tabs';grid.before(controls)}
 controls.innerHTML=`<button class="ability ${journalTab==='notes'?'on':''}" data-journal-mode="notes">Carnet personnel</button><button class="ability ${journalTab==='history'?'on':''}" data-journal-mode="history">Historique automatique</button><button class="ability ${journalTab==='trash'?'on':''}" data-journal-mode="trash">Corbeille</button>`;
 controls.querySelectorAll('[data-journal-mode]').forEach(b=>b.onclick=()=>{journalTab=b.dataset.journalMode;enhanceJournal()});
 let notes=$('#personalNotebook');if(!notes){notes=document.createElement('div');notes.id='personalNotebook';grid.before(notes)}
 grid.hidden=journalTab!=='history';notes.hidden=journalTab==='history';if(journalTab==='history')return;
 const deleted=journalTab==='trash';const list=S.personalNotes.filter(n=>!!n.deleted===deleted&&(n.title+' '+n.body+' '+(n.tags||'')).toLowerCase().includes(noteSearch.toLowerCase())&&(!noteFilter||noteFilter==='favorite'&&n.favorite||noteFilter===n.category)).sort((a,b)=>(b.favorite-a.favorite)||b.updated.localeCompare(a.updated));
 notes.innerHTML=`<article class="panel full"><div class="journal-head"><div><div class="eyebrow">Les traces que l’on garde</div><h2>${deleted?'Souvenirs effacés':'Journal du voyage'}</h2></div><div class="journal-tools"><button class="ability" id="newPersonalNote">Nouvelle note</button><button class="ability" id="exportPersonalNotes">Exporter</button></div></div><input id="personalNoteSearch" type="search" placeholder="Chercher un nom, un indice…" value="${esc(noteSearch)}"><div class="note-filters"><button class="state ${!noteFilter?'on':''}" data-note-filter="">Toutes</button><button class="state ${noteFilter==='favorite'?'on':''}" data-note-filter="favorite">★ Favoris</button>${S.noteCategories.map(c=>`<button class="state ${noteFilter===c.id?'on':''}" data-note-filter="${c.id}" style="border-color:${c.color}">${esc(c.name)}</button>`).join('')}</div><div class="note-grid">${list.map(n=>`<button class="personal-note" data-note="${n.id}"><strong>${n.favorite?'★ ':''}${esc(n.title||'Sans titre')}</strong><small>${esc(S.noteCategories.find(c=>c.id===n.category)?.name||'Sans catégorie')} · ${esc(n.session||new Date(n.updated).toLocaleDateString('fr-FR'))}</small><p>${esc(n.body.slice(0,150))}</p></button>`).join('')||'<div class="empty">Votre carnet attend son premier souvenir.</div>'}</div></article>`;
 $('#newPersonalNote').onclick=()=>editNote();$('#exportPersonalNotes').onclick=exportNotes;$('#personalNoteSearch').oninput=e=>{noteSearch=e.target.value;enhanceJournal()};notes.querySelectorAll('[data-note-filter]').forEach(b=>b.onclick=()=>{noteFilter=b.dataset.noteFilter;enhanceJournal()});notes.querySelectorAll('[data-note]').forEach(b=>b.onclick=()=>editNote(b.dataset.note));
}

function editNote(id){const n=clone(S.personalNotes.find(x=>x.id===id)||{id:uid(),title:'',body:'',category:S.noteCategories[0]?.id||'',tags:'',favorite:false,session:'',updated:new Date().toISOString(),deleted:false});openEditor(n.deleted?'Souvenir effacé':'Écrire un souvenir',`<label>Titre<input class="number" name="title" value="${esc(n.title)}"></label><label>Catégorie<select name="category">${S.noteCategories.map(c=>`<option value="${c.id}" ${c.id===n.category?'selected':''}>${esc(c.name)}</option>`).join('')}</select></label><label>Note<textarea class="note-editor" name="body" placeholder="Ce que Wonq veut garder…">${esc(n.body)}</textarea></label><label>Étiquettes<input class="number" name="tags" value="${esc(n.tags)}" placeholder="séparées par des virgules"></label><label>Date de séance<input class="number" type="date" name="session" value="${esc(n.session)}"></label><label class="toggle"><input type="checkbox" name="favorite" ${n.favorite?'checked':''}> Favori</label><div class="row"><button class="primary teal" value="save">Terminer</button><button class="ability" id="toggleNoteDelete" type="button">${n.deleted?'Restaurer':'Placer dans la corbeille'}</button></div><p class="meta" id="autoSaveState">Sauvegarde automatique sur cet appareil</p>`,fd=>persistNote(n,fd),form=>{let timer;const autosave=()=>{clearTimeout(timer);timer=setTimeout(()=>{persistNote(n,new FormData(form),false);$('#autoSaveState').textContent='Enregistré sur cet appareil'},180)};form.oninput=autosave;form.onchange=autosave;$('#toggleNoteDelete').onclick=()=>{n.deleted=!n.deleted;persistNote(n,new FormData(form),false);$('#wonqEditor').close();enhanceJournal()}})}
function persistNote(n,fd,rerender=true){Object.assign(n,{title:fd.get('title'),body:fd.get('body'),category:fd.get('category'),tags:fd.get('tags'),session:fd.get('session'),favorite:fd.has('favorite'),updated:new Date().toISOString()});const i=S.personalNotes.findIndex(x=>x.id===n.id);i<0?S.personalNotes.push(n):S.personalNotes[i]=clone(n);save();if(rerender)enhanceJournal()}
function exportNotes(){const text=S.personalNotes.filter(n=>!n.deleted).map(n=>`# ${n.title||'Sans titre'}\n\n${S.noteCategories.find(c=>c.id===n.category)?.name||''} · ${n.session||''}\n\n${n.body}\n\nÉtiquettes : ${n.tags||''}`).join('\n\n---\n\n');const u=URL.createObjectURL(new Blob([text],{type:'text/markdown'})),a=document.createElement('a');a.href=u;a.download='Wonq-journal.md';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}
function openEditor(title,body,onSave,onReady){const d=$('#wonqEditor'),form=d.querySelector('form');$('#editorTitle').textContent=title;$('#editorBody').innerHTML=body;d.returnValue='';d.showModal();const handler=e=>{if(e.submitter?.value!=='save')return;e.preventDefault();onSave(new FormData(form));d.close()};form.addEventListener('submit',handler,{once:true});onReady?.(form)}


function enhanceJournal(){
 const sessionLayer=window.WonqSessionJournal;
 if(sessionLayer&&typeof sessionLayer.renderJournal==='function')return sessionLayer.renderJournal(window.WonqJournalBridge);
 return enhanceJournalLegacy();
}
window.WonqJournalBridge={
 esc,uid,clone,openEditor,persistNote,
 getCategories:()=>S.noteCategories,
 getTab:()=>journalTab,setTab:v=>{journalTab=v},
 getFilter:()=>noteFilter,setFilter:v=>{noteFilter=v},
 getSearch:()=>noteSearch,setSearch:v=>{noteSearch=v},
 rerender:()=>enhanceJournal(),
 legacy:()=>enhanceJournalLegacy()
};

const style=document.createElement('style');style.textContent=`
.social-tabs{display:flex;gap:7px;overflow:auto;margin:0 0 12px;padding-bottom:2px}.social-tabs button{white-space:nowrap}.social-skills{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.social-skill{min-height:62px;border:1px solid var(--line);border-radius:11px;background:#121619;padding:8px 10px;display:flex;justify-content:space-between;align-items:center;text-align:left}.social-skill b,.social-skill small{display:block}.social-skill small{color:var(--muted)}.social-skill strong{font-size:1.25rem;color:var(--gold)}.social-passives{display:flex;gap:7px;flex-wrap:wrap;margin:10px 0}.social-passives span{border:1px solid var(--line);border-radius:999px;padding:5px 9px;color:var(--muted)}.inventory-grid,.register-grid,.note-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px}.inventory-card,.register-card{border:1px solid var(--line);border-radius:11px;background:#121619;padding:11px}.inventory-card{position:relative;display:flex;justify-content:space-between;gap:8px;overflow:hidden;min-height:62px}.inventory-card small{display:block;color:var(--muted)}.inventory-card.illustrated{display:grid;grid-template-columns:76px 1fr auto;align-items:center;padding:0 11px 0 0;min-height:76px;background:linear-gradient(115deg,#101718,#151318)}.inventory-card.signature-item{grid-template-columns:104px 1fr auto;min-height:104px;border-color:#a985524d;box-shadow:inset 0 0 35px #4ecac309}.inventory-visual{position:relative;align-self:stretch;min-height:76px;background:#060808;overflow:hidden}.inventory-visual img{width:100%;height:100%;object-fit:cover;display:block;filter:saturate(.88) contrast(1.05);transition:transform .25s ease,filter .25s ease}.inventory-card:hover .inventory-visual img{transform:scale(1.045);filter:saturate(1.08) contrast(1.05)}.inventory-visual:after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent 60%,#121619)}.inventory-visual span{position:absolute;z-index:1;left:7px;bottom:6px;padding:2px 6px;border:1px solid #d3b36c55;border-radius:999px;background:#080b0bcc;color:#d7bd82;font-size:.56rem;text-transform:uppercase;letter-spacing:.08em}.inventory-copy{min-width:0}.inventory-copy b{display:block;color:#f0dcc0}.item-qty{align-self:flex-start;color:var(--gold);font-size:.82rem}.register-card{grid-column:span 1}.register-card p{color:var(--muted);min-height:3em}.note-filters{display:flex;gap:6px;overflow:auto;margin:9px 0}.personal-note{width:100%;text-align:left;border:1px solid var(--line);border-radius:12px;background:#121619;padding:12px}.personal-note strong,.personal-note small{display:block}.personal-note strong{font:1.05rem Georgia,serif;color:#f0dcc0}.personal-note small{color:var(--gold);margin:4px 0}.personal-note p{color:var(--muted);margin:5px 0}.wonq-editor{width:min(620px,calc(100% - 20px));max-height:90vh;overflow:auto;border:1px solid var(--gold);border-radius:18px;background:#151419;color:var(--ink);padding:18px;box-shadow:0 25px 80px #000}.wonq-editor::backdrop{background:#020303d8;backdrop-filter:blur(7px)}.wonq-editor label{display:block;margin:9px 0;color:var(--muted)}.wonq-editor input,.wonq-editor select,.wonq-editor textarea{width:100%;margin-top:5px;background:#0c0a0d;color:var(--ink);border:1px solid var(--line);border-radius:9px;padding:9px}.wonq-editor textarea{min-height:180px;resize:vertical}.wonq-editor .toggle input{width:auto}
@media(max-width:767px){.social-skills,.register-grid,.note-grid{grid-template-columns:1fr}.inventory-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.inventory-card.illustrated,.inventory-card.signature-item{display:block;padding:0;min-height:0}.inventory-card.illustrated .inventory-visual{height:118px}.inventory-card.signature-item .inventory-visual{height:150px}.inventory-card .inventory-copy{padding:9px}.inventory-card .item-qty{position:absolute;right:7px;top:7px;padding:3px 6px;border-radius:999px;background:#070909d9}.inventory-card:not(.illustrated){grid-column:span 2}.social-tabs{position:sticky;top:151px;z-index:25;background:#100e12f2;padding:5px 0}.wonq-editor{padding:13px}.wonq-editor textarea{min-height:35vh}}
@media(min-width:768px) and (max-width:1100px){.social-skills,.inventory-grid,.register-grid,.note-grid{grid-template-columns:repeat(2,1fr)}}
`;document.head.appendChild(style);

ensureState();installShell();const baseRender=render;render=function(){baseRender();ensureState();installShell();renderSocial();enhanceJournal()};render();
})();
