(()=>{
/* Contes de l'Au-delà — version AideDD (Unearthed Arcana) */
const install=()=>{
 if(typeof tales==='undefined'||typeof resolveTale==='undefined'||typeof renderTales==='undefined')return false;
 tales[1]={name:'Marc Assin · La Bête',short:'Animal rusé',effect:'Pendant 1 minute, la cible a l’avantage aux tests de Sagesse (Perception) et aux attaques contre une créature située à 1,5 m ou moins d’un ennemi qui n’est pas incapable d’agir.'};
 tales[2]={name:'Alain Proviste · Le Guerrier',short:'Duelliste',effect:'Wonq effectue immédiatement une attaque de sort au corps à corps contre la cible : +8 pour toucher, 2d8 + 5 dégâts de force.',attack:true};
 tales[3]={name:'Clam & Dya · Les Amis',short:'Amis aimés',effect:'La cible et une autre créature de son choix visible à 1,5 m ou moins récupèrent chacune 1d8 + 5 PV.',heal:true};
 tales[4]={name:'Jacques Mesrine · Le Fuyard',short:'Fuyard',effect:'La cible peut utiliser sa réaction pour se téléporter de 9 m. Elle peut faire suivre jusqu’à 5 créatures visibles à 9 m, chacune utilisant également sa réaction.'};
 tales[5]={name:'Cid Action · Le Vengeur',short:'Vengeur',effect:'Pendant 1 minute, lorsqu’une créature visible à 9 m de la cible est touchée, la cible peut utiliser sa réaction pour infliger 1d8 dégâts de force à l’attaquant.',deferred:true};
 tales[6]={name:'Richard Cœur-de-Lion · Le Héros',short:'Héros',effect:'La cible gagne 1d8 + 8 PV temporaires. Tant qu’ils lui restent, sa vitesse de marche augmente de 3 m.',thp:true};
 tales[7]={name:'Fée Lation · La Fée',short:'Fée malicieuse',effect:'JdS Sagesse DD 16. Échec : charmée jusqu’à la fin de son prochain tour et doit utiliser son action pour attaquer au corps à corps la créature désignée. Sans créature désignée, elle agit normalement.',save:true};
 tales[8]={name:'Paul Tergeist · Le Sombre Esprit',short:'Tueur des ténèbres',effect:'Invisible jusqu’à la fin de son prochain tour ou jusqu’à toucher avec une attaque. Cette touche inflige +1d8 nécrotique et effraie la victime jusqu’à la fin de son prochain tour.',deferred:true};

 const baseRenderTales=renderTales;
 const activePanel=document.createElement('article');
 activePanel.className='panel full signature';
 activePanel.id='aideddTaleEffects';
 const grid=document.querySelector('#tales .grid');
 if(grid)grid.appendChild(activePanel);

 const renderActive=()=>{
  if(!activePanel.isConnected)return;
  const vengeance=!!S.aideddTale5Active,ombre=!!S.aideddTale8Active;
  activePanel.innerHTML='<div class="eyebrow">Effets de conte persistants</div><h2>Déclencheurs à résoudre</h2>'+
   (!vengeance&&!ombre?'<div class="meta">Aucun effet différé actif.</div>':'')+
   (vengeance?'<div class="step"><b>Cid Action · Le Vengeur</b><div class="meta">La cible peut réagir lorsqu’une créature visible à 9 m est touchée.</div><div class="row"><button class="ability" id="triggerVengeance">Déclencher · réaction · 1d8 force</button><button class="ability" id="endVengeance">Terminer l’effet</button></div></div>':'')+
   (ombre?'<div class="step"><b>Paul Tergeist · Le Sombre Esprit</b><div class="meta">Résoudre seulement si la cible invisible touche avec une attaque.</div><div class="row"><button class="ability" id="triggerDarkHit">Touche invisible · +1d8 nécrotique</button><button class="ability" id="endDarkSpirit">Fin sans toucher</button></div></div>':'');
  document.getElementById('triggerVengeance')?.addEventListener('click',()=>{snapshot();const r=die(8);record('Cid Action · Vengeance déclenchée',r+' dégâts de force à l’attaquant · la cible dépense sa réaction.','spirit','tale5');renderActive()});
  document.getElementById('endVengeance')?.addEventListener('click',()=>{snapshot();S.aideddTale5Active=false;record('Cid Action · Vengeur terminé','L’effet d’une minute est terminé.','spirit');renderActive()});
  document.getElementById('triggerDarkHit')?.addEventListener('click',()=>{snapshot();const r=die(8);S.aideddTale8Active=false;record('Paul Tergeist · Touche dans l’ombre','+'+r+' dégâts nécrotiques · victime effrayée jusqu’à la fin de son prochain tour.','spirit','tale8');renderActive()});
  document.getElementById('endDarkSpirit')?.addEventListener('click',()=>{snapshot();S.aideddTale8Active=false;record('Paul Tergeist · Invisibilité terminée','Fin du prochain tour atteinte sans attaque réussie.','spirit');renderActive()});
 };
 renderTales=function(){baseRenderTales();renderActive()};

 resolveTale=function(n){
  const t=tales[n];
  if(n===1){record(t.name,'Avantage pendant 1 minute aux tests de SAG (Perception) et aux attaques répondant au critère de proximité.','spirit','tale1')}
  else if(n===2){startAttack({name:t.name,bonus:8,n:2,s:8,mod:5,type:'force'},{spendAction:false})}
  else if(n===3){const r=die(8)+5;record(t.name,r+' PV rendus à chacune des deux cibles.','heal','tale3')}
  else if(n===4){record(t.name,'La cible peut se téléporter de 9 m avec sa réaction et faire suivre jusqu’à 5 créatures, avec leur réaction.','spirit','tale4')}
  else if(n===5){S.aideddTale5Active=true;record(t.name,'Effet actif pendant 1 minute. Utilisez le déclencheur lorsqu’une créature visible à 9 m de la cible est touchée.','spirit','tale5')}
  else if(n===6){const r=die(8)+8;record(t.name,r+' PV temporaires et +3 m de vitesse tant que ces PV temporaires subsistent.','heal','tale6')}
  else if(n===7){startSave({name:t.name,cost:null,save:'SAG',dc:16,summary:'charme puis attaque de mêlée imposée',onFail:'charmée jusqu’à la fin de son prochain tour ; utilise son action pour attaquer au corps à corps la cible désignée, ou agit normalement si aucune cible n’est désignée',onSuccess:'aucun effet',fx:'tale7'})}
  else if(n===8){S.aideddTale8Active=true;record(t.name,'Invisibilité active. Ne lancez le d8 nécrotique que si la cible touche avec une attaque.','spirit','tale8')}
  renderActive();
 };
 renderTales();
 return true;
};
if(!install()){const observer=new MutationObserver(()=>{if(install())observer.disconnect()});observer.observe(document.documentElement,{childList:true,subtree:true})}
})();