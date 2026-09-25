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
function sjDeleteEve