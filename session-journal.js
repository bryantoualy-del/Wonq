/* Wonq — Carnet de session & export Obsidian
   Une seule source de vérité : les notes du beau carnet sont les notes de session.
   Toutes les connaissances sont cloisonnées au personnage Wonq par défaut. */
(()=>{
'use strict';

const SJ_CHARACTER={id:'wonq',name:'Wonq'};
const SJ_SCHEMA='wonq-session-journal-v2';
const SJ_EXTRA_CATEGORIES=[
 {id:'event',name:'Événements',color:'#9ab4a8'},
 {id:'items',name:'Objets',color:'#c69b67'},
 {id:'factions',name:'Factions',color:'#a98ab8'}
];
const SJ_PROMOTABLE=new Set(['people','places','quest','items','factions']);
let sjSelectedSessionId=null;

const sjUid=()=>{try{return crypto.randomUUID()}catch(e){return 'sj-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9)}};
const sjNow=()=>new Date().toISOString();
const sjClone=o=>o==null?o:JSON.parse(JSON.stringify(o));
const sjDate=iso=>{const d=iso?new Date(iso):new Date();return d.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric'})};
const sjTime=iso=>{const d=iso?new Date(iso):new Date();return d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})};
const sjIsoDate=iso=>{const d=iso?new Date(iso):new Date(),y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return y+'-'+m+'-'+day};
const sjSlug=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[\\/:*?"<>|]/g,' ').replace(/\s+/g,' ').trim().slice(0,110)||'Sans titre';
const sjYaml=s=>'"'+String(s??'').replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/\r?\n/g,' ')+'"';
const sjCat=id=>S.noteCategories.find(c=>c.id===id)||{id:id,name:'Sans catégorie',color:'#777'};
const sjMapEventCategory=id=>({npc:'people',place:'places',quest:'quest',clue:'clues',item:'items',faction:'factions',memory:'memory',event:'event'}[id]||'event');

function sjEnsureState(){
 if(!Array.isArray(S.playSessions))S.playSessions=[];
 if(typeof S.activePlaySessionId!=='string')S.activePlaySessionId='';
 if(!Array.isArray(S.personalNotes))S.personalNotes=[];
 if(!Array.isArray(S.noteCategories))S.noteCategories=[];
 SJ_EXTRA_CATEGORIES.forEach(c=>{if(!S.noteCategories.some(x=>x.id===c.id))S.noteCategories.push(sjClone(c))});
 S.playSessions.forEach(x=>{
  if(!x.id)x.id=sjUid();
  if(!x.characterId)x.characterId='wonq';
  if(!x.status)x.status=x.endedAt?'ended':'active';
 });
 if(S.activePlaySessionId&&!S.playSessions.some(x=>x.id===S.activePlaySessionId&&x.status==='active'))S.activePlaySessionId='';

 // Migration from the first Session prototype: old session events become notebook notes once.
 if(Array.isArray(S.sessionEvents)&&S.sessionEvents.length){
  S.sessionEvents.filter(e=>!e.deleted&&!S.personalNotes.some(n=>n.migratedSessionEventId===e.id)).forEach(e=>{
   S.personalNotes.push({
    id:sjUid(),title:e.title||'',body:e.body||'',category:sjMapEventCategory(e.category),
    tags:'',favorite:false,session:sjIsoDate(e.createdAt),sessionId:e.sessionId||'',
    created:e.createdAt||sjNow(),updated:e.updatedAt||e.createdAt||sjNow(),deleted:false,
    knownBy:['wonq'],sharedWithParty:!!e.sharedWithParty,promoted:e.promoted||null,
    migratedSessionEventId:e.id
   });
  });
 }

 // Old personal notes are preserved and grouped into an archive session instead of becoming orphaned.
 const legacy=S.personalNotes.filter(n=>!n.sessionId);
 if(legacy.length){
  let archive=S.playSessions.find(x=>x.id==='wonq-legacy-notes');
  if(!archive){
   const first=legacy.map(n=>n.updated||n.created).filter(Boolean).sort()[0]||sjNow();
   archive={id:'wonq-legacy-notes',title:'Carnet antérieur de Wonq',characterId:'wonq',startedAt:first,endedAt:first,status:'ended',schema:SJ_SCHEMA};
   S.playSessions.push(archive);
  }
  legacy.forEach(n=>n.sessionId=archive.id);
 }

 S.personalNotes.forEach(n=>{
  if(!n.created)n.created=n.updated||sjNow();
  if(!n.updated)n.updated=n.created;
  if(!Array.isArray(n.knownBy)||!n.knownBy.length)n.knownBy=['wonq'];
  if(!n.knownBy.includes('wonq'))n.knownBy.unshift('wonq');
  if(typeof n.sharedWithParty!=='boolean')n.sharedWithParty=false;
 });
 if(!sjSelectedSessionId){
  sjSelectedSessionId=S.activePlaySessionId||(S.playSessions.slice().sort((a,b)=>String(b.startedAt).localeCompare(String(a.startedAt)))[0]?.id||null);
 }
}

function sjSession(id){return S.playSessions.find(x=>x.id===id)||null}
function sjActive(){return sjSession(S.activePlaySessionId)}
function sjCurrent(){return sjSession(sjSelectedSessionId)||sjActive()||S.playSessions.slice().sort((a,b)=>String(b.startedAt).localeCompare(String(a.startedAt)))[0]||null}
function sjNotes(sessionId,deleted){
 return S.personalNotes.filter(n=>n.sessionId===sessionId&&!!n.deleted===!!deleted);
}
function sjNotify(title,text){try{showRibbon(title,text)}catch(e){}}

function sjInstall(){
 document.getElementById('session')?.remove();
 document.querySelector('.nav [data-view="session"]')?.remove();

 if(!document.getElementById('quickSessionEvent')){
  const b=document.createElement('button');
  b.id='quickSessionEvent';b.type='button';b.className='session-fab';
  b.innerHTML='<span>✎</span><b>Note</b>';
  b.onclick=()=>sjQuickNote();
  document.body.appendChild(b);
 }
 if(!document.getElementById('sessionStateQuick')){
  const b=document.createElement('button');
  b.id='sessionStateQuick';b.type='button';b.className='state clickable session-state-pill';
  const bar=document.querySelector('.statebar');if(bar)bar.appendChild(b);
  b.onclick=()=>sjOpenJournal();
 }
 sjUpdatePill();
}
function sjUpdatePill(){
 const b=document.getElementById('sessionStateQuick');if(!b)return;
 const a=sjActive();
 b.classList.toggle('on',!!a);
 b.textContent=a?'Session · '+a.title:'Session · aucune';
 b.title=a?'Session active de Wonq — '+a.title:'Démarrer une session de Wonq';
}
function sjOpenJournal(){
 document.querySelectorAll('.nav button').forEach(x=>x.classList.toggle('active',x.dataset.view==='journal'));
 document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id==='journal'));
 journalTab='notes';enhanceJournal();scrollTo({top:0,behavior:'smooth'});
}

function sjStartSession(openNoteAfter){
 openEditor('Démarrer une session',
  '<label>Nom de la session<input class="number" name="title" value="Session Wonq — '+esc(sjDate())+'" required></label>'+
  '<p class="meta">Cette session appartient au point de vue de <b>Wonq</b>. Elle ne transmet aucune connaissance à Kentaro.</p>'+
  '<button class="primary teal" value="save">Démarrer</button>',
  fd=>{
   const old=sjActive();if(old){old.status='ended';old.endedAt=sjNow()}
   const x={id:sjUid(),title:String(fd.get('title')||'Session Wonq').trim(),characterId:'wonq',startedAt:sjNow(),endedAt:null,status:'active',schema:SJ_SCHEMA};
   S.playSessions.push(x);S.activePlaySessionId=x.id;sjSelectedSessionId=x.id;save();enhanceJournal();sjUpdatePill();sjNotify('Session démarrée',x.title);
   if(openNoteAfter)setTimeout(()=>sjEditNote(null,x.id,true),80);
  }
 );
}
function sjEndSession(){
 const a=sjActive();if(!a)return;
 if(!confirm('Terminer la session « '+a.title+' » ? Les notes restent dans le carnet.'))return;
 a.status='ended';a.endedAt=sjNow();S.activePlaySessionId='';sjSelectedSessionId=a.id;save();enhanceJournal();sjUpdatePill();sjNotify('Session terminée',a.title);
}
function sjDeleteSession(id){
 const s=sjSession(id);if(!s)return;
 if(!confirm('Supprimer cette session et toutes ses notes de cet appareil ?'))return;
 S.playSessions=S.playSessions.filter(x=>x.id!==id);
 S.personalNotes=S.personalNotes.filter(n=>n.sessionId!==id);
 if(S.activePlaySessionId===id)S.activePlaySessionId='';
 sjSelectedSessionId=S.activePlaySessionId||S.playSessions[0]?.id||null;
 save();enhanceJournal();sjUpdatePill();
}
function sjQuickNote(){
 sjEnsureState();
 const a=sjActive();
 if(!a){sjStartSession(true);return}
 sjSelectedSessionId=a.id;sjEditNote(null,a.id,true);
}

function sjEditNote(id,sessionId,focusBody){
 const existing=S.personalNotes.find(x=>x.id===id);
 const current=sjSession(sessionId)||sjCurrent()||sjActive();
 if(!existing&&!current){sjStartSession(true);return}
 const n=sjClone(existing||{
  id:sjUid(),title:'',body:'',category:'event',tags:'',favorite:false,
  session:sjIsoDate(current.startedAt),sessionId:current.id,created:sjNow(),updated:sjNow(),
  deleted:false,knownBy:['wonq'],sharedWithParty:false,promoted:null
 });
 const sessions=S.playSessions.slice().sort((a,b)=>String(b.startedAt).localeCompare(String(a.startedAt)));
 const sessionOptions=sessions.map(s=>'<option value="'+s.id+'" '+(n.sessionId===s.id?'selected':'')+'>'+esc(s.title)+'</option>').join('');
 const promoteAllowed=SJ_PROMOTABLE.has(n.category);
 openEditor(n.deleted?'Souvenir effacé':'Écrire dans le carnet',
  '<label>Titre<input class="number" name="title" value="'+esc(n.title)+'" placeholder="Ex. Un nom dans la fumée"></label>'+
  '<label>Catégorie<select name="category">'+S.noteCategories.map(c=>'<option value="'+c.id+'" '+(c.id===n.category?'selected':'')+'>'+esc(c.name)+'</option>').join('')+'</select></label>'+
  '<label>Session<select name="sessionId">'+sessionOptions+'</select></label>'+
  '<label>Note<textarea class="note-editor" name="body" placeholder="Ce que Wonq veut garder…">'+esc(n.body)+'</textarea></label>'+
  '<label>Étiquettes<input class="number" name="tags" value="'+esc(n.tags||'')+'" placeholder="séparées par des virgules"></label>'+
  '<label class="toggle"><input type="checkbox" name="shared" '+(n.sharedWithParty?'checked':'')+'> Wonq a partagé cette information au groupe</label>'+
  '<label class="toggle"><input type="checkbox" name="favorite" '+(n.favorite?'checked':'')+'> Favori</label>'+
  '<p class="meta">Connu par <b>Wonq</b>. Même partagé au groupe, cette note ne devient jamais automatiquement une connaissance de Kentaro.</p>'+
  '<div class="row"><button class="primary teal" value="save">Terminer</button><button class="ability" id="sjToggleNoteDelete" type="button">'+(n.deleted?'Restaurer':'Placer dans la corbeille')+'</button>'+(promoteAllowed?'<button class="ability" id="sjPromoteNote" type="button">'+(n.promoted?'Fiche préparée ✓':'Préparer fiche')+'</button>':'')+'</div>'+
  '<p class="meta" id="autoSaveState">Sauvegarde automatique sur cet appareil</p>',
  fd=>sjPersistNote(n,fd,true),
  form=>{
   let timer;
   const autosave=()=>{clearTimeout(timer);timer=setTimeout(()=>{sjPersistNote(n,new FormData(form),false);const x=document.getElementById('autoSaveState');if(x)x.textContent='Enregistré sur cet appareil'},180)};
   form.oninput=autosave;form.onchange=autosave;
   document.getElementById('sjToggleNoteDelete').onclick=()=>{n.deleted=!n.deleted;sjPersistNote(n,new FormData(form),false);document.getElementById('wonqEditor').close();enhanceJournal()};
   const p=document.getElementById('sjPromoteNote');if(p)p.onclick=()=>{sjPersistNote(n,new FormData(form),false);sjPromoteNote(n.id)};
   if(focusBody)setTimeout(()=>form.querySelector('[name="body"]')?.focus(),60);
  }
 );
}
function sjPersistNote(n,fd,rerender){
 const sid=String(fd.get('sessionId')||n.sessionId||sjActive()?.id||'');
 const session=sjSession(sid);
 Object.assign(n,{
  title:String(fd.get('title')||''),body:String(fd.get('body')||''),category:String(fd.get('category')||'event'),
  tags:String(fd.get('tags')||''),favorite:fd.has('favorite'),sharedWithParty:fd.has('shared'),
  sessionId:sid,session:session?sjIsoDate(session.startedAt):(n.session||sjIsoDate()),knownBy:['wonq'],updated:sjNow()
 });
 if(!n.created)n.created=n.updated;
 const i=S.personalNotes.findIndex(x=>x.id===n.id);i<0?S.personalNotes.push(sjClone(n)):S.personalNotes[i]=sjClone(n);
 save();if(rerender)enhanceJournal();
}
function sjPromoteNote(id){
 const n=S.personalNotes.find(x=>x.id===id);if(!n||!SJ_PROMOTABLE.has(n.category))return;
 const proposed=n.promoted?.name||n.title||n.body.slice(0,70);
 openEditor(n.promoted?'Modifier la fiche préparée':'Préparer une fiche',
  '<label>Nom de la fiche<input class="number" name="name" value="'+esc(proposed)+'" required></label>'+
  '<p class="meta">Cette fiche restera une <b>connaissance de Wonq</b>, séparée d’une éventuelle fiche canonique ou connue de Kentaro.</p>'+
  '<button class="primary teal" value="save">'+(n.promoted?'Mettre à jour':'Préparer la fiche')+'</button>',
  fd=>{n.promoted={kind:n.category,name:String(fd.get('name')||'').trim(),createdAt:n.promoted?.createdAt||sjNow(),updatedAt:sjNow()};n.updated=sjNow();save();enhanceJournal();sjNotify('Fiche préparée',n.promoted.name)}
 );
}

function sjRenderJournal(){
 sjEnsureState();sjInstall();
 const view=document.getElementById('journal'),grid=view?.querySelector(':scope > .grid');if(!grid)return;
 let controls=document.getElementById('journalModeTabs');
 if(!controls){controls=document.createElement('div');controls.id='journalModeTabs';controls.className='social-tabs';grid.before(controls)}
 controls.innerHTML=
  '<button class="ability '+(journalTab==='notes'?'on':'')+'" data-journal-mode="notes">Carnet de session</button>'+
  '<button class="ability '+(journalTab==='history'?'on':'')+'" data-journal-mode="history">Historique automatique</button>'+
  '<button class="ability '+(journalTab==='trash'?'on':'')+'" data-journal-mode="trash">Corbeille</button>';
 controls.querySelectorAll('[data-journal-mode]').forEach(b=>b.onclick=()=>{journalTab=b.dataset.journalMode;sjRenderJournal()});

 let notes=document.getElementById('personalNotebook');
 if(!notes){notes=document.createElement('div');notes.id='personalNotebook';grid.before(notes)}
 grid.hidden=journalTab!=='history';notes.hidden=journalTab==='history';
 if(journalTab==='history')return;

 const sessions=S.playSessions.slice().sort((a,b)=>String(b.startedAt).localeCompare(String(a.startedAt)));
 if(sjSelectedSessionId&&!sjSession(sjSelectedSessionId))sjSelectedSessionId=sjActive()?.id||sessions[0]?.id||null;
 const current=sjCurrent(),deleted=journalTab==='trash';
 const sessionTabs=sessions.map(s=>'<button class="state '+(current?.id===s.id?'on':'')+'" data-sj-session="'+s.id+'">'+esc(s.title)+(s.status==='active'?' · active':'')+'</button>').join('');

 if(!current){
  notes.innerHTML='<article class="panel full"><div class="journal-head"><div><div class="eyebrow">Les traces que l’on garde</div><h2>Journal du voyage</h2></div><div class="journal-tools"><button class="primary teal" id="sjStartSession">Démarrer une session</button></div></div><div class="empty">Le carnet attend sa première session.</div></article>';
  document.getElementById('sjStartSession').onclick=()=>sjStartSession(false);return;
 }

 const list=sjNotes(current.id,deleted)
  .filter(n=>(n.title+' '+n.body+' '+(n.tags||'')).toLowerCase().includes(noteSearch.toLowerCase())&&(!noteFilter||noteFilter==='favorite'&&n.favorite||noteFilter===n.category))
  .sort((a,b)=>(b.favorite-a.favorite)||String(b.updated).localeCompare(String(a.updated)));

 const cards=list.map(n=>
  '<button class="personal-note" data-note="'+n.id+'">'+
   '<strong>'+(n.favorite?'★ ':'')+esc(n.title||'Sans titre')+'</strong>'+
   '<small>'+esc(sjCat(n.category).name)+' · '+esc(sjTime(n.created||n.updated))+(n.sharedWithParty?' · partagé':'')+'</small>'+
   '<p>'+esc((n.body||'').slice(0,150))+'</p>'+
   (n.promoted?'<span class="sj-card-mark">Fiche Wonq ✓</span>':'')+
  '</button>'
 ).join('')||'<div class="empty">'+(deleted?'Aucune note dans la corbeille.':'Cette session attend sa première note.')+'</div>';

 const active=sjActive(),isActive=current.id===active?.id;
 notes.innerHTML=
 '<article class="panel full">'+
  '<div class="journal-head"><div><div class="eyebrow">Les traces que l’on garde</div><h2>'+(deleted?'Souvenirs effacés':'Journal du voyage')+'</h2></div>'+
   '<div class="journal-tools">'+
    (isActive&&!deleted?'<button class="ability" id="sjEndSession">Terminer</button>':'')+
    (!active&&!deleted?'<button class="ability" id="sjStartSession">Nouvelle session</button>':'')+
    (!deleted?'<button class="ability" id="sjExportSession">Exporter Obsidian</button>':'')+
    '<button class="ability" id="sjBackup">Sauvegarde JSON</button>'+
   '</div></div>'+
  '<div class="sj-session-tabs">'+sessionTabs+'</div>'+
  '<div class="sj-book-head"><div><div class="eyebrow">'+esc(sjDate(current.startedAt))+' · point de vue Wonq</div><h3>'+esc(current.title)+'</h3><p class="meta">'+(current.status==='active'?'Session en cours':'Session archivée')+' · '+sjNotes(current.id,false).length+' note'+(sjNotes(current.id,false).length>1?'s':'')+'</p></div>'+
   '<div class="row">'+(!deleted?'<button class="primary teal" id="newPersonalNote">✎ Nouvelle note</button>':'')+'<button class="ability" id="sjDeleteSession">Supprimer session</button></div></div>'+
  '<input id="personalNoteSearch" type="search" placeholder="Chercher un nom, un indice…" value="'+esc(noteSearch)+'">'+
  '<div class="note-filters"><button class="state '+(!noteFilter?'on':'')+'" data-note-filter="">Toutes</button><button class="state '+(noteFilter==='favorite'?'on':'')+'" data-note-filter="favorite">★ Favoris</button>'+
   S.noteCategories.map(c=>'<button class="state '+(noteFilter===c.id?'on':'')+'" data-note-filter="'+c.id+'" style="border-color:'+c.color+'">'+esc(c.name)+'</button>').join('')+
  '</div><div class="note-grid">'+cards+'</div>'+
 '</article>';

 document.getElementById('sjStartSession')?.addEventListener('click',()=>sjStartSession(false));
 document.getElementById('sjEndSession')?.addEventListener('click',sjEndSession);
 document.getElementById('newPersonalNote')?.addEventListener('click',()=>sjEditNote(null,current.id,true));
 document.getElementById('sjExportSession')?.addEventListener('click',()=>sjExportSession(current.id));
 document.getElementById('sjBackup')?.addEventListener('click',sjBackupJSON);
 document.getElementById('sjDeleteSession')?.addEventListener('click',()=>sjDeleteSession(current.id));
 document.getElementById('personalNoteSearch').oninput=e=>{noteSearch=e.target.value;sjRenderJournal()};
 notes.querySelectorAll('[data-note-filter]').forEach(b=>b.onclick=()=>{noteFilter=b.dataset.noteFilter;sjRenderJournal()});
 notes.querySelectorAll('[data-note]').forEach(b=>b.onclick=()=>sjEditNote(b.dataset.note,current.id));
 notes.querySelectorAll('[data-sj-session]').forEach(b=>b.onclick=()=>{sjSelectedSessionId=b.dataset.sjSession;noteFilter='';noteSearch='';sjRenderJournal()});
}

function sjKnowledgeFrontmatter(shared){
 return 'character: Wonq\ncharacter_id: wonq\nknown_by:\n  - Wonq\nknowledge_scope: character\nshared_to_party: '+(shared?'true':'false')+'\n';
}
function sjNoteMarkdown(n){
 const label=sjCat(n.category).name,title=n.title||label;
 return '- **'+sjTime(n.created||n.updated)+' · '+label+' — '+title+'**\n  '+String(n.body||'').replace(/\r?\n/g,'\n  ')+'\n  - Connu par : **Wonq**'+(n.sharedWithParty?' · communiqué au groupe':'')+(n.promoted?' · fiche préparée : **'+n.promoted.name+'**':'');
}
function sjSessionMarkdown(session,notes){
 const ended=session.endedAt?'\nended_at: '+sjYaml(session.endedAt):'';
 return '---\ntype: session\nschema: '+SJ_SCHEMA+'\n'+sjKnowledgeFrontmatter(false)+'title: '+sjYaml(session.title)+'\ndate: '+sjIsoDate(session.startedAt)+'\nstarted_at: '+sjYaml(session.startedAt)+ended+'\nstatus: '+session.status+'\n---\n\n# '+session.title+'\n\n> Point de vue : **Wonq**. Cette note ne constitue pas une connaissance de Kentaro.\n\n## Notes de session\n\n'+(notes.length?notes.map(sjNoteMarkdown).join('\n\n'):'_Aucune note._')+'\n';
}
function sjEntityFolder(kind){return {people:'21 - PNJ',places:'22 - Lieux',factions:'23 - Factions',items:'24 - Objets',quest:'25 - Quêtes'}[kind]||'30 - Lore'}
function sjEntityMarkdown(n,session){
 const name=n.promoted.name;
 return '---\ntype: '+n.promoted.kind+'\nschema: '+SJ_SCHEMA+'\n'+sjKnowledgeFrontmatter(n.sharedWithParty)+'name: '+sjYaml(name)+'\nsource_session: '+sjYaml(session.title)+'\nsource_character: Wonq\ncanon_status: unverified-character-knowledge\n---\n\n# '+name+'\n\n> **Connaissance de Wonq uniquement.** Cette fiche n’enrichit pas automatiquement la mémoire de Kentaro ni une fiche canonique globale.\n\n## Ce que Wonq sait\n\n'+n.body+'\n\n## Source\n\n- Session : [['+session.title+']]\n- Noté le : '+sjDate(n.created||n.updated)+' à '+sjTime(n.created||n.updated)+'\n- Partagé au groupe : '+(n.sharedWithParty?'oui':'non')+'\n';
}
function sjExportFiles(session){
 const notes=sjNotes(session.id,false).sort((a,b)=>String(a.created||a.updated).localeCompare(String(b.created||b.updated)));
 const date=sjIsoDate(session.startedAt),sessionName=sjSlug(session.title),files=[];
 const sessionTarget='10 - Sessions/Wonq/'+date+' — '+sessionName+'.md';
 files.push({source:'Contenu/'+sessionTarget,target:sessionTarget,kind:'session',character:'wonq',content:sjSessionMarkdown(session,notes)});
 notes.filter(n=>n.promoted&&SJ_PROMOTABLE.has(n.promoted.kind)).forEach(n=>{
  const target=sjEntityFolder(n.promoted.kind)+'/Wonq/'+sjSlug(n.promoted.name)+' — point de vue Wonq.md';
  files.push({source:'Contenu/'+target,target:target,kind:n.promoted.kind,character:'wonq',content:sjEntityMarkdown(n,session)});
 });
 const manifest={
  format:'kentaro-session-import',version:4,schema:'kentaro-session-import-v4',generatedAt:sjNow(),mode:'delta',conflictPolicy:'skip-existing',
  source:{app:'wonq-companion',characterId:'wonq',characterName:'Wonq',knowledgeIsolation:true},
  session:{id:session.id,title:session.title,date:date,status:session.status},
  rules:{characterScopedKnowledge:true,doNotPropagateTo:['kentaro'],promoteOnlyExplicit:true},
  files:files.map(f=>({source:f.source,path:f.source,sourcePath:f.source,target:f.target,destination:f.target,vaultPath:f.target,route:f.target,kind:f.kind,character:f.character,overwrite:false})),
  items:files.map(f=>({source:f.source,target:f.target,type:f.kind,overwrite:false})),
  routes:Object.fromEntries(files.map(f=>[f.source,f.target]))
 };
 return [{name:'_kentaro-import.json',content:JSON.stringify(manifest,null,2)}].concat(files.map(f=>({name:f.source,content:f.content})));
}
function sjCrc32(bytes){let c=0xffffffff;for(let i=0;i<bytes.length;i++){c^=bytes[i];for(let j=0;j<8;j++)c=(c>>>1)^((c&1)?0xedb88320:0)}return (c^0xffffffff)>>>0}
function sjU16(n){const b=new Uint8Array(2);new DataView(b.buffer).setUint16(0,n,true);return b}
function sjU32(n){const b=new Uint8Array(4);new DataView(b.buffer).setUint32(0,n>>>0,true);return b}
function sjConcat(parts){const len=parts.reduce((n,p)=>n+p.length,0),out=new Uint8Array(len);let o=0;parts.forEach(p=>{out.set(p,o);o+=p.length});return out}
function sjDosDate(d){const y=Math.max(1980,d.getFullYear());return ((y-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate()}
function sjDosTime(d){return (d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1)}
function sjMakeZip(files){
 const enc=new TextEncoder(),locals=[],centrals=[];let offset=0;
 const now=new Date(),dt=sjDosTime(now),dd=sjDosDate(now);
 files.forEach(file=>{
  const name=enc.encode(file.name),data=enc.encode(file.content),crc=sjCrc32(data),flags=0x0800;
  const local=sjConcat([sjU32(0x04034b50),sjU16(20),sjU16(flags),sjU16(0),sjU16(dt),sjU16(dd),sjU32(crc),sjU32(data.length),sjU32(data.length),sjU16(name.length),sjU16(0),name,data]);
  locals.push(local);
  const central=sjConcat([sjU32(0x02014b50),sjU16(20),sjU16(20),sjU16(flags),sjU16(0),sjU16(dt),sjU16(dd),sjU32(crc),sjU32(data.length),sjU32(data.length),sjU16(name.length),sjU16(0),sjU16(0),sjU16(0),sjU16(0),sjU32(0),sjU32(offset),name]);
  centrals.push(central);offset+=local.length;
 });
 const centralBlob=sjConcat(centrals),end=sjConcat([sjU32(0x06054b50),sjU16(0),sjU16(0),sjU16(files.length),sjU16(files.length),sjU32(centralBlob.length),sjU32(offset),sjU16(0)]);
 return new Blob([sjConcat(locals),centralBlob,end],{type:'application/zip'});
}
function sjDownload(blob,name){const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1500)}
function sjExportSession(id){
 const session=sjSession(id);if(!session)return;
 const files=sjExportFiles(session);sjDownload(sjMakeZip(files),'Wonq - '+sjIsoDate(session.startedAt)+' - '+sjSlug(session.title)+'.zip');
 sjNotify('Export Obsidian prêt',(files.length-1)+' note(s) + manifeste · mémoire de Wonq');
}
function sjBackupJSON(){
 sjEnsureState();const payload={schema:SJ_SCHEMA,exportedAt:sjNow(),character:SJ_CHARACTER,state:sjClone(S)};
 sjDownload(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),'Wonq-backup-'+sjIsoDate()+'.json');
 sjNotify('Sauvegarde créée','État complet de Wonq et ses sessions exporté en JSON.');
}

// Replace the old free-note editor with the single session-note editor.
editNote=function(id){sjEditNote(id,null,false)};
exportNotes=function(){const s=sjCurrent();if(s)sjExportSession(s.id)};
enhanceJournal=sjRenderJournal;

const sjStyle=document.createElement('style');
sjStyle.textContent=
'.session-fab{position:fixed;right:max(12px,env(safe-area-inset-right));bottom:calc(82px + env(safe-area-inset-bottom));z-index:65;display:flex;align-items:center;gap:7px;border:1px solid #b89562;border-radius:999px;padding:10px 14px;background:linear-gradient(135deg,#31524d,#6e586f);color:#fff1dc;box-shadow:0 12px 35px #0009,0 0 0 1px #d2b57b33 inset;font-weight:900}'+
'.session-fab span{font-size:1.1rem;color:#f0ce91}.session-state-pill{max-width:min(54vw,430px);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'+
'.sj-session-tabs{display:flex;gap:6px;overflow:auto;margin:10px 0 12px;padding-bottom:3px}.sj-book-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;margin:9px 0 12px;padding:12px;border:1px solid #4e5652;border-radius:12px;background:linear-gradient(135deg,#101718,#171319)}'+
'.sj-book-head h3{margin:3px 0;color:#efd9bb;font:700 1.12rem Georgia,serif}.sj-book-head .primary{width:auto;margin:0}.sj-card-mark{display:inline-block;margin-top:5px;color:#8ec6bd;font-size:.72rem;font-weight:800}'+
'@media(max-width:767px){.session-fab{right:10px;bottom:calc(76px + env(safe-area-inset-bottom));padding:10px 12px}.session-fab b{display:none}.sj-book-head{display:grid;grid-template-columns:1fr}.sj-book-head .row{margin:0}.sj-book-head .primary,.sj-book-head .ability{flex:1 1 auto}}';
document.head.appendChild(sjStyle);

sjEnsureState();sjInstall();enhanceJournal();
})();
