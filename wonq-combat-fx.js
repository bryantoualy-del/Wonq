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
.fx{isolation:isolate;transition:none!important}.fx:before,.fx:after{content:'';position:absolute;inset:-28%;opacity:0;mix-blend-mode:screen;filter:blur(28px);transform:scale(.72) rotate(0deg)}
.fx.play{animation:wonqStage 2.15s ease-out}.fx.play:before{background:radial-gradient(ellipse at 18% 72%,#f4fffbea 0 5%,#a8ddd4c7 15%,#599f9a73 30%,transparent 48%),radial-gradient(ellipse at 76% 30%,#eafffae8 0 6%,#9fd8d1b5 17%,#4b8c8970 32%,transparent 50%),radial-gradient(ellipse at 54% 82%,#e7c98b85 0 4%,#bd914b48 16%,transparent 38%);animation:wonqSmokeLeft 2.15s cubic-bezier(.2,.7,.25,1) forwards}
.fx.play:after{background:radial-gradient(ellipse at 82% 72%,#f7fffceb 0 6%,#a4dcd5bd 19%,#548f8b68 34%,transparent 52%),radial-gradient(ellipse at 28% 24%,#dffaf5e2 0 6%,#8fcfc8aa 20%,#477f7d62 35%,transparent 52%),radial-gradient(ellipse at 68% 36%,#f0d39a75 0 3%,#bd8e4442 14%,transparent 34%);animation:wonqSmokeRight 2.15s cubic-bezier(.2,.7,.25,1) forwards}
.fx-label{z-index:4;text-shadow:0 0 18px #fffdf0,0 0 42px #b6eee4,0 0 90px #68aaa5;animation:wonqLabel 1.35s ease-out forwards}.particle.smoke-wisp{z-index:2;border-radius:48% 52% 64% 36%;filter:blur(var(--blur));opacity:.76;background:radial-gradient(circle at 36% 34%,#ffffffed 0 6%,#d8f5efcf 20%,#91cec7a8 43%,#d1a85d52 60%,transparent 76%);box-shadow:0 0 30px #c8f3ebaa,0 0 54px #68aaa56b;animation:wonqWisp var(--d) cubic-bezier(.12,.62,.2,1) var(--delay) forwards}.particle.spark{z-index:3;background:#e7c784;box-shadow:0 0 14px #f2d99f}
@keyframes wonqStage{0%{opacity:0}7%{opacity:1}74%{opacity:.96}100%{opacity:0}}
@keyframes wonqSmokeLeft{0%{opacity:0;transform:translate(-30%,18%) scale(.55) rotate(-12deg)}18%{opacity:.94}70%{opacity:.78}100%{opacity:0;transform:translate(23%,-13%) scale(1.48) rotate(16deg)}}
@keyframes wonqSmokeRight{0%{opacity:0;transform:translate(31%,22%) scale(.58) rotate(14deg)}16%{opacity:.9}72%{opacity:.72}100%{opacity:0;transform:translate(-20%,-18%) scale(1.55) rotate(-18deg)}}
@keyframes wonqWisp{0%{opacity:0;transform:translate(-50%,-50%) scale(.18) rotate(0deg)}16%{opacity:.88}70%{opacity:.62}100%{opacity:0;transform:translate(calc(-50% + var(--x)),calc(-50% + var(--y))) scale(var(--grow)) rotate(var(--rot))}}
@keyframes wonqLabel{0%{opacity:0;transform:translate(-50%,-50%) scale(.72)}18%{opacity:1;transform:translate(-50%,-50%) scale(1.05)}100%{opacity:0;transform:translate(-50%,-55%) scale(1.13)}}
@media(prefers-reduced-motion:reduce){.fx:before,.fx:after{display:none!important}}
`;
document.head.appendChild(wonqFxStyle);

playFX=function(type,label){
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const f=$('#fx'),box=$('#particles'),names={crit:'CRITIQUE',fail:'RATÉ',heal:'SOUFFLE VITAL',psychic:'ESPRITS',spirit:'ESPRITS',physical:'IMPACT',tale1:'INSTINCT ÉVEILLÉ',tale2:'DUELLISTE',tale3:'LIENS RETROUVÉS',tale4:'ÉCHAPPÉE',tale5:'VENGEANCE',tale6:'CŒUR HÉROÏQUE',tale7:'ENVOÛTEMENT',tale8:'SOMBRE ESPRIT'};
 f.className='fx';box.innerHTML='';$('#fxLabel').textContent=names[type]||label||'IMPACT';
 const tale=/^tale/.test(type),w=Math.max(innerWidth,700),h=Math.max(innerHeight,700),wisps=tale||type==='spirit'||type==='psychic'?30:22,sparks=tale||type==='crit'?42:28;
 for(let i=0;i<wisps;i++){
  const p=document.createElement('i'),a=Math.random()*Math.PI*2,dist=.24*w+Math.random()*.72*w;
  p.className='particle smoke-wisp';
  p.style.cssText=`left:${8+Math.random()*84}%;top:${14+Math.random()*76}%;--x:${Math.cos(a)*dist}px;--y:${Math.sin(a)*(.38*h+Math.random()*.42*h)}px;--s:${70+Math.random()*(tale?210:170)}px;--d:${1.35+Math.random()*.78}s;--delay:${Math.random()*.22}s;--blur:${9+Math.random()*18}px;--grow:${1.15+Math.random()*1.7};--rot:${-90+Math.random()*180}deg`;
  box.appendChild(p);
 }
 for(let i=0;i<sparks;i++){
  const p=document.createElement('i'),a=Math.random()*Math.PI*2,dist=120+Math.random()*Math.min(w,850)*.75;
  p.className='particle spark';p.style.cssText=`--x:${Math.cos(a)*dist}px;--y:${Math.sin(a)*dist}px;--s:${4+Math.random()*(tale?20:13)}px;--d:${.8+Math.random()*.65}s;--delay:${Math.random()*.18}s`;box.appendChild(p);
 }
 void f.offsetWidth;f.className='fx '+type+' play';
 if(navigator.vibrate)navigator.vibrate(type==='crit'?[28,18,55]:type==='fail'?[16,24,16]:tale?[14,18,32]:18);
 setTimeout(()=>{f.className='fx';box.innerHTML=''},2250);
};
