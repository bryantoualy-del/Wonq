
/* Patch injecté dans le moteur historique de Wonq : ce fichier partage sa portée. */
const resetWonqCombat=()=>{
 S.combat++;
 S.turn=1;
 S.round=1;
 S.turnDamage=0;
 S.econ={action:0,bonus:0,reaction:0,move:0};
 S.concentration=null;
 S.pending=null;
 S.cortege=false;
 S.conditions=[];
 S.aideddTale5Active=false;
 S.aideddTale8Active=false;
 collapseModal();
};

shortRest=function(){
 if(!confirm('Repos court : restaurer les Inspirations et réinitialiser toutes les données de combat ?'))return;
 snapshot();
 resetWonqCombat();
 S.insp=5;
 S.tale=null;
 S.taleChoices=null;
 record('Repos court','Nouveau combat préparé · tour et round 1 · économie restaurée · dégâts du tour effacés · concentration, conte et effets temporaires terminés · Inspiration 5/5 · Chant reposant d6 rappelé.','rest');
};

longRest=function(){
 if(!confirm('Repos long : restaurer toutes les ressources et réinitialiser toutes les données de combat ? Les charges de la Longue Mémoire restent liées à l’aube.'))return;
 snapshot();
 resetWonqCombat();
 Object.assign(S,{hp:59,thp:0,insp:5,dodge:3,mistyFree:1,commandFree:1,slots:{1:4,2:3,3:3,4:2},tale:null,taleChoices:null,voice:1,sessionSpell:''});
 record('Repos long','Nouveau combat préparé · tour et round 1 · économie restaurée · dégâts du tour effacés · concentration et effets temporaires terminés · PV 59/59 · slots 4/3/3/2 · Inspiration 5/5 · Esquive 3/3 · pouvoirs féeriques restaurés · Longue Mémoire inchangée.','rest');
};

$('#quickShort').onclick=shortRest;
$('#shortRest').onclick=shortRest;
$('#quickLong').onclick=longRest;
$('#longRest').onclick=longRest;

const wonqFxStyle=document.createElement('style');
wonqFxStyle.textContent=`
.fx{isolation:isolate;transition:none!important;background:transparent!important;--mist1:#eefcf8;--mist2:#91cec7;--thread:#dfbd75}.fx:before,.fx:after{display:none!important}
.fx.psychic{--mist1:#e9ffff;--mist2:#72c7ca;--thread:#b7eee8}.fx.spirit{--mist1:#fffdf4;--mist2:#9fd8cf;--thread:#e3c27d}.fx.heal{--mist1:#effff5;--mist2:#8dd2aa;--thread:#d8d991}.fx.physical{--mist1:#fff8e8;--mist2:#c8a775;--thread:#efc876}.fx.fail{--mist1:#e7eceb;--mist2:#869694;--thread:#b78672}.fx.crit{--mist1:#fffef1;--mist2:#e6ce91;--thread:#fff0a8}
.fx.tale1{--mist1:#efffe8;--mist2:#8bc47c;--thread:#d7c276}.fx.tale2{--mist1:#fff8df;--mist2:#d9b76c;--thread:#e7eef2}.fx.tale3{--mist1:#fff1f7;--mist2:#daa1b8;--thread:#87d5bd}.fx.tale4{--mist1:#ebfeff;--mist2:#71cbd4;--thread:#d7ffff}.fx.tale5{--mist1:#fff0e9;--mist2:#c97863;--thread:#eab46e}.fx.tale6{--mist1:#fffbea;--mist2:#dfc476;--thread:#fff1ae}.fx.tale7{--mist1:#f8f0ff;--mist2:#b89acd;--thread:#86c5cf}.fx.tale8{--mist1:#dce9e7;--mist2:#527775;--thread:#b9a873}
.fx.play{animation:wonqStage 2.7s ease-out}.fx-label{z-index:4;text-shadow:0 0 16px #fffdf0,0 0 38px var(--mist2);animation:wonqLabel 1.5s ease-out forwards}.particle.smoke-wisp{z-index:2;width:var(--w)!important;height:var(--h)!important;border-radius:42% 58% 65% 35%/58% 42% 58% 42%;filter:blur(var(--blur));opacity:0;background:radial-gradient(ellipse at 46% 20%,var(--mist1) 0 4%,color-mix(in srgb,var(--mist2) 54%,transparent) 27%,color-mix(in srgb,var(--thread) 28%,transparent) 50%,transparent 72%);box-shadow:0 0 22px color-mix(in srgb,var(--mist2) 32%,transparent);animation:wonqWisp var(--d) cubic-bezier(.22,.58,.26,1) var(--delay) forwards}.particle.spark{z-index:3;background:var(--thread);box-shadow:0 0 10px var(--thread);opacity:.65}
@keyframes wonqStage{0%{opacity:0}8%{opacity:1}76%{opacity:.82}100%{opacity:0}}
@keyframes wonqWisp{0%{opacity:0;transform:translate(-50%,-55%) scale(.42) rotate(var(--r0))}17%{opacity:var(--alpha)}42%{opacity:calc(var(--alpha) * .82);transform:translate(calc(-50% + var(--xm)),calc(-55% + var(--ym))) scale(.82) rotate(var(--rm))}72%{opacity:calc(var(--alpha) * .48)}100%{opacity:0;transform:translate(calc(-50% + var(--x)),calc(-55% + var(--y))) scale(var(--grow)) rotate(var(--rot))}}
@keyframes wonqLabel{0%{opacity:0;transform:translate(-50%,-50%) scale(.72)}18%{opacity:1;transform:translate(-50%,-50%) scale(1.05)}100%{opacity:0;transform:translate(-50%,-55%) scale(1.13)}}
@media(prefers-reduced-motion:reduce){.fx:before,.fx:after{display:none!important}}
`;
document.head.appendChild(wonqFxStyle);

playFX=function(type,label){
 /* Un échec ou une action impossible reste signalé dans le ruban et le
    journal, sans déclencher de fumée ni de vibration. */
 if(type==='fail')return;
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const f=$('#fx'),box=$('#particles'),names={crit:'CRITIQUE',fail:'RATÉ',heal:'SOUFFLE VITAL',psychic:'ESPRITS',spirit:'ESPRITS',physical:'IMPACT',tale1:'INSTINCT ÉVEILLÉ',tale2:'DUELLISTE',tale3:'LIENS RETROUVÉS',tale4:'ÉCHAPPÉE',tale5:'VENGEANCE',tale6:'CŒUR HÉROÏQUE',tale7:'ENVOÛTEMENT',tale8:'SOMBRE ESPRIT'};
 f.className='fx';box.innerHTML='';$('#fxLabel').textContent=names[type]||label||'IMPACT';
 const tale=/^tale/.test(type),w=Math.max(innerWidth,700),h=Math.max(innerHeight,700),wisps=tale||type==='spirit'||type==='psychic'?22:16,sparks=tale||type==='crit'?24:14;
 for(let i=0;i<wisps;i++){
  const p=document.createElement('i'),sway=(-.18+Math.random()*.36)*w,rise=-(.58*h+Math.random()*.62*h);
  p.className='particle smoke-wisp';
  p.style.cssText=`left:${7+Math.random()*86}%;top:${96+Math.random()*18}%;--x:${sway}px;--y:${rise}px;--xm:${-sway*.42}px;--ym:${rise*.43}px;--w:${28+Math.random()*(tale?70:54)}px;--h:${150+Math.random()*(tale?250:190)}px;--d:${1.9+Math.random()*1.15}s;--delay:${Math.random()*.34}s;--blur:${7+Math.random()*12}px;--grow:${1.05+Math.random()*.72};--r0:${-18+Math.random()*36}deg;--rm:${-30+Math.random()*60}deg;--rot:${-42+Math.random()*84}deg;--alpha:${.2+Math.random()*.22}`;
  box.appendChild(p);
 }
 for(let i=0;i<sparks;i++){
  const p=document.createElement('i'),drift=(-.14+Math.random()*.28)*w,rise=-(.42*h+Math.random()*.55*h);
  p.className='particle spark';p.style.cssText=`left:${8+Math.random()*84}%;top:${92+Math.random()*14}%;--x:${drift}px;--y:${rise}px;--s:${3+Math.random()*(tale?9:6)}px;--d:${1.45+Math.random()*.9}s;--delay:${Math.random()*.28}s`;box.appendChild(p);
 }
 void f.offsetWidth;f.className='fx '+type+' play';
 if(navigator.vibrate)navigator.vibrate(type==='crit'?[28,18,55]:type==='fail'?[16,24,16]:tale?[14,18,32]:18);
 setTimeout(()=>{f.className='fx';box.innerHTML=''},3150);
};
