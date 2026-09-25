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
    const nav=document.querySelector('.nav'),journalButton=document.querySelec