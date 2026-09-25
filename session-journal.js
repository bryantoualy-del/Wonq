(()=>{
'use strict';
const api={
 get state(){return{journal:Array.isArray(S.journal)?S.journal.map(x=>typeof x==='string'?x:[x.time,x.title,x.text].filter(Boolean).join(' · ')):[]}},
 log(message){
  const text=String(message||'');
  S.journal.push({combat:S.combat,round:S.round,turn:S.turn,title:'Session',text,type:'social',time:new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit',second:'2-digit'})});
  if(S.journal.length>180)S.journal.shift();
  S.lastResult='Session · '+text;
  save();
  try{renderJournal()}catch(_){}
  try{showRibbon('Session',text)}catch(_){}
 }
},panel=document.querySelector('#journal');if(!panel)return;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const KEY='wonq-session-v3',LEGACY_V2='wonq-session-v2',LEGACY_SESSION='wonq-session-v1',LEGACY_SOCIAL='wonq-social-v2';
const DB_NAME='wonq-session-media-v1',DB_STORE='assets';
const TYPES=['Événement','PNJ','Lieu','Indice','Décision','Promesse','Objectif','Butin','Mémoire'];
const PERSON_CATEGORIES=['Allié','Compagnon','Contact','Rival','Ennemi','Inconnu'];
const PNJ_KINDS={information:'Information',status:'Statut',relation:'Relation',promesse:'Promesse',dette:'Dette',objectif:'Objectif',souvenir:'Souvenir',localisation:'Localisation'};
const SOCIAL_ACTIONS=[
 ['Registre des Absents','Une rencontre, un disparu ou un souvenir mérite d’être consigné.'],
 ['Contes de l’Au-delà','Un conte ou un esprit a influencé la scène.'],
 ['La Longue Mémoire','La pipe-focaliseur a ravivé un souvenir ou soutenu un récit.'],
 ['Bâton du Vagabond Gris','Le bâton ou son histoire a eu un rôle dans la scène.'],
 ['Porte dimensionnelle','Un sauvetage, une fuite ou un passage décisif a été effectué.'],
 ['Langues & récits','Une langue, une coutume ou une histoire ancienne a permis de créer un lien.']
]
const uid=()=>crypto.randomUUID?.()||`${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
const isoDate=()=>new Date().toISOString().slice(0,10);
const localDate=value=>new Date(value||Date.now()).toLocaleDateString('fr-FR');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone=x=>JSON.parse(JSON.stringify(x));
const journal=()=>Array.isArray(api.state.journal)?api.state.journal.map(String):[];
const blank=start=>({id:`session-${uid()}`,title:`Session du ${new Date().toLocaleDateString('fr-FR')}`,date:isoDate(),startedAt:new Date().toISOString(),startIndex:start,notes:'',entries:[],people:[]});

function read(key,fallback=null){try{return JSON.parse(localStorage.getItem(key)||'null')??fallback}catch(_){return fallback}}
function migrate(){
 const v2=read(LEGACY_V2);
 if(v2?.active){
  const allPeople=Array.isArray(v2.people)?v2.people:[],ids=new Set(v2.active.peopleTouched||[]),people=allPeople.filter(x=>ids.has(x.id));
  const archives=(Array.isArray(v2.archives)?v2.archives:[]).map(session=>Array.isArray(session.peopleSnapshot)?session:{...session,peopleSnapshot:allPeople.filter(x=>new Set(session.peopleTouched||[]).has(x.id))});
  return{version:3,active:{...blank(v2.active.startIndex||0),...v2.active,people},archives};
 }
 const old=read(LEGACY_SESSION),social=read(LEGACY_SOCIAL,{});
 if(old?.active){
  const convert=x=>({...blank(x.startIndex||0),...x,date:(x.startedAt||'').slice(0,10)||isoDate(),entries:(x.highlights||[]).map(h=>({id:uid(),type:TYPES.includes(h.type)?h.type:'Événement',text:h.text||'',createdAt:h.createdAt||x.startedAt||new Date().toISOString()})),peopleTouched:[]});
  const archives=(old.archives||[]).map(x=>({...convert(x),endedAt:x.endedAt,mechanical:x.journal||[],summary:x.summary||''}));
  return{version:3,active:{...convert(old.active),people:[]},archives};
 }
 const priorSessions=Array.isArray(S.playSessions)?S.playSessions:[],priorNotes=Array.isArray(S.personalNotes)?S.personalNotes:[];
 if(priorSessions.length||priorNotes.length){
  const typeMap={people:'PNJ',places:'Lieu',clues:'Indice',quest:'Objectif',items:'Butin',factions:'Événement',memory:'Mémoire',event:'Événement'};
  const convertSession=s=>{
   const sessionNotes=priorNotes.filter(n=>n.sessionId===s.id&&!n.deleted);
   return{...blank(0),id:s.id||`session-${uid()}`,title:s.title||'Session de Wonq',date:(s.startedAt||'').slice(0,10)||isoDate(),startedAt:s.startedAt||new Date().toISOString(),notes:'',entries:sessionNotes.map(n=>({id:n.id||uid(),type:typeMap[n.category]||'Événement',text:[n.title,n.body].filter(Boolean).join(' — '),createdAt:n.created||n.updated||new Date().toISOString()})),people:[],endedAt:s.endedAt||null};
  };
  let sessions=priorSessions.map(convertSession);
  const orphan=priorNotes.filter(n=>!n.sessionId&&!n.deleted);
  if(orphan.length)sessions.push({...blank(0),id:'wonq-legacy-notes',title:'Carnet antérieur de Wonq',date:(orphan[0].created||orphan[0].updated||new Date().toISOString()).slice(0,10),entries:orphan.map(n=>({id:n.id||uid(),type:typeMap[n.category]||'Mémoire',text:[n.title,n.body].filter(Boolean).join(' — '),createdAt:n.created||n.updated||new Date().toISOString()})),people:[],endedAt:new Date().toISOString()});
  const activeId=S.activePlaySessionId||'';
  let active=sessions.find(x=>x.id===activeId&&!x.endedAt)||sessions.find(x=>!x.endedAt)||blank(0);
  const archives=sessions.filter(x=>x.id!==active.id).map(x=>({...x,endedAt:x.endedAt||new Date().toISOString(),mechanical:[]}));
  return{version:3,active:{...active,people:Array.isArray(active.people)?active.people:[]},archives};
 }
 const active=blank(0),legacyNotes=[social?.legacyNotes,social?.legacyRelations].filter(Boolean).join('\n');if(legacyNotes)active.notes=legacyNotes;
 return{version:3,active:{...active,people:[]},archives:[]};
}
let data=read(KEY)||migrate();
if(data.version!==3)data=migrate();if(!data.active)data.active=blank(journal().length);if(!Array.isArray(data.active.entries))data.active.entries=[];if(!Array.isArray(data.active.people))data.active.people=[];if(!Array.isArray(data.archives))data.archives=[];
const save=()=>{localStorage.setItem(KEY,JSON.stringify(data));document.dispatchEvent(new CustomEvent('wonq-session-updated'))};
const activeMechanical=session=>session.mechanical||journal().slice(Math.min(session.startIndex||0,journal().length));

function rosterFromHash(){
 try{
  const encoded=new URLSearchParams(location.hash.replace(/^#/, '')).get('roster');if(!encoded)return[];
  const base64=encoded.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-encoded.length%4)%4),binary=atob(base64),bytes=Uint8Array.from(binary,c=>c.charCodeAt(0)),payload=JSON.parse(new TextDecoder().decode(bytes));
  if(payload?.v!==1||!Array.isArray(payload.people))return[];
  return payload.people.slice(0,20).map(person=>({id:String(person.id||uid()).replace(/[^a-zA-Z0-9_-]/g,'-').slice(0,180)||uid(),name:String(person.name||'').trim().slice(0,120),category:String(person.category||'Inconnu').slice(0,80),status:String(person.status||'').slice(0,120),obsidianPath:String(person.path||'').normalize('NFC').slice(0,400)})).filter(person=>person.name&&person.obsidianPath.startsWith('02 - Personnages/PNJ/')&&person.obsidianPath.endsWith('.md'));
 }catch(_){return[]}
}
function importRoster(){
 const incoming=rosterFromHash();if(!incoming.length)return 0;
 for(const person of incoming){const existing=data.active.people.find(x=>x.obsidianPath===person.obsidianPath||x.id===person.id);if(existing){existing.name=person.name;existing.category=person.category;existing.status=person.status;existing.source='obsidian';existing.obsidianPath=person.obsidianPath;if(typeof existing.participated!=='boolean')existing.participated=false}else data.active.people.push({...person,source:'obsidian',participated:false,note:'',debt:'',promise:'',goal:''})}
 history.replaceState(null,'',`${location.pathname}${location.search}`);return incoming.length;
}
const importedRosterCount=importRoster();

function openMediaDb(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,1);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(DB_STORE))req.result.createObjectStore(DB_STORE,{keyPath:'id'})};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
async function mediaPut(file,id=uid()){const db=await openMediaDb();return new Promise((resolve,reject)=>{const tx=db.transaction(DB_STORE,'readwrite'),record={id,blob:file,type:file.type||'image/jpeg',originalName:file.name||'portrait',updatedAt:new Date().toISOString()};tx.objectStore(DB_STORE).put(record);tx.oncomplete=()=>{db.close();resolve(record)};tx.onerror=()=>{db.close();reject(tx.error)}})}
async function mediaGet(id){if(!id)return null;const db=await openMediaDb();return new Promise((resolve,reject)=>{const req=db.transaction(DB_STORE).objectStore(DB_STORE).get(id);req.onsuccess=()=>{db.close();resolve(req.result||null)};req.onerror=()=>{db.close();reject(req.error)}})}
async function mediaDelete(id){if(!id)return;const db=await openMediaDb();return new Promise((resolve,reject)=>{const tx=db.transaction(DB_STORE,'readwrite');tx.objectStore(DB_STORE).delete(id);tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>{db.close();reject(tx.error)}})}

panel.querySelector('#journalModeTabs')?.remove();
panel.querySelector('#personalNotebook')?.remove();
const legacyGrid=panel.querySelector(':scope > .grid');
const mechanicalCard=legacyGrid?.querySelector('.panel')||panel.querySelector('.panel');
const subnav=document.createElement('div');subnav.className='journal-subtabs';subnav.setAttribute('role','tablist');subnav.innerHTML='<button id="journalMechanicalTab" role="tab" data-journal-view="mechanical">Journal mécanique</button><button id="journalNotesTab" role="tab" data-journal-view="notes">Carnet de session</button>';
const mechanicalPane=document.createElement('section');mechanicalPane.className='journal-pane';mechanicalPane.dataset.journalPane='mechanical';
const notesPane=document.createElement('section');notesPane.className='journal-pane';notesPane.dataset.journalPane='notes';
if(mechanicalCard)mechanicalPane.appendChild(mechanicalCard);
if(legacyGrid&&!legacyGrid.children.length)legacyGrid.remove();
panel.append(subnav,mechanicalPane,notesPane);

const desk=document.createElement('article');desk.className='session-desk';desk.innerHTML=`
 <header class="session-head"><div><span class="session-kicker">Carnet de session</span><input id="sessionTitle" aria-label="Titre de la session"></div><div class="session-meta"><input id="sessionDate" type="date" aria-label="Date de la session"><span id="sessionSaveState">Sauvegardé</span></div></header>
 <section class="capture-card"><div class="capture-copy"><b>Capture rapide</b><small>Une ligne, Entrée, c’est consigné.</small></div><div class="session-capture"><select id="entryType" aria-label="Type de note">${TYPES.map(x=>`<option>${x}</option>`).join('')}</select><div id="pnjCaptureContext" class="pnj-capture-context" hidden><select id="entryPerson" aria-label="Fiche PNJ liée"></select><select id="entryPnjKind" aria-label="Nature de l’information PNJ">${Object.entries(PNJ_KINDS).map(([value,label])=>`<option value="${value}">${label}</option>`).join('')}</select></div><input id="entryText" autocomplete="off" placeholder="Que vient-il de se passer ?"><button id="addEntry" class="btn-gold">Ajouter</button><button id="cancelEntryEdit" hidden>Annuler</button></div><div id="entryFilters" class="entry-filters"></div></section>
 <div class="session-main-grid">
  <section class="session-timeline"><header><div><span>Chronologie</span><h3>Repères de la séance</h3></div><strong id="sessionCount"></strong></header><div id="entryList"></div></section>
  <aside class="session-side">
   <label class="session-notes"><span>Notes libres</span><textarea id="sessionNotes" placeholder="Impressions, dialogues, théorie en cours, détails à trier plus tard…"></textarea><small>Sauvegarde automatique.</small></label>
   <section class="social-shortcuts"><span>Actions de Wonq</span><div>${SOCIAL_ACTIONS.map((x,i)=>`<button data-social-shortcut="${i}">${x[0]}</button>`).join('')}</div></section>
  </aside>
 </div>
 <section class="people-card"><header><div><span>Distribution de la session</span><h3>PNJ préparés et nouvelles rencontres</h3><p>Un PNJ préparé n’est exporté que s’il est marqué présent ou relié à une note. Les figurants restent de simples mentions.</p></div><div><button id="addPerson" class="btn-gold">＋ Créer une fiche PNJ</button></div></header><div id="peopleList" class="people-list"></div></section>
 <section class="session-export"><div><span>Fin de séance</span><b>Import Obsidian en un geste</b><small>Télécharge le paquet, puis laisse le plugin Kentaro Session Importer le classer directement dans ton coffre.</small></div><div><button id="previewMarkdown">Aperçu</button><button id="setupObsidian">Installer le plugin</button><button id="exportObsidian" class="btn-gold">1 · Télécharger</button><button id="openObsidian">2 · Ouvrir Obsidian</button><button id="closeSession" class="session-close">Clore la session</button></div></section>
 <section id="markdownPreview" class="session-preview" hidden><header><b>Aperçu de la note Obsidian</b><div class="session-preview-actions"><button id="copyMarkdown">Copier</button><button id="collapseMarkdown">Replier</button></div></header><pre></pre></section>
 <details class="session-archives"><summary>Sessions archivées <span id="archiveCount"></span></summary><div id="archiveList"></div></details>
 <dialog id="personEditor" class="session-dialog"><form method="dialog"><header><h3 id="personEditorTitle">Personne</h3><button value="cancel" aria-label="Fermer">×</button></header><div id="personEditorBody"></div></form></dialog>
 <dialog id="obsidianSetup" class="session-dialog obsidian-setup"><form method="dialog"><header><div><span class="session-kicker">Installation unique</span><h3>Plugin « Kentaro Session Importer »</h3></div><button value="cancel" aria-label="Fermer">×</button></header><ol><li>Dans Obsidian, installe puis active le module communautaire <b>BRAT</b>.</li><li>Dans BRAT, choisis <b>Add beta plugin</b> et saisis <code>bryantoualy-del/Kentaro</code>.</li><li>Sélectionne la dernière version puis active <b>Kentaro Session Importer</b> dans les modules installés.</li><li>Pour Wonq, la distribution et les nouvelles fiches PNJ se gèrent directement dans ce carnet.</li><li>À la fin : télécharge le ZIP, ouvre Obsidian, touche l’icône lune et sélectionne le fichier.</li><li>Vérifie l’aperçu puis touche <b>Importer dans ce coffre</b>.</li></ol><p>Le plugin travaille entièrement en local. Obsidian reste le registre permanent et les PNJ préparés mais absents ne sont pas exportés.</p><button value="cancel" class="btn-gold">J’ai compris</button></form></dialog>
 <div class="session-toast" id="sessionToast" role="status"></div>`;
notesPane.appendChild(desk);

const q=s=>$(s,desk),title=q('#sessionTitle'),date=q('#sessionDate'),notes=q('#sessionNotes'),entryText=q('#entryText'),entryType=q('#entryType'),entryPerson=q('#entryPerson'),entryPnjKind=q('#entryPnjKind'),pnjContext=q('#pnjCaptureContext'),preview=q('#markdownPreview');
let entryFilter='Tout',editingEntry=-1,previewUrls=[];
function renderPnjCapture(personId='',kind='information'){const active=entryType.value==='PNJ',selected=personId||entryPerson.value,people=data.active.people;pnjContext.hidden=!active;entryPerson.innerHTML=`<option value="">Mention libre — aucune fiche</option>${people.map(x=>`<option value="${esc(x.id)}">Lier à ${esc(x.name||'Sans nom')}</option>`).join('')}`;if(selected&&people.some(x=>x.id===selected))entryPerson.value=selected;entryPnjKind.value=PNJ_KINDS[kind]?kind:'information';entryText.placeholder=active?'Nom et information utile sur ce PNJ…':'Que vient-il de se passer ?'}
entryType.addEventListener('change',()=>renderPnjCapture());
function notify(text){const toast=q('#sessionToast');toast.textContent=text;toast.classList.add('show');clearTimeout(notify.timer);notify.timer=setTimeout(()=>toast.classList.remove('show'),1700)}
function flash(button,label){const old=button.textContent;button.textContent=label;setTimeout(()=>button.textContent=old,1400)}
async function copyText(text,button){try{await navigator.clipboard.writeText(text)}catch(_){const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove()}if(button)flash(button,'Copié ✓')}
function saved(){q('#sessionSaveState').textContent=`Sauvegardé · ${new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}`}
function persist(){save();saved()}
function selectJournalView(name){const current=name==='mechanical'?'mechanical':'notes';$$('[data-journal-view]',subnav).forEach(b=>{const on=b.dataset.journalView===current;b.classList.toggle('active',on);b.setAttribute('aria-selected',String(on))});$$('[data-journal-pane]',panel).forEach(p=>p.hidden=p.dataset.journalPane!==current);try{localStorage.setItem('wonq-journal-view',current)}catch{}}
subnav.onclick=e=>{const b=e.target.closest('[data-journal-view]');if(b)selectJournalView(b.dataset.journalView)};
selectJournalView(localStorage.getItem('wonq-journal-view')||'notes');

function renderFilters(){const present=['Tout',...new Set(data.active.entries.map(x=>x.type))];q('#entryFilters').innerHTML=present.map(x=>`<button class="${entryFilter===x?'active':''}" data-entry-filter="${esc(x)}">${esc(x)}</button>`).join('')}
function renderEntries(){
 const entries=data.active.entries.map((x,i)=>({...x,index:i})).filter(x=>entryFilter==='Tout'||x.type===entryFilter);
 q('#entryList').innerHTML=entries.length?entries.map(x=>{const person=data.active.people.find(p=>p.id===x.personId),pnjMeta=x.type==='PNJ'&&person?` · ${esc(person.name)} · ${esc(PNJ_KINDS[x.pnjKind]||'Information')}`:'';const promote=x.type==='PNJ'&&!person?`<button data-promote-entry="${x.index}" title="Créer une fiche PNJ depuis cette mention">♙</button>`:'';return `<article class="timeline-entry"><span class="entry-dot"></span><div><small>${esc(x.type)}${pnjMeta} · ${new Date(x.createdAt||Date.now()).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</small><p>${esc(x.text)}</p></div><div>${promote}<button data-edit-entry="${x.index}" title="Modifier">✎</button><button data-delete-entry="${x.index}" title="Supprimer">×</button></div></article>`}).join(''):'<div class="session-empty">Aucun repère dans cette catégorie.</div>';
 renderFilters();q('#sessionCount').textContent=`${data.active.entries.length} repère${data.active.entries.length>1?'s':''}`;
}
function renderArchives(){q('#archiveCount').textContent=`(${data.archives.length})`;q('#archiveList').innerHTML=data.archives.length?data.archives.map((x,i)=>`<article><div><b>${esc(x.title)}</b><small>${localDate(x.endedAt)} · ${(x.entries||[]).length} repères · ${(x.mechanical||[]).length} événements</small></div><div class="archive-actions"><button data-copy-archive="${i}">Copier</button><button data-export-archive="${i}">ZIP</button><button class="archive-delete" data-delete-archive="${i}" title="Supprimer cette session archivée">Supprimer</button></div></article>`).join(''):'<p class="session-empty">Aucune session close pour le moment.</p>'}
async function renderPeople(){
 previewUrls.forEach(URL.revokeObjectURL);previewUrls=[];const people=data.active.people;
 q('#peopleList').innerHTML=people.length?people.map(x=>`<article class="person-card" data-person-card="${x.id}"><div class="person-avatar" data-person-image="${x.id}">${esc((x.name||'?').slice(0,1).toUpperCase())}</div><div><b>${esc(x.name||'Sans nom')}</b><small>${esc(x.category||'Inconnu')}${x.status?` · ${esc(x.status)}`:''}</small><p>${esc(x.note||(x.source==='obsidian'?'Fiche liée à Obsidian':'Aucune note'))}</p><span>${x.source==='obsidian'?'Préparé depuis Obsidian':'Nouvelle fiche'}${x.promise?' · Promesse':''}${x.debt?' · Dette':''}${x.goal?' · Objectif':''}</span></div><footer><button data-touch-person="${x.id}" class="${x.participated!==false?'active':''}">${x.participated!==false?'Présent ✓':'Marquer présent'}</button><button data-edit-person="${x.id}">Modifier</button></footer></article>`).join(''):'<div class="session-empty">Aucune distribution préparée. Les noms secondaires peuvent rester dans les notes.</div>';
 for(const person of people.filter(x=>x.assetId)){try{const media=await mediaGet(person.assetId),slot=q(`[data-person-image="${CSS.escape(person.id)}"]`);if(media?.blob&&slot){const url=URL.createObjectURL(media.blob);previewUrls.push(url);slot.innerHTML=`<img src="${url}" alt="">`}}catch(_){}}
}
function render(){title.value=data.active.title||'';date.value=data.active.date||isoDate();if(notes!==document.activeElement)notes.value=data.active.notes||'';renderPnjCapture();renderEntries();renderPeople();renderArchives();saved()}

function addOrUpdateEntry(){const text=entryText.value.trim();if(!text)return;const type=entryType.value,personId=type==='PNJ'?entryPerson.value:'',pnjKind=type==='PNJ'?entryPnjKind.value:'';const previous=editingEntry>=0?data.active.entries[editingEntry]:null,item={id:previous?.id||uid(),type,text,createdAt:previous?.createdAt||new Date().toISOString(),personId,pnjKind};if(editingEntry>=0){data.active.entries[editingEntry]=item;editingEntry=-1;q('#addEntry').textContent='Ajouter';q('#cancelEntryEdit').hidden=true}else data.active.entries.push(item);const person=data.active.people.find(x=>x.id===personId);if(person)person.participated=true;entryText.value='';persist();renderEntries();renderPeople()}
q('#addEntry').onclick=addOrUpdateEntry;entryText.onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();addOrUpdateEntry()}};
document.addEventListener('wonq-session-add',e=>{const detail=e.detail||{},text=String(detail.text||'').trim();if(!text)return;data.active.entries.push({id:uid(),type:TYPES.includes(detail.type)?detail.type:'Événement',text,createdAt:new Date().toISOString()});persist();renderEntries()});
q('#cancelEntryEdit').onclick=()=>{editingEntry=-1;entryText.value='';q('#addEntry').textContent='Ajouter';q('#cancelEntryEdit').hidden=true;renderPnjCapture()};
q('#entryFilters').onclick=e=>{const b=e.target.closest('[data-entry-filter]');if(b){entryFilter=b.dataset.entryFilter;renderEntries()}};
q('#entryList').onclick=e=>{const edit=e.target.closest('[data-edit-entry]'),del=e.target.closest('[data-delete-entry]'),promote=e.target.closest('[data-promote-entry]');if(edit){editingEntry=Number(edit.dataset.editEntry);const item=data.active.entries[editingEntry];entryType.value=item.type;renderPnjCapture(item.personId||'',item.pnjKind||'information');entryText.value=item.text;entryText.focus();q('#addEntry').textContent='Mettre à jour';q('#cancelEntryEdit').hidden=false}if(del){data.active.entries.splice(Number(del.dataset.deleteEntry),1);persist();renderEntries()}if(promote){const index=Number(promote.dataset.promoteEntry),item=data.active.entries[index];editPerson('',{note:item.text,sourceEntryIndex:index})}};
title.oninput=()=>{data.active.title=title.value;persist()};date.onchange=()=>{data.active.date=date.value||isoDate();persist()};notes.oninput=()=>{data.active.notes=notes.value;persist()};
q('.social-shortcuts').onclick=e=>{const b=e.target.closest('[data-social-shortcut]');if(!b)return;const action=SOCIAL_ACTIONS[Number(b.dataset.socialShortcut)];data.active.entries.push({id:uid(),type:'Événement',text:`${action[0]} — ${action[1]}`,createdAt:new Date().toISOString()});api.log(`♜ ${action[0]} consigné dans le carnet.`);persist();renderEntries();notify(`${action[0]} consigné ✓`)};

function personForm(x){const portrait=x.source==='obsidian'?'<div class="portrait-field"><small>Le portrait et l’identité permanente restent gérés dans la fiche Obsidian.</small></div>':`<label class="portrait-field">Portrait<input name="portrait" type="file" accept="image/png,image/jpeg,image/webp"><small>${x.assetId?'Un portrait est déjà associé. Choisir un fichier le remplacera.':'PNG, JPEG ou WebP. Il sera transmis à Obsidian avec la fiche.'}</small></label>`;return`<label>Nom<input name="name" required value="${esc(x.name||'')}" placeholder="Nom du PNJ"></label><div class="dialog-grid"><label>Catégorie<select name="category">${PERSON_CATEGORIES.map(c=>`<option ${c===x.category?'selected':''}>${c}</option>`).join('')}</select></label><label>Statut<input name="status" value="${esc(x.status||'')}" placeholder="Actif, disparu, hostile…"></label></div><label>Information de cette session<textarea name="note">${esc(x.note||'')}</textarea></label><div class="dialog-grid"><label>Dette<input name="debt" value="${esc(x.debt||'')}"></label><label>Promesse<input name="promise" value="${esc(x.promise||'')}"></label></div><label>Objectif / prochaine étape<input name="goal" value="${esc(x.goal||'')}"></label>${portrait}<div class="dialog-actions"><button value="save" class="btn-gold">${x.id?'Enregistrer':'Créer la fiche'}</button>${x.id?'<button type="button" data-delete-person class="utility-danger">Retirer</button>':''}</div>`}
function editPerson(id,seed={}){
 const existing=data.active.people.find(x=>x.id===id),person=existing||{id:'',name:'',category:'Inconnu',status:'',note:seed.note||'',debt:'',promise:'',goal:'',source:'session',participated:true},dlg=q('#personEditor'),form=$('form',dlg);q('#personEditorTitle').textContent=existing?'Modifier le suivi PNJ':'Créer une fiche PNJ';q('#personEditorBody').innerHTML=personForm(person);dlg.showModal();
 form.onsubmit=async e=>{if(e.submitter?.value!=='save')return;e.preventDefault();const fd=new FormData(form),name=String(fd.get('name')||'').trim();if(!name)return;const target=existing||{id:uid(),source:'session',participated:true};['name','category','status','note','debt','promise','goal'].forEach(k=>target[k]=String(fd.get(k)||'').trim());const portrait=fd.get('portrait');if(portrait instanceof File&&portrait.size){if(portrait.size>12*1024*1024)return alert('Cette image dépasse 12 Mo. Choisis une version plus légère.');try{const media=await mediaPut(portrait,target.assetId||uid());target.assetId=media.id;target.imageType=media.type;target.imageOriginalName=media.originalName}catch(error){return alert(`Impossible d’enregistrer cette image : ${error.message}`)}}target.updatedAt=new Date().toISOString();target.participated=true;if(!existing)data.active.people.push(target);if(Number.isInteger(seed.sourceEntryIndex)&&data.active.entries[seed.sourceEntryIndex]){data.active.entries[seed.sourceEntryIndex].personId=target.id;data.active.entries[seed.sourceEntryIndex].pnjKind='information'}persist();dlg.close();await renderPeople();renderEntries();renderPnjCapture(target.id);api.log(`♜ Suivi PNJ préparé : ${target.name}.`);notify(`${target.name} sera suivi dans cette session ✓`)};
 const del=$('[data-delete-person]',dlg);if(del)del.onclick=async()=>{if(!confirm(`Supprimer la fiche temporaire de ${person.name} ? Les mentions resteront dans la session.`))return;data.active.people=data.active.people.filter(x=>x.id!==person.id);data.active.entries.forEach(x=>{if(x.personId===person.id){x.personId='';x.pnjKind=''}});persist();dlg.close();renderPeople();renderEntries();renderPnjCapture()};
}
q('#addPerson').onclick=()=>editPerson();
q('#peopleList').onclick=e=>{const edit=e.target.closest('[data-edit-person]'),touch=e.target.closest('[data-touch-person]');if(edit)editPerson(edit.dataset.editPerson);if(touch){const person=data.active.people.find(x=>x.id===touch.dataset.touchPerson);if(person){person.participated=person.participated===false;persist();renderPeople()}}};

function yaml(value){return `"${String(value??'').replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/\n/g,' ')}"`}
function listYaml(values){return `[${[...new Set(values.filter(Boolean))].map(yaml).join(', ')}]`}
function safeName(value,fallback='Sans titre'){return String(value||fallback).normalize('NFC').replace(/[\\/:*?"<>|]/g,'-').replace(/\s+/g,' ').replace(/[. ]+$/g,'').trim()||fallback}
function imageExtension(person){const type=person.imageType||'';if(type.includes('png'))return'png';if(type.includes('webp'))return'webp';return'jpg'}
function imageFileName(person){const token=String(person.assetId||person.id||'wonq').replace(/[^a-z0-9]/gi,'').slice(0,8)||'wonq';return`PNJ - ${safeName(person.name)} - ${token}.${imageExtension(person)}`}
function touchedPeople(session){if(Array.isArray(session.peopleSnapshot))return session.peopleSnapshot;return (Array.isArray(session.people)?session.people:[]).filter(person=>person.participated!==false)}
function buildPersonUpdates(session,people){const sessionNote=`${session.date||isoDate()} — ${safeName(session.title)}`,entries=session.entries||[];return people.map(person=>{const facts=[{kind:'appearance',label:'Apparition',text:`[[${sessionNote}]]`,defaultSelected:true}];if(person.note)facts.push({kind:'information',label:'Ce que Wonq sait',text:person.note,defaultSelected:true});if(person.category)facts.push({kind:'relation',label:'Relation',text:person.category,defaultSelected:true});if(person.status)facts.push({kind:'status',label:'Statut proposé',text:person.status,defaultSelected:false});if(person.debt)facts.push({kind:'dette',label:'Dette',text:person.debt,defaultSelected:true});if(person.promise)facts.push({kind:'promesse',label:'Promesse',text:person.promise,defaultSelected:true});if(person.goal)facts.push({kind:'objectif',label:'Objectif',text:person.goal,defaultSelected:true});for(const entry of entries.filter(x=>x.type==='PNJ'&&x.personId===person.id)){const kind=PNJ_KINDS[entry.pnjKind]?entry.pnjKind:'information';facts.push({kind,label:PNJ_KINDS[kind],text:entry.text,defaultSelected:kind!=='status'})}const seen=new Set();return{id:person.id,name:person.name,destination:`02 - Personnages/PNJ/Wonq/${safeName(person.name)}.md`,sessionId:session.id||'',sessionDate:session.date||isoDate(),sessionTitle:session.title||'Session de Wonq',sessionNote,facts:facts.filter(f=>{const key=`${f.kind}|${f.text.trim().toLowerCase()}`;if(seen.has(key))return false;seen.add(key);return true})}})}
function personMarkdown(person,session){const image=person.assetId?imageFileName(person):'';return`---
type: pnj
wonq_id: ${yaml(person.id||'')}
aliases: []
race:
genre:
groupe:
lieu:
statut: ${yaml(person.status||'actif')}
relation_wonq: ${yaml(person.category||'inconnu')}
premiere_rencontre: ${yaml(session.date||'')}
illustration: ${image?yaml(image):''}
knowledge_scope: wonq
known_by:
  - Wonq
shared_to_party: false
tags:
  - pnj
  - wonq
---
# ${person.name||'PNJ sans nom'}
${image?`\n> [!infobox]\n> ![[${image}|coverhsmall]]\n`:''}
## En bref

${person.note||'_À compléter._'}

## Ce que Wonq sait

- **Statut :** ${person.status||'Inconnu'}
- **Relation :** ${person.category||'Inconnu'}
${person.debt?`- **Dette :** ${person.debt}\n`:''}${person.promise?`- **Promesse :** ${person.promise}\n`:''}${person.goal?`- **Objectif :** ${person.goal}\n`:''}
## Motivation

- À découvrir.

## Relations

- [[Wonq]]

## Secrets ou incertitudes

- [ ] À confirmer :

## Apparitions

- [[${session.date} — ${safeName(session.title)}]]
`}
function cleanMechanical(lines){const seen=new Set();return lines.filter(x=>{const t=String(x).trim();if(!t||seen.has(t))return false;seen.add(t);return true}).slice(-100)}
function sessionMarkdown(session){
 const entries=session.entries||[],people=touchedPeople(session),mechanical=cleanMechanical(activeMechanical(session)),locations=entries.filter(x=>x.type==='Lieu').map(x=>x.text),pnj=[...people.map(x=>x.name),...entries.filter(x=>x.type==='PNJ').map(x=>people.find(p=>p.id===x.personId)?.name).filter(Boolean)];
 const chronological=entries.length?entries.map(x=>{const person=people.find(p=>p.id===x.personId),subject=x.type==='PNJ'&&person?` · [[${person.name}]] · ${PNJ_KINDS[x.pnjKind]||'Information'}`:'';return `- **${x.type}${subject}** — ${x.text}`}).join('\n'):'_Aucun repère saisi._';
 const discoveries=entries.filter(x=>['Lieu','Indice','Butin','Mémoire'].includes(x.type));
 const decisions=entries.filter(x=>['Décision','Promesse','Objectif'].includes(x.type));
 const next=[...decisions.filter(x=>['Promesse','Objectif'].includes(x.type)).map(x=>x.text),...people.flatMap(x=>[x.promise,x.goal].filter(Boolean))];
 const encounters=people.length?`| PNJ | Statut | Relation / conséquence |\n| --- | --- | --- |\n${people.map(x=>`| [[${x.name}]] | ${x.status||'Inconnu'} | ${x.note||x.category||''} |`).join('\n')}${people.some(x=>x.assetId)?`\n\n### Visages de la session\n\n${people.filter(x=>x.assetId).map(x=>`![[${imageFileName(x)}|160]]`).join(' ')}`:''}`:'_Aucune personne associée._';
 const mech=mechanical.length?mechanical.flatMap(x=>String(x).split('\n').map(line=>`> ${line||' '}`)).join('\n'):'> Aucun événement mécanique.';
 return`---
type: session
kentaro_id: ${yaml(session.id||'')}
date: ${session.date||isoDate()}
personnage: Wonq
lieux: ${listYaml(locations)}
pnj: ${listYaml(pnj)}
resume: ""
tags:
  - session
  - kentaro
---
# ${session.date||isoDate()} — ${session.title||'Session de Wonq'}

## Notes de séance

${session.notes?.trim()||'_Aucune note libre._'}

## Chronologie

${chronological}

## Rencontres

${encounters}

## Découvertes

${discoveries.length?discoveries.map(x=>`- **${x.type} :** ${x.text}`).join('\n'):'_Aucune découverte consignée._'}

## Décisions et promesses

${decisions.length?decisions.map(x=>`- [ ] **${x.type} :** ${x.text}`).join('\n'):'_Aucune décision consignée._'}

## Combat et ressources

> [!note]- Journal mécanique — ${mechanical.length} événements
${mech}

## À préparer pour la prochaine session

${next.length?next.map(x=>`- [ ] ${x}`).join('\n'):'- [ ] À compléter.'}
`}

const crcTable=(()=>{const table=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;table[n]=c>>>0}return table})();
function crc32(bytes){let c=0xffffffff;for(const b of bytes)c=crcTable[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0}
function u16(n){return new Uint8Array([n&255,(n>>>8)&255])}function u32(n){return new Uint8Array([n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255])}
function joinBytes(parts){const length=parts.reduce((n,x)=>n+x.length,0),out=new Uint8Array(length);let offset=0;for(const part of parts){out.set(part,offset);offset+=part.length}return out}
function dosDate(value){const d=new Date(value||Date.now()),year=Math.max(1980,d.getFullYear());return{time:(d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1),date:((year-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate()}}
async function makeZip(files){const enc=new TextEncoder(),locals=[],centrals=[];let offset=0;for(const file of files){const name=enc.encode(file.path.normalize('NFC')),bytes=file.bytes instanceof Uint8Array?file.bytes:enc.encode(file.text||''),crc=crc32(bytes),stamp=dosDate(),local=joinBytes([u32(0x04034b50),u16(20),u16(0x0800),u16(0),u16(stamp.time),u16(stamp.date),u32(crc),u32(bytes.length),u32(bytes.length),u16(name.length),u16(0),name,bytes]);locals.push(local);centrals.push(joinBytes([u32(0x02014b50),u16(20),u16(20),u16(0x0800),u16(0),u16(stamp.time),u16(stamp.date),u32(crc),u32(bytes.length),u32(bytes.length),u16(name.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),name]));offset+=local.length}const central=joinBytes(centrals),end=joinBytes([u32(0x06054b50),u16(0),u16(0),u16(files.length),u16(files.length),u32(central.length),u32(offset),u16(0)]);return new Blob([...locals,central,end],{type:'application/zip'})}
function downloadBlob(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1800)}
function exportRoute(source,destination,kind,conflict){return{source,destination,kind,conflict}}
async function buildObsidianPackage(session=data.active){
 const people=touchedPeople(session),personUpdates=buildPersonUpdates(session,people),base=`${session.date||isoDate()} — ${safeName(session.title)}`,payload='Contenu',files=[],routes=[];
 const addText=(destination,text,kind,conflict='ask')=>{const source=`${payload}/${destination}`;files.push({path:source,text});routes.push(exportRoute(source,destination,kind,conflict))};
 const addBytes=(destination,bytes,kind,conflict='keep-newest')=>{const source=`${payload}/${destination}`;files.push({path:source,bytes});routes.push(exportRoute(source,destination,kind,conflict))};
 addText(`01 - Sessions/Wonq/${base}.md`,sessionMarkdown(session),'session','ask');
 for(const person of people){
  addText(`02 - Personnages/PNJ/Wonq/${safeName(person.name)}.md`,personMarkdown(person,session),'person','skip-existing');
  if(person.assetId){const media=await mediaGet(person.assetId).catch(()=>null);if(media?.blob)addBytes(`99 - Médias/${imageFileName(person)}`,new Uint8Array(await media.blob.arrayBuffer()),'media','keep-newest')}
 }
 const exportedAt=new Date(),stamp=exportedAt.toISOString().replace(/[-:]/g,'').slice(0,13),receipt=`# Import Wonq — ${session.date||isoDate()}\n\n- **Session :** [[${base}]]\n- **Identifiant :** \`${session.id||'session-sans-id'}\`\n- **PNJ suivis :** ${people.length}\n- **Nouvelles fiches proposées :** ${people.filter(x=>x.source!=='obsidian').length}\n- **Portraits :** ${people.filter(x=>x.assetId).length}\n- **Export réalisé :** ${exportedAt.toLocaleString('fr-FR')}\n\n> Les PNJ préparés mais absents ne sont pas exportés. Les simples mentions restent dans la session.\n`;
 addText(`98 - Archives/Imports Kentaro/Wonq/${base} - Import ${stamp}.md`,receipt,'receipt','rename');
 const manifest={schema:'kentaro.obsidian-import',version:4,createdAt:new Date().toISOString(),vaultHint:'DND',importer:{id:'kentaro-session-importer',minimumVersion:'1.3.0'},source:{character:'Wonq',characterId:'wonq',knowledgeScope:'character',doNotPropagateTo:['Kentaro']},session:{id:session.id||'',date:session.date||isoDate(),title:session.title||'Session de Wonq',note:base},routes,personUpdates};
 files.unshift({path:'_kentaro-import.json',text:JSON.stringify(manifest,null,2)},{path:'LIRE AVANT IMPORT.md',text:`# Import Wonq pour Obsidian\n\nDans Obsidian, lance la commande **Importer une session Kentaro** ou touche l’icône lune. Le même importeur classe ici un paquet provenant de Wonq.\n\nSélectionne ce ZIP, vérifie l’aperçu puis confirme. Le plugin classe automatiquement la session, les fiches PNJ, les portraits et le reçu d’import dans le coffre actif.\n\nLe traitement est local et aucune fiche PNJ existante n’est écrasée.\n`});
 return{blob:await makeZip(files),name:`Wonq - ${base}.zip`,count:routes.length,manifest}
}
async function exportObsidian(session=data.active){
 const pkg=await buildObsidianPackage(session);
 downloadBlob(pkg.blob,pkg.name);api.log(`↓ Paquet Obsidian prêt : ${session.title}.`);notify(`ZIP prêt · ${pkg.count} fichiers ✓`)
}
function hidePreview(){preview.hidden=true;q('#previewMarkdown').textContent='Aperçu'}
function showPreview(){const md=sessionMarkdown(data.active);preview.hidden=false;$('pre',preview).textContent=md;q('#previewMarkdown').textContent='Replier l’aperçu';preview.scrollIntoView({behavior:'smooth',block:'nearest'});return md}
q('#previewMarkdown').onclick=()=>preview.hidden?showPreview():hidePreview();q('#collapseMarkdown').onclick=hidePreview;q('#copyMarkdown').onclick=e=>copyText($('pre',preview).textContent,e.currentTarget);
q('#setupObsidian').onclick=()=>q('#obsidianSetup').showModal();
const exportButton=q('#exportObsidian');let exportBusy=false,exportResetTimer=0;
function resetExportButton(){exportBusy=false;clearTimeout(exportResetTimer);exportButton.removeAttribute('aria-busy');exportButton.textContent='1 · Télécharger'}
exportButton.onclick=async()=>{if(exportBusy)return;exportBusy=true;exportButton.setAttribute('aria-busy','true');exportButton.textContent='Préparation…';exportResetTimer=setTimeout(resetExportButton,8000);try{await exportObsidian()}catch(error){alert(`Export impossible : ${error.message}`)}finally{resetExportButton()}};
window.addEventListener('pageshow',resetExportButton);document.addEventListener('visibilitychange',()=>{if(!document.hidden)resetExportButton()});
q('#openObsidian').onclick=()=>{resetExportButton();window.location.href='obsidian://open?vault=DND'};
q('#closeSession').onclick=()=>{if(!confirm('Clore cette session ? Elle restera exportable dans les archives.'))return;const closed={...clone(data.active),endedAt:new Date().toISOString(),mechanical:activeMechanical(data.active),peopleSnapshot:clone(touchedPeople(data.active))};data.archives.unshift(closed);data.archives=data.archives.slice(0,40);api.log(`☷ Session archivée : ${closed.title}`);data.active=blank(journal().length);preview.hidden=true;persist();render();notify('Nouvelle session ouverte ✓')};
q('#archiveList').onclick=async e=>{const copy=e.target.closest('[data-copy-archive]'),exportBtn=e.target.closest('[data-export-archive]'),deleteBtn=e.target.closest('[data-delete-archive]');if(copy){const session=data.archives[Number(copy.dataset.copyArchive)];copyText(sessionMarkdown(session),copy)}if(exportBtn){exportBtn.disabled=true;try{await exportObsidian(data.archives[Number(exportBtn.dataset.exportArchive)])}finally{exportBtn.disabled=false}}if(deleteBtn){const index=Number(deleteBtn.dataset.deleteArchive),session=data.archives[index];if(!session)return;if(!confirm(`Supprimer définitivement « ${session.title} » des archives locales ?\n\nCette action ne supprime pas les fichiers déjà importés dans Obsidian.`))return;data.archives.splice(index,1);persist();renderArchives();notify('Session archivée supprimée ✓')}};

const wonqMechanicalLog=document.querySelector('#timeline');
if(wonqMechanicalLog)new MutationObserver(()=>{if(!q('#sessionCount'))return;q('#sessionCount').textContent=`${data.active.entries.length} repère${data.active.entries.length>1?'s':''} · ${activeMechanical(data.active).length} événements mécaniques`}).observe(wonqMechanicalLog,{childList:true,subtree:true});
window.WonqSessionJournal={renderJournal:()=>{},exportObsidian,buildObsidianPackage,getData:()=>clone(data),selectView:selectJournalView};

const style=document.createElement('style');style.textContent=`
/* Kentaro's session module originally inherits Kentaro's global form/button skin.
   Wonq does not have that generic skin, so keep it scoped to this journal. */
.session-desk button,.session-dialog button{
 -webkit-appearance:none;appearance:none;min-height:44px;padding:9px 12px;
 border:1px solid #4a4651;border-radius:10px;
 background:linear-gradient(180deg,#29242c,#17171d);
 color:#f3e8d8;font:inherit;font-weight:750;line-height:1.15;
 box-shadow:inset 0 1px #ffffff0a,0 2px 8px #0003;
 cursor:pointer;touch-action:manipulation
}
.session-desk button:hover,.session-dialog button:hover{border-color:#6d625c;background:linear-gradient(180deg,#322b34,#1c1a21)}
.session-desk button:active,.session-dialog button:active{transform:translateY(1px);background:#18171c}
.session-desk button:focus-visible,.session-dialog button:focus-visible,
.session-desk input:focus-visible,.session-desk select:focus-visible,.session-desk textarea:focus-visible,
.session-dialog input:focus-visible,.session-dialog select:focus-visible,.session-dialog textarea:focus-visible{
 outline:2px solid #79aaa1;outline-offset:2px
}
.session-desk button:disabled,.session-dialog button:disabled{opacity:.42;cursor:not-allowed}
.session-desk .btn-gold,.session-dialog .btn-gold{
 border-color:#a47d49;background:linear-gradient(180deg,#76522b,#49311d);
 color:#ffe7b7;box-shadow:inset 0 1px #ffe5aa18,0 0 16px #a66f2c18
}
.session-desk .btn-gold:hover,.session-dialog .btn-gold:hover{background:linear-gradient(180deg,#855e32,#533720)}
.session-desk .utility-danger,.session-dialog .utility-danger{
 border-color:#77474f!important;background:linear-gradient(180deg,#3d2229,#24161b)!important;color:#e5b2ba!important
}
.session-desk input,.session-desk select,.session-desk textarea,
.session-dialog input,.session-dialog select,.session-dialog textarea{
 -webkit-appearance:none;appearance:none;color-scheme:dark;font:inherit
}
.session-desk select,.session-dialog select{background-color:#090a0e;color:#eee4d7}
.session-desk select option,.session-dialog select option{background:#101116;color:#eee4d7}
.session-dialog input[type="file"]{padding:6px}
.session-dialog input[type="file"]::file-selector-button{
 -webkit-appearance:none;appearance:none;margin-right:9px;padding:8px 10px;
 border:1px solid #5a5151;border-radius:8px;background:#252127;color:#eee2d2;font:inherit;font-weight:700
}

.journal-subtabs{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:0 0 11px;padding:5px;border:1px solid #3c3838;border-radius:13px;background:#0c0d11}.journal-subtabs button{min-height:44px;border:1px solid transparent;border-radius:9px;background:transparent;color:#a9a098;overflow:hidden}.journal-subtabs button.active{border:1px solid #8d6841;border-radius:9px;background:linear-gradient(135deg,#50351f,#2b2024);color:#ffe8bf;box-shadow:inset 0 1px #ffffff12}.journal-pane[hidden]{display:none!important}.session-desk{display:grid;gap:11px}.session-head{display:flex;align-items:end;justify-content:space-between;gap:12px;padding:15px;border:1px solid #59493f;border-radius:15px;background:radial-gradient(circle at 90% 0,#a66d3424,transparent 34%),linear-gradient(145deg,#21181a,#0e1015)}.session-kicker,.capture-copy b,.session-timeline header span,.session-notes>span,.social-shortcuts>span,.people-card header span,.session-export>div>span{display:block;color:#d0a268;font-size:.64rem;letter-spacing:.14em;text-transform:uppercase}.session-head input[type="text"],#sessionTitle{width:min(600px,62vw);padding:3px 0;border:0;border-bottom:1px solid #554a43;border-radius:0;background:transparent;color:#f3e7d6;font:700 1.25rem Georgia,serif}.session-meta{display:flex;align-items:center;gap:9px}.session-meta input{min-height:40px;padding:7px;border:1px solid #45454c;border-radius:9px;background:#0b0c10;color:#e9dfd2}.session-meta span{color:#8e8881;font-size:.68rem;white-space:nowrap}.capture-card,.session-timeline,.session-side,.people-card,.session-export{border:1px solid #393a42;border-radius:14px;background:linear-gradient(155deg,#18171c,#0e0f13)}.capture-card{display:grid;grid-template-columns:auto 1fr;gap:8px 14px;padding:12px}.capture-copy small{display:block;color:#8e8880;font-size:.68rem}.session-capture{display:grid;grid-template-columns:120px 1fr auto auto;gap:6px}.pnj-capture-context{grid-column:1/-1;display:grid;grid-template-columns:1fr 160px;gap:6px}.pnj-capture-context[hidden]{display:none!important}.session-capture select,.session-capture input{min-height:44px;padding:8px;border:1px solid #42434b;border-radius:9px;background:#090a0e;color:#eee4d7}.session-capture button{min-height:44px}.entry-filters{grid-column:1/-1;display:flex;gap:5px;overflow:auto;padding-top:2px;scrollbar-width:none}.entry-filters::-webkit-scrollbar{display:none}.entry-filters button{min-height:34px;padding:5px 9px;white-space:nowrap;border-radius:999px;background:#111217;color:#99918b}.entry-filters button.active{border-color:#906d45;color:#f1d6a7;background:#2d211b}.session-main-grid{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(260px,.65fr);gap:11px}.session-timeline,.session-side,.people-card{padding:13px}.session-timeline header,.people-card>header{display:flex;align-items:start;justify-content:space-between;gap:10px}.session-timeline h3,.people-card h3{margin:3px 0;color:#f0e4d2;font:700 1.05rem Georgia,serif}.session-timeline header strong{color:#8f8982;font-size:.68rem}.session-timeline #entryList{display:grid;gap:6px;margin-top:10px;max-height:530px;overflow:auto;padding-right:3px}.timeline-entry{display:grid;grid-template-columns:10px 1fr auto;gap:8px;align-items:start;padding:9px;border:1px solid #30313a;border-radius:10px;background:#0b0c10}.entry-dot{width:8px;height:8px;margin-top:6px;border-radius:50%;background:#bd754d;box-shadow:0 0 10px #bd754d66}.timeline-entry small{color:#b08d64;font-size:.62rem;text-transform:uppercase}.timeline-entry p{margin:3px 0 0;color:#e6ddd1;line-height:1.4}.timeline-entry>div:last-child{display:flex;gap:4px}.timeline-entry button{min-width:35px;min-height:35px;padding:4px;color:#a99e93;background:#14151a}.session-side{display:grid;align-content:start;gap:13px}.session-notes textarea{display:block;width:100%;min-height:230px;margin-top:6px;padding:10px;border:1px solid #3e3f47;border-radius:10px;background:#090a0e;color:#eee5d9;line-height:1.5;resize:vertical}.session-notes small{color:#817b75;font-size:.65rem}.social-shortcuts{padding-top:11px;border-top:1px solid #302f35}.social-shortcuts>div{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-top:7px}.social-shortcuts button{min-height:42px;padding:7px;text-align:left;background:#121218;color:#cfc2b1}.people-card>header p{margin:2px 0;color:#8c8680;font-size:.7rem}.people-card>header>div:last-child{display:flex;gap:6px}.people-card button{min-height:40px}.people-list{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:11px}.person-card{display:grid;grid-template-columns:54px 1fr;gap:9px;padding:9px;border:1px solid #333640;border-radius:11px;background:#0b0d12;min-width:0}.person-avatar{display:grid;place-items:center;width:54px;height:54px;overflow:hidden;border:1px solid #6b5540;border-radius:10px;background:linear-gradient(145deg,#50301f,#252b40);color:#f0d6a9;font-size:1.2rem;font-weight:800}.person-avatar img{width:100%;height:100%;object-fit:cover}.person-card>div:nth-child(2){min-width:0}.person-card b,.person-card small,.person-card p,.person-card span{display:block}.person-card small{color:#bc9464}.person-card p{overflow:hidden;margin:3px 0;color:#948d85;font-size:.69rem;text-overflow:ellipsis;white-space:nowrap}.person-card span{min-height:15px;color:#a68a6f;font-size:.6rem}.person-card footer{grid-column:1/-1;display:grid;grid-template-columns:1fr auto;gap:5px}.person-card footer button{min-height:36px;padding:5px 7px}.person-card footer button.active{border-color:#8b6742;color:#efd3a5;background:#2d2019}.session-export{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:12px 14px;border-color:#66533e;background:radial-gradient(circle at 6% 50%,#a76b2b20,transparent 32%),linear-gradient(145deg,#1d1718,#0d0f13)}.session-export>div:first-child{display:grid;gap:2px}.session-export b{color:#eee1ce}.session-export small{color:#8f8780}.session-export>div:last-child{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}.session-export button{min-height:42px}.session-close{border-color:#70443f!important;color:#ddb1a9!important}.session-preview{padding:12px;border:1px solid #403e45;border-radius:12px;background:#090a0e}.session-preview header{display:flex;align-items:center;justify-content:space-between}.session-preview pre{max-height:460px;overflow:auto;white-space:pre-wrap;color:#d9d0c5;font:500 .74rem/1.5 ui-monospace,monospace}.session-archives{padding:10px 2px;border-top:1px solid #302e33}.session-archives summary{cursor:pointer;color:#baa992}.session-archives article{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;padding:8px 0;border-bottom:1px solid #2d2c31}.session-archives article small{display:block;color:#857e77}.archive-actions{display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-end}.archive-actions .archive-delete{border-color:#754247;color:#e6a7ad}.archive-actions .archive-delete:hover{background:#2a1519}.session-empty{padding:22px;border:1px dashed #3b3d45;border-radius:10px;color:#8f8982;text-align:center}.session-dialog{width:min(650px,calc(100% - 20px));max-height:92vh;overflow:auto;padding:17px;border:1px solid #806648;border-radius:16px;background:#141419;color:#f2e8da;box-shadow:0 30px 90px #000}.session-dialog::backdrop{background:#020305db;backdrop-filter:blur(6px)}.session-dialog header{display:flex;align-items:center;justify-content:space-between}.session-dialog label{display:block;margin:9px 0;color:#aaa29a}.session-dialog input,.session-dialog select,.session-dialog textarea{display:block;width:100%;min-height:44px;margin-top:5px;padding:9px;border:1px solid #41434c;border-radius:9px;background:#090a0e;color:#f1e8dc}.session-dialog textarea{min-height:110px;resize:vertical}.dialog-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.portrait-field small{display:block;margin-top:5px;color:#807a74}.dialog-actions{display:flex;gap:7px;margin-top:13px}.session-toast{position:fixed;right:18px;bottom:84px;z-index:10010;transform:translateY(12px);padding:10px 13px;border:1px solid #8b6942;border-radius:9px;background:#181217;color:#efd9b1;opacity:0;pointer-events:none;transition:.18s}.session-toast.show{transform:none;opacity:1}
.session-dialog input,.session-dialog select,.session-dialog textarea{min-width:0}.portrait-field small,.export-card-check small{display:block;margin-top:5px;color:#807a74}.export-card-check{display:grid!important;grid-template-columns:auto 1fr;gap:0 8px;align-items:center;padding:9px;border:1px solid #343740;border-radius:9px}.export-card-check input{grid-row:1/3;width:22px!important;min-height:22px!important;margin:0!important}.export-card-check span{color:#d8ccbd}.obsidian-setup ol{display:grid;gap:9px;padding-left:22px;color:#d8cdbf;line-height:1.45}.obsidian-setup p{padding:10px;border:1px solid #383a43;border-radius:9px;background:#0b0c10;color:#9f978f;line-height:1.45}.obsidian-setup code{color:#edc78e}.obsidian-setup form>.btn-gold{width:100%;min-height:44px}.session-preview header{gap:10px}.session-preview-actions{display:flex;gap:6px}
@media(max-width:900px){.session-main-grid{grid-template-columns:1fr}.session-notes textarea{min-height:150px}.people-list{grid-template-columns:1fr 1fr}.session-head input[type="text"],#sessionTitle{width:55vw}}
@media(max-width:520px){
 .session-capture{grid-template-columns:1fr!important}
 .session-capture>select,.session-capture>input,.session-capture>button,.pnj-capture-context{grid-column:1/-1!important;width:100%}
 .social-shortcuts>div{grid-template-columns:1fr!important}
 .people-card>header>div:last-child{grid-template-columns:1fr!important}
 .session-export>div:last-child{grid-template-columns:1fr!important}
 .session-export .session-close{grid-column:1!important}
 .session-meta{align-items:stretch;flex-direction:column}
 .session-meta input{width:100%}
}
@media(max-width:767px){.journal-subtabs{position:sticky;top:201px;z-index:25}.session-head{align-items:stretch;flex-direction:column;padding:12px}.session-head input[type="text"],#sessionTitle{width:100%;min-height:44px}.session-meta{justify-content:space-between}.capture-card{grid-template-columns:1fr;padding:10px}.session-capture{grid-template-columns:105px 1fr}.pnj-capture-context{grid-template-columns:1fr}.session-capture button{grid-column:auto}.session-capture #cancelEntryEdit{grid-column:1/-1}.session-main-grid{display:block}.session-timeline,.session-side,.people-card{padding:10px;margin-bottom:9px}.session-timeline #entryList{max-height:none}.social-shortcuts>div{grid-template-columns:1fr 1fr}.people-card>header{align-items:stretch;flex-direction:column}.people-card>header>div:last-child{display:grid;grid-template-columns:1fr 1fr}.people-list{grid-template-columns:1fr}.session-export{align-items:stretch;flex-direction:column}.session-export>div:last-child{display:grid;grid-template-columns:1fr 1fr}.session-export .session-close{grid-column:1/-1}.session-archives article{grid-template-columns:1fr}.archive-actions{justify-content:stretch}.archive-actions button{flex:1 1 90px}.dialog-grid{grid-template-columns:1fr}.session-toast{right:10px;bottom:75px;max-width:calc(100% - 20px)}}
`;document.head.appendChild(style);save();render();if(importedRosterCount)notify(`${importedRosterCount} PNJ préparé${importedRosterCount>1?'s':''} depuis Obsidian ✓`);
})();
