/* Wonq — Session journal & Obsidian export
   Character-scoped knowledge: facts captured here belong to Wonq by default.
   A "shared with party" flag records that Wonq communicated the information,
   but never grants knowledge to Kentaro or another PC automatically. */
(()=>{
'use strict';
const SESSION_CHARACTER={id:'wonq',name:'Wonq'};
const SESSION_SCHEMA='wonq-session-journal-v1';
const EVENT_TYPES=[
  ['event','Événement'],['npc','PNJ'],['place','Lieu'],['quest','Quête'],
  ['clue','Indice'],['item','Objet'],['faction','Faction'],['memory','Souvenir']
];
const PROMOTABLE=new Set(['npc','place','quest','item','faction']);
let selectedSessionId=null;

const sjEsc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sjUid=()=>{try{return crypto.randomUUID()}catch(e){return 'sj-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9)}};
const sjClone=o=>o==null?o:JSON.parse(JSON.stringify(o));
const sjNow=()=>new Date().toISOString();
const sjDate=iso=>{const d=iso?new Date(iso):new Date();return d.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric'})};
const sjTime=iso=>{const d=iso?new Date(iso):new Date();return d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})};
const sjIsoDate=iso=>{const d=iso?new Date(iso):new Date();const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return y+'-'+m+'-'+day};
const sjSlug=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[\\/:*?"<>|]/g,' ').replace(/\s+/g,' ').trim().slice(0,110)||'Sans titre';
const sjYaml=s=>'"'+String(s??'').replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/\r?\n/g,' ' )+'"';

function sjEnsureState(){
  if(!Array.isArray(S.playSessions))S.playSessions=[];
  if(!Array.isArray(S.sessionEvents))S.sessionEvents=[];
  if(typeof S.activePlaySessionId!=='string')S.activePlaySessionId='';
  S.playSessions.forEach(x=>{
    if(!x.id)x.id=sjUid();
    if(!x.characterId)x.characterId=SESSION_CHARACTER.id;
    if(!x.status)x.status=x.endedAt?'ended':'active';
  });
  S.sessionEvents.forEach(x=>{
    if(!x.id)x.id=sjUid();
    if(!Array.isArray(x.knownBy)||!x.knownBy.length)x.knownBy=[SESSION_CHARACTER.id];
    if(!x.knownBy.includes(SESSION_CHARACTER.id))x.knownBy.unshift(SESSION_CHARACTER.id);
    if(typeof x.sharedWithParty!=='boolean')x.sharedWithParty=false;
    if(!x.characterId)x.characterId=SESSION_CHARACTER.id;
  });
  if(S.activePlaySessionId&&!S.playSessions.some(x=>x.id===S.activePlaySessionId&&x.status==='active'))S.activePlaySessionId='';
  if(!selectedSessionId){
    selectedSessionId=S.activePlaySessionId||(S.playSessions.slice().sort((a,b)=>String(b.startedAt).localeCompare(String(a.startedAt)))[0]?.id||null);
  }
}
function sjSession(id){return S.playSessions.find(x=>x.id===id)||null}
function sjActive(){return sjSession(S.activePlaySessionId)}
function sjEvents(id){return S.sessionEvents.filter(x=>x.sessionId===id&&!x.deleted).sort((a,b)=>String(a.createdAt).localeCompare(String(b.createdAt)))}
function sjCategory(id){return EVENT_TYPES.find(x=>x[0]===id)?.[1]||'Événement'}
function sjNotify(title,text){try{showRibbon(title,text)}catch(e){}}

function sjInstallShell(){
  if(!document.getElementById('wonqSessionEditor')){
    const d=document.createElement('dialog');
    d.id='wonqSessionEditor';d.className='wonq-session-editor';
    d.innerHTML='<form method="dialog"><div class="journal-head"><div><div class="eyebrow">Mémoire de Wonq</div><h2 id="sjEditorTitle">Session</h2></div><button type="button" class="ability" id="sjEditorClose">Fermer</button></div><div id="sjEditorBody"></div></form>';
    document.body.appendChild(d);
    d.querySelector('#sjEditorClose').onclick=()=>d.close();
  }
  if(!document.getElementById('quickSessionEvent')){
    const b=document.createElement('button');b.id='quickSessionEvent';b.type='button';b.className='session-fab';b.innerHTML='<span>✎</span><b>Événement</b>';
    b.onclick=()=>sjQuickEvent();document.body.appendChild(b);
  }
  if(!document.getElementById('sessionStateQuick')){
    const b=document.createElement('button');b.id='sessionStateQuick';b.className='state clickable session-state-pill';b.type='button';
    const bar=document.querySelector('.statebar');if(bar)bar.appendChild(b);
    b.onclick=()=>sjOpenSessionView();
  }
  if(!document.getElementById('session')){
    const section=document.createElement('section');section.className='view';section.id='session';
    section.innerHTML='<div class="grid"><article class="panel full"><div id="sessionMount"></div></article></div>';
    const journal=document.getElementById('journal');journal?.parentNode?.insertBefore(section,journal);
  }
  if(!document.querySelector('.nav [data-view="session"]')){
    const b=document.createElement('button');b.dataset.view='session';b.textContent='Session';
    const nav=document.querySelector('.nav'),journalButton=document.querySelector('.nav [data-view="journal"]');
    if(nav)nav.insertBefore(b,journalButton||null);
    b.onclick=()=>sjOpenSessionView();
  }
}
function sjOpenSessionView(){
  document.querySelectorAll('.nav button').forEach(x=>x.classList.toggle('active',x.dataset.view==='session'));
  document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id==='session'));
  sjRender();scrollTo({top:0,behavior:'smooth'});
}
function sjUpdatePill(){
  const b=document.getElementById('sessionStateQuick');if(!b)return;
  const a=sjActive();
  b.classList.toggle('on',!!a);
  b.textContent=a?'Session · '+a.title:'Session · aucune';
  b.title=a?'Session active de Wonq — '+a.title:'Démarrer une session de Wonq';
}

function sjOpenEditor(title,html,onSave,onReady){
  const d=document.getElementById('wonqSessionEditor'),form=d?.querySelector('form');if(!d||!form)return;
  document.getElementById('sjEditorTitle').textContent=title;document.getElementById('sjEditorBody').innerHTML=html;d.returnValue='';d.showModal();
  const handler=e=>{if(e.submitter?.value!=='save')return;e.preventDefault();onSave(new FormData(form),form);d.close()};
  form.onsubmit=handler;onReady?.(form,d);
}
function sjStartSession(openEventAfter=false){
  const today=sjDate();
  sjOpenEditor('Démarrer une session','<label>Nom de la session<input class="number" name="title" value="Session Wonq — '+sjEsc(today)+'" required></label><p class="meta">Cette session appartient au point de vue de <b>Wonq</b>. Elle n’ajoute aucune connaissance à Kentaro.</p><button class="primary teal" value="save">Démarrer</button>',fd=>{
    const existing=sjActive();if(existing){existing.status='ended';existing.endedAt=sjNow()}
    const x={id:sjUid(),title:String(fd.get('title')||'Session Wonq').trim(),characterId:SESSION_CHARACTER.id,startedAt:sjNow(),endedAt:null,status:'active',schema:SESSION_SCHEMA};
    S.playSessions.push(x);S.activePlaySessionId=x.id;selectedSessionId=x.id;save();sjRender();sjUpdatePill();sjNotify('Session démarrée',x.title);if(openEventAfter)setTimeout(()=>sjEditEvent(null,x.id,true),80);
  });
}
function sjEndSession(){
  const a=sjActive();if(!a)return;
  if(!confirm('Terminer la session « '+a.title+' » ? Les notes restent conservées.'))return;
  a.status='ended';a.endedAt=sjNow();S.activePlaySessionId='';selectedSessionId=a.id;save();sjRender();sjUpdatePill();sjNotify('Session terminée',a.title);
}
function sjDeleteSession(id){
  const s=sjSession(id);if(!s)return;if(!confirm('Supprimer cette session et ses événements de cet appareil ?'))return;
  S.playSessions=S.playSessions.filter(x=>x.id!==id);S.sessionEvents=S.sessionEvents.filter(x=>x.sessionId!==id);
  if(S.activePlaySessionId===id)S.activePlaySessionId='';selectedSessionId=S.activePlaySessionId||S.playSessions[0]?.id||null;save();sjRender();sjUpdatePill();
}

function sjQuickEvent(sessionId){
  sjEnsureState();const target=sjSession(sessionId)||sjActive();
  if(!target){sjStartSession(true);return}
  sjEditEvent(null,target.id,true);
}
function sjEditEvent(id,sessionId,focusBody){
  const existing=S.sessionEvents.find(x=>x.id===id);
  const e=sjClone(existing||{id:sjUid(),sessionId:sessionId||sjActive()?.id,characterId:SESSION_CHARACTER.id,category:'event',title:'',body:'',createdAt:sjNow(),updatedAt:sjNow(),knownBy:[SESSION_CHARACTER.id],sharedWithParty:false,promoted:null,deleted:false});
  if(!e.sessionId){sjStartSession();return}
  const opts=EVENT_TYPES.map(x=>'<option value="'+x[0]+'" '+(e.category===x[0]?'selected':'')+'>'+x[1]+'</option>').join('');
  sjOpenEditor(existing?'Modifier l’événement':'Noter un événement','<div class="sj-event-form"><label>Type<select name="category">'+opts+'</select></label><label>Titre court<input class="number" name="title" value="'+sjEsc(e.title)+'" placeholder="Ex. Une piste sur Lazarus"></label><label class="sj-note-wide">Ce que Wonq apprend<textarea class="sj-fast-note" name="body" placeholder="Écris l’essentiel pendant la partie…" required>'+sjEsc(e.body)+'</textarea></label><label class="toggle sj-note-wide"><input type="checkbox" name="shared" '+(e.sharedWithParty?'checked':'')+'> Wonq a partagé cette information au groupe</label><p class="meta sj-note-wide">Par défaut, la connaissance reste attribuée à <b>Wonq uniquement</b>. « Partagé au groupe » ne donne jamais automatiquement cette connaissance à Kentaro.</p><button class="primary teal sj-note-wide" value="save">Enregistrer</button></div>',fd=>{
    e.category=String(fd.get('category')||'event');e.title=String(fd.get('title')||'').trim();e.body=String(fd.get('body')||'').trim();e.sharedWithParty=fd.has('shared');e.knownBy=[SESSION_CHARACTER.id];e.updatedAt=sjNow();
    const idx=S.sessionEvents.findIndex(x=>x.id===e.id);idx<0?S.sessionEvents.push(e):S.sessionEvents[idx]=e;save();selectedSessionId=e.sessionId;sjRender();sjNotify('Événement noté',e.title||sjCategory(e.category));
  },form=>{if(focusBody)setTimeout(()=>form.querySelector('[name="body"]')?.focus(),60)});
}
function sjDeleteEvent(id){
  const e=S.sessionEvents.find(x=>x.id===id);if(!e)return;if(!confirm('Retirer cet événement de la session ?'))return;e.deleted=true;e.updatedAt=sjNow();save();sjRender();
}
function sjPromoteEvent(id){
  const e=S.sessionEvents.find(x=>x.id===id);if(!e||!PROMOTABLE.has(e.category))return;
  const proposed=e.promoted?.name||e.title||e.body.slice(0,70);
  sjOpenEditor(e.promoted?'Modifier la fiche préparée':'Préparer une fiche','<label>Nom de la fiche<input class="number" name="name" value="'+sjEsc(proposed)+'" required></label><p class="meta">La fiche sera exportée comme <b>connaissance de Wonq</b>, séparée d’une éventuelle fiche canonique ou d’une fiche connue de Kentaro.</p><button class="primary teal" value="save">'+(e.promoted?'Mettre à jour':'Préparer la fiche')+'</button>',fd=>{
    e.promoted={kind:e.category,name:String(fd.get('name')||'').trim(),createdAt:e.promoted?.createdAt||sjNow(),updatedAt:sjNow()};e.updatedAt=sjNow();save();sjRender();sjNotify('Fiche préparée',e.promoted.name);
  });
}
function sjUnpromote(id){const e=S.sessionEvents.find(x=>x.id===id);if(!e)return;e.promoted=null;e.updatedAt=sjNow();save();sjRender()}

function sjRender(){
  sjEnsureState();sjInstallShell();sjUpdatePill();
  const root=document.getElementById('sessionMount');if(!root)return;
  const active=sjActive();const sessions=S.playSessions.slice().sort((a,b)=>String(b.startedAt).localeCompare(String(a.startedAt)));
  if(selectedSessionId&&!sjSession(selectedSessionId))selectedSessionId=active?.id||sessions[0]?.id||null;
  const current=sjSession(selectedSessionId)||active||sessions[0]||null;
  const sessionTabs=sessions.map(x=>'<button class="state '+(current?.id===x.id?'on':'')+'" data-sj-session="'+x.id+'">'+sjEsc(x.title)+(x.status==='active'?' · active':'')+'</button>').join('');
  const header='<div class="sj-session-head"><div><div class="eyebrow">Mémoire cloisonnée par personnage</div><h2>Session de Wonq</h2><p class="meta">Ce journal décrit ce que <b>Wonq</b> vit ou apprend. Rien n’est transféré à Kentaro sans décision explicite.</p></div><div class="sj-session-actions">'+(active?'<button class="ability" id="sjEndSession">Terminer la session</button>':'<button class="primary teal" id="sjStartSession">Démarrer une session</button>')+'<button class="ability" id="sjBackup">Sauvegarde JSON</button></div></div>';
  if(!current){root.innerHTML=header+'<div class="sj-empty"><b>Aucune session enregistrée.</b><span>Démarre la session puis utilise « ✎ Événement » pendant la partie.</span></div>';sjBindRoot(root);return}
  const events=sjEvents(current.id);
  const cards=events.map(e=>{
    const promote=PROMOTABLE.has(e.category)?'<button class="ability" data-sj-promote="'+e.id+'">'+(e.promoted?'Fiche ✓':'Préparer fiche')+'</button>':'';
    return '<article class="sj-event-card"><div class="sj-event-meta"><span class="badge">'+sjEsc(sjCategory(e.category))+'</span><span>'+sjEsc(sjTime(e.createdAt))+'</span><span class="sj-knowledge">Connu : Wonq</span>'+(e.sharedWithParty?'<span class="badge">Partagé au groupe</span>':'')+'</div><h3>'+sjEsc(e.title||sjCategory(e.category))+'</h3><p>'+sjEsc(e.body)+'</p>'+(e.promoted?'<div class="sj-promoted">↳ Fiche Wonq préparée : <b>'+sjEsc(e.promoted.name)+'</b></div>':'')+'<div class="row"><button class="ability" data-sj-edit="'+e.id+'">Modifier</button>'+promote+(e.promoted?'<button class="ability" data-sj-unpromote="'+e.id+'">Annuler fiche</button>':'')+'<button class="ability" data-sj-delete-event="'+e.id+'">Retirer</button></div></article>';
  }).join('')||'<div class="sj-empty"><b>Aucun événement.</b><span>Le bouton flottant « ✎ Événement » reste disponible pendant toute la partie.</span></div>';
  root.innerHTML=header+'<div class="sj-session-tabs">'+sessionTabs+'</div><div class="sj-current"><div><div class="eyebrow">'+sjEsc(sjDate(current.startedAt))+'</div><h2>'+sjEsc(current.title)+'</h2><div class="badges"><span class="badge">Point de vue : Wonq</span><span class="badge">'+events.length+' événement'+(events.length>1?'s':'')+'</span><span class="badge">'+(current.status==='active'?'En cours':'Archivée')+'</span></div></div><div class="sj-current-actions"><button class="primary teal" id="sjAddEvent">✎ Ajouter un événement</button><button class="ability" id="sjExportZip">Exporter vers Obsidian</button><button class="ability" id="sjDeleteSession">Supprimer</button></div></div><div class="sj-event-list">'+cards+'</div>';
  sjBindRoot(root,current);
}
function sjBindRoot(root,current){
  root.querySelector('#sjStartSession')?.addEventListener('click',()=>sjStartSession(false));root.querySelector('#sjEndSession')?.addEventListener('click',sjEndSession);root.querySelector('#sjBackup')?.addEventListener('click',sjBackupJSON);
  root.querySelector('#sjAddEvent')?.addEventListener('click',()=>sjQuickEvent(current?.id));root.querySelector('#sjExportZip')?.addEventListener('click',()=>sjExportSession(current?.id));root.querySelector('#sjDeleteSession')?.addEventListener('click',()=>current&&sjDeleteSession(current.id));
  root.querySelectorAll('[data-sj-session]').forEach(b=>b.onclick=()=>{selectedSessionId=b.dataset.sjSession;sjRender()});
  root.querySelectorAll('[data-sj-edit]').forEach(b=>b.onclick=()=>sjEditEvent(b.dataset.sjEdit));root.querySelectorAll('[data-sj-delete-event]').forEach(b=>b.onclick=()=>sjDeleteEvent(b.dataset.sjDeleteEvent));
  root.querySelectorAll('[data-sj-promote]').forEach(b=>b.onclick=()=>sjPromoteEvent(b.dataset.sjPromote));root.querySelectorAll('[data-sj-unpromote]').forEach(b=>b.onclick=()=>sjUnpromote(b.dataset.sjUnpromote));
}

function sjKnowledgeFrontmatter(shared){
  return 'character: Wonq\ncharacter_id: wonq\nknown_by:\n  - Wonq\nknowledge_scope: character\nshared_to_party: '+(shared?'true':'false')+'\n';
}
function sjEventMarkdown(e){
  const label=sjCategory(e.category),title=e.title||label;
  return '- **'+sjTime(e.createdAt)+' · '+label+' — '+title+'**\n  '+e.body.replace(/\r?\n/g,'\n  ')+'\n  - Connu par : **Wonq**'+(e.sharedWithParty?' · communiqué au groupe':'')+(e.promoted?' · fiche préparée : **'+e.promoted.name+'**':'');
}
function sjSessionMarkdown(session,events){
  const ended=session.endedAt?'\nended_at: '+sjYaml(session.endedAt):'';
  return '---\ntype: session\nschema: '+SESSION_SCHEMA+'\n'+sjKnowledgeFrontmatter(false)+'title: '+sjYaml(session.title)+'\ndate: '+sjIsoDate(session.startedAt)+'\nstarted_at: '+sjYaml(session.startedAt)+ended+'\nstatus: '+session.status+'\n---\n\n# '+session.title+'\n\n> Point de vue : **Wonq**. Cette note ne constitue pas une connaissance de Kentaro.\n\n## Événements\n\n'+(events.length?events.map(sjEventMarkdown).join('\n\n'):'_Aucun événement noté._')+'\n';
}
function sjEntityFolder(kind){return {npc:'21 - PNJ',place:'22 - Lieux',faction:'23 - Factions',item:'24 - Objets',quest:'25 - Quêtes'}[kind]||'30 - Lore'}
function sjEntityMarkdown(e,session){
  const p=e.promoted,name=p.name;
  return '---\ntype: '+p.kind+'\nschema: '+SESSION_SCHEMA+'\n'+sjKnowledgeFrontmatter(e.sharedWithParty)+'name: '+sjYaml(name)+'\nsource_session: '+sjYaml(session.title)+'\nsource_character: Wonq\ncanon_status: unverified-character-knowledge\n---\n\n# '+name+'\n\n> **Connaissance de Wonq uniquement.** Cette fiche n’enrichit pas automatiquement la mémoire de Kentaro ni une fiche canonique globale.\n\n## Ce que Wonq sait\n\n'+e.body+'\n\n## Source\n\n- Session : [['+session.title+']]\n- Noté le : '+sjDate(e.createdAt)+' à '+sjTime(e.createdAt)+'\n- Partagé au groupe : '+(e.sharedWithParty?'oui':'non')+'\n';
}
function sjExportFiles(session){
  const events=sjEvents(session.id),date=sjIsoDate(session.startedAt),sessionName=sjSlug(session.title),files=[];
  const sessionTarget='10 - Sessions/Wonq/'+date+' — '+sessionName+'.md';
  files.push({source:'Contenu/'+sessionTarget,target:sessionTarget,kind:'session',character:'wonq',content:sjSessionMarkdown(session,events)});
  events.filter(e=>e.promoted&&PROMOTABLE.has(e.promoted.kind)).forEach(e=>{
    const target=sjEntityFolder(e.promoted.kind)+'/Wonq/'+sjSlug(e.promoted.name)+' — point de vue Wonq.md';
    files.push({source:'Contenu/'+target,target:target,kind:e.promoted.kind,character:'wonq',content:sjEntityMarkdown(e,session)});
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

function sjCrc32(bytes){
  let c=0xffffffff;for(let i=0;i<bytes.length;i++){c^=bytes[i];for(let j=0;j<8;j++)c=(c>>>1)^((c&1)?0xedb88320:0)}return (c^0xffffffff)>>>0;
}
function sjU16(n){const b=new Uint8Array(2);new DataView(b.buffer).setUint16(0,n,true);return b}
function sjU32(n){const b=new Uint8Array(4);new DataView(b.buffer).setUint32(0,n>>>0,true);return b}
function sjConcat(parts){const len=parts.reduce((n,p)=>n+p.length,0),out=new Uint8Array(len);let o=0;parts.forEach(p=>{out.set(p,o);o+=p.length});return out}
function sjDosDate(d){const year=Math.max(1980,d.getFullYear());return ((year-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate()}
function sjDosTime(d){return (d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1)}
function sjMakeZip(files){
  const enc=new TextEncoder(),locals=[],centrals=[];let offset=0;const now=new Date(),dt=sjDosTime(now),dd=sjDosDate(now);
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
  const session=sjSession(id);if(!session)return;const files=sjExportFiles(session),blob=sjMakeZip(files);sjDownload(blob,'Wonq - '+sjIsoDate(session.startedAt)+' - '+sjSlug(session.title)+'.zip');sjNotify('Export Obsidian prêt',files.length-1+' note(s) + manifeste · mémoire de Wonq');
}
function sjBackupJSON(){
  sjEnsureState();const payload={schema:SESSION_SCHEMA,exportedAt:sjNow(),character:SESSION_CHARACTER,state:sjClone(S)};sjDownload(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),'Wonq-backup-'+sjIsoDate()+'.json');sjNotify('Sauvegarde créée','État complet de Wonq et sessions exporté en JSON.');
}

const style=document.createElement('style');style.textContent=`
.session-fab{position:fixed;right:max(12px,env(safe-area-inset-right));bottom:calc(82px + env(safe-area-inset-bottom));z-index:65;display:flex;align-items:center;gap:7px;border:1px solid #b89562;border-radius:999px;padding:10px 14px;background:linear-gradient(135deg,#31524d,#6e586f);color:#fff1dc;box-shadow:0 12px 35px #0009,0 0 0 1px #d2b57b33 inset;font-weight:900}.session-fab span{font-size:1.1rem;color:#f0ce91}.session-state-pill{max-width:min(54vw,430px);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.sj-session-head,.sj-current{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}.sj-session-actions,.sj-current-actions{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}.sj-session-actions .primary,.sj-current-actions .primary{width:auto;margin:0}.sj-session-tabs{display:flex;gap:6px;overflow:auto;margin:14px 0;padding-bottom:3px}.sj-current{padding:13px;border:1px solid #5c5149;border-radius:13px;background:linear-gradient(135deg,#15191a,#1f171f)}.sj-event-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:11px}.sj-event-card{border:1px solid var(--line);border-radius:12px;background:#111518;padding:12px}.sj-event-card h3{margin:8px 0 5px;color:#efd9bb;font:700 1.05rem Georgia,serif}.sj-event-card p{white-space:pre-wrap;color:#d2c7b8;line-height:1.45}.sj-event-meta{display:flex;align-items:center;gap:6px;flex-wrap:wrap;color:var(--muted);font-size:.72rem}.sj-knowledge{color:#8ec6bd}.sj-promoted{margin-top:9px;padding:7px 9px;border-left:3px solid var(--teal);background:#11201e;border-radius:7px;color:#b9d8d2;font-size:.78rem}.sj-empty{display:grid;gap:5px;place-items:center;min-height:150px;margin-top:12px;border:1px dashed #5b514b;border-radius:12px;color:var(--muted);text-align:center}.wonq-session-editor{width:min(680px,calc(100% - 20px));max-height:90vh;overflow:auto;border:1px solid var(--gold);border-radius:18px;background:#151419;color:var(--ink);padding:18px;box-shadow:0 25px 80px #000}.wonq-session-editor::backdrop{background:#020303d8;backdrop-filter:blur(7px)}.wonq-session-editor label{display:block;margin:9px 0;color:var(--muted)}.wonq-session-editor input,.wonq-session-editor select,.wonq-session-editor textarea{width:100%;margin-top:5px;background:#0c0a0d;color:var(--ink);border:1px solid var(--line);border-radius:9px;padding:9px}.wonq-session-editor textarea{min-height:180px;resize:vertical}.wonq-session-editor .toggle input{width:auto}.sj-event-form{display:grid;grid-template-columns:190px 1fr;gap:0 10px}.sj-note-wide{grid-column:1/-1}.sj-fast-note{font-size:16px;line-height:1.45}
@media(max-width:767px){.session-fab{right:10px;bottom:calc(76px + env(safe-area-inset-bottom));padding:10px 12px}.session-fab b{display:none}.sj-session-head,.sj-current{display:grid;grid-template-columns:1fr}.sj-session-actions,.sj-current-actions{justify-content:flex-start}.sj-event-list{grid-template-columns:1fr}.sj-event-form{grid-template-columns:1fr}.sj-note-wide{grid-column:auto}.wonq-session-editor{padding:13px}.wonq-session-editor textarea{min-height:34vh}.sj-current-actions .primary,.sj-current-actions .ability,.sj-session-actions .primary,.sj-session-actions .ability{flex:1 1 auto}}
`;document.head.appendChild(style);

sjEnsureState();sjInstallShell();
const sjBaseRender=render;render=function(){sjBaseRender();sjEnsureState();sjInstallShell();sjRender()};
sjRender();
})();
