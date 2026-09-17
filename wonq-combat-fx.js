
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
.fx.rest{--mist1:#fff7df;--mist2:#a9d8d0;--thread:#d5aa69}.fx.illusion-prototype{--mist1:#e9ffff;--mist2:#9aa8d9;--thread:#c6a9dc}
.fx.tale1{--mist1:#efffe8;--mist2:#8bc47c;--thread:#d7c276}.fx.tale2{--mist1:#fff8df;--mist2:#d9b76c;--thread:#e7eef2}.fx.tale3{--mist1:#fff1f7;--mist2:#daa1b8;--thread:#87d5bd}.fx.tale4{--mist1:#ebfeff;--mist2:#71cbd4;--thread:#d7ffff}.fx.tale5{--mist1:#fff0e9;--mist2:#c97863;--thread:#eab46e}.fx.tale6{--mist1:#fffbea;--mist2:#dfc476;--thread:#fff1ae}.fx.tale7{--mist1:#f8f0ff;--mist2:#b89acd;--thread:#86c5cf}.fx.tale8{--mist1:#dce9e7;--mist2:#527775;--thread:#b9a873}
.fx.play{animation:wonqStage 2.7s ease-out}.fx-label{z-index:4;text-shadow:0 0 16px #fffdf0,0 0 38px var(--mist2);animation:wonqLabel 1.5s ease-out forwards}.particle.smoke-wisp{z-index:2;width:var(--w)!important;height:var(--h)!important;border-radius:42% 58% 65% 35%/58% 42% 58% 42%;filter:blur(var(--blur));opacity:0;background:radial-gradient(ellipse at 46% 20%,var(--mist1) 0 4%,color-mix(in srgb,var(--mist2) 54%,transparent) 27%,color-mix(in srgb,var(--thread) 28%,transparent) 50%,transparent 72%);box-shadow:0 0 22px color-mix(in srgb,var(--mist2) 32%,transparent);animation:wonqWisp var(--d) cubic-bezier(.22,.58,.26,1) var(--delay) forwards}.particle.spark{z-index:3;background:var(--thread);box-shadow:0 0 10px var(--thread);opacity:.65}
.fx.prototype .fx-label{display:none!important}.particle.whisper-wisp{position:absolute;z-index:2;width:var(--w)!important;height:var(--h)!important;border-radius:50%;opacity:0;filter:blur(var(--blur));background:radial-gradient(ellipse at 50% 45%,color-mix(in srgb,var(--mist1) 68%,transparent),color-mix(in srgb,var(--mist2) 38%,transparent) 38%,transparent 72%);box-shadow:0 0 25px color-mix(in srgb,var(--mist2) 25%,transparent);animation:wonqWhisper var(--d) cubic-bezier(.2,.52,.24,1) var(--delay) forwards}.particle.music-note{position:absolute;z-index:3;width:auto!important;height:auto!important;background:transparent!important;box-shadow:none!important;color:var(--thread);font:600 var(--size) Georgia,serif;text-shadow:0 0 12px color-mix(in srgb,var(--thread) 70%,transparent);opacity:0;animation:wonqNote var(--d) ease-out var(--delay) forwards}.particle.spirit-shape{position:absolute;z-index:2;width:var(--w)!important;height:var(--h)!important;border-radius:48% 52% 34% 36%/26% 27% 73% 74%;opacity:0;filter:blur(var(--blur));background:radial-gradient(circle at 50% 17%,color-mix(in srgb,var(--mist1) 72%,transparent) 0 8%,transparent 9%),radial-gradient(ellipse at 50% 60%,color-mix(in srgb,var(--mist2) 45%,transparent) 0 22%,color-mix(in srgb,var(--thread) 14%,transparent) 42%,transparent 71%);animation:wonqGhost var(--d) cubic-bezier(.19,.55,.24,1) var(--delay) forwards}.particle.tale-avatar{position:absolute;z-index:3;left:50%;top:54%;width:min(48vw,520px)!important;height:min(48vw,520px)!important;background-image:url('assets/fx/tale-spectres.webp')!important;background-repeat:no-repeat!important;background-size:400% 200%!important;background-position:var(--bx) var(--by)!important;filter:drop-shadow(0 0 24px color-mix(in srgb,var(--mist2) 48%,transparent));opacity:0;animation:wonqAvatar 2.65s ease-out forwards}.particle.illusion-veil{position:absolute;z-index:2;left:50%;top:48%;width:min(48vw,540px)!important;height:min(62vh,520px)!important;border-radius:50%;background:radial-gradient(ellipse,color-mix(in srgb,var(--mist1) 32%,transparent),color-mix(in srgb,var(--mist2) 22%,transparent) 35%,transparent 68%);filter:blur(14px);opacity:0;animation:wonqVeil 2.2s ease-out var(--delay) forwards}.particle.crit-streak{position:absolute;z-index:4;left:50%;bottom:3%;width:3px!important;height:86vh!important;background:linear-gradient(0deg,transparent,var(--thread),#fffbe0,var(--thread),transparent)!important;box-shadow:0 0 18px var(--thread),0 0 42px color-mix(in srgb,var(--mist1) 55%,transparent);opacity:0;animation:wonqStreak 1.4s ease-out forwards}
@keyframes wonqStage{0%{opacity:0}8%{opacity:1}76%{opacity:.82}100%{opacity:0}}
@keyframes wonqWisp{0%{opacity:0;transform:translate(-50%,-55%) scale(.42) rotate(var(--r0))}17%{opacity:var(--alpha)}42%{opacity:calc(var(--alpha) * .82);transform:translate(calc(-50% + var(--xm)),calc(-55% + var(--ym))) scale(.82) rotate(var(--rm))}72%{opacity:calc(var(--alpha) * .48)}100%{opacity:0;transform:translate(calc(-50% + var(--x)),calc(-55% + var(--y))) scale(var(--grow)) rotate(var(--rot))}}
@keyframes wonqWhisper{0%{opacity:0;transform:translate(-50%,-50%) scale(.35) rotate(var(--r0))}18%{opacity:var(--alpha)}56%{opacity:calc(var(--alpha) * .8);transform:translate(calc(-50% + var(--xm)),calc(-50% + var(--ym))) scale(.8) rotate(var(--rm))}100%{opacity:0;transform:translate(calc(-50% + var(--x)),calc(-50% + var(--y))) scale(1.25) rotate(var(--rot))}}
@keyframes wonqNote{0%{opacity:0;transform:translate(-50%,0) scale(.7) rotate(-8deg)}20%{opacity:.78}70%{opacity:.42}100%{opacity:0;transform:translate(calc(-50% + var(--x)),var(--y)) scale(1.15) rotate(var(--rot))}}
@keyframes wonqGhost{0%{opacity:0;transform:translate(-50%,15%) scale(.52)}22%{opacity:var(--alpha)}58%{opacity:calc(var(--alpha) * .76)}100%{opacity:0;transform:translate(calc(-50% + var(--x)),var(--y)) scale(1.12)}}
@keyframes wonqAvatar{0%{opacity:0;transform:translate(-50%,28%) scale(.7);filter:blur(9px) drop-shadow(0 0 12px var(--mist2))}24%{opacity:.7;filter:blur(1px) drop-shadow(0 0 25px var(--mist2))}70%{opacity:.48}100%{opacity:0;transform:translate(-50%,-28%) scale(1.08);filter:blur(5px) drop-shadow(0 0 35px var(--mist2))}}
@keyframes wonqVeil{0%{opacity:0;transform:translate(-50%,-50%) scale(.35)}25%{opacity:.5}64%{opacity:.28;transform:translate(calc(-50% + var(--x)),calc(-50% + var(--y))) scale(.9)}100%{opacity:0;transform:translate(calc(-50% + var(--x2)),calc(-50% + var(--y2))) scale(1.18)}}
@keyframes wonqStreak{0%{opacity:0;transform:translateX(-50%) scaleY(.15)}18%{opacity:1}45%{opacity:.72;transform:translateX(-50%) scaleY(1)}100%{opacity:0;transform:translateX(-50%) scaleY(1.12)}}
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
 const tale=/^tale/.test(type),variant=tale?'tale-prototype':label==='Inspiration bardique'?'inspiration':/invisibilit|illusion/i.test(label||'')?'illusion-prototype':type==='psychic'?'whisper':type==='heal'?'heal-prototype':type==='physical'?'impact-prototype':type==='crit'?'crit-prototype':type==='spirit'?'spirit-prototype':type==='rest'?'rest-prototype':'',w=Math.max(innerWidth,700),h=Math.max(innerHeight,700);
 const addWisp=(amount=1)=>{for(let i=0;i<amount;i++){const p=document.createElement('i'),sway=(-.18+Math.random()*.36)*w,rise=-(.58*h+Math.random()*.62*h);p.className='particle smoke-wisp';p.style.cssText=`left:${7+Math.random()*86}%;top:${96+Math.random()*18}%;--x:${sway}px;--y:${rise}px;--xm:${-sway*.42}px;--ym:${rise*.43}px;--w:${28+Math.random()*58}px;--h:${150+Math.random()*210}px;--d:${1.9+Math.random()*1.15}s;--delay:${Math.random()*.34}s;--blur:${7+Math.random()*12}px;--grow:${1.05+Math.random()*.72};--r0:${-18+Math.random()*36}deg;--rm:${-30+Math.random()*60}deg;--rot:${-42+Math.random()*84}deg;--alpha:${.18+Math.random()*.18}`;box.appendChild(p)}};
 const addSparks=(amount=12,wide=.2)=>{for(let i=0;i<amount;i++){const p=document.createElement('i'),drift=(-wide/2+Math.random()*wide)*w,rise=-(.35*h+Math.random()*.52*h);p.className='particle spark';p.style.cssText=`left:${18+Math.random()*64}%;top:${88+Math.random()*14}%;--x:${drift}px;--y:${rise}px;--s:${3+Math.random()*7}px;--d:${1.25+Math.random()*.75}s;--delay:${Math.random()*.3}s`;box.appendChild(p)}};
 if(variant==='whisper'){
  for(let i=0;i<18;i++){const p=document.createElement('i'),left=i%2===0,start=left?4+Math.random()*23:73+Math.random()*23,target=(50-(start))*w/100;p.className='particle whisper-wisp';p.style.cssText=`left:${start}%;top:${72+Math.random()*31}%;--w:${60+Math.random()*90}px;--h:${105+Math.random()*155}px;--blur:${8+Math.random()*11}px;--xm:${target*.72}px;--ym:${-(.16+Math.random()*.14)*h}px;--x:${target}px;--y:${-(.48+Math.random()*.3)*h}px;--r0:${left?-28:28}deg;--rm:${left?18:-18}deg;--rot:${left?42:-42}deg;--d:${1.75+Math.random()*.65}s;--delay:${Math.random()*.28}s;--alpha:${.18+Math.random()*.16}`;box.appendChild(p)}
 }else if(variant==='inspiration'){
  addWisp(13);for(let i=0;i<12;i++){const p=document.createElement('span');p.className='particle music-note';p.textContent=i%3===0?'♫':'♪';p.style.cssText=`left:${18+Math.random()*64}%;top:${91+Math.random()*10}%;--x:${(-.12+Math.random()*.24)*w}px;--y:${-(.45+Math.random()*.44)*h}px;--rot:${-24+Math.random()*48}deg;--size:${18+Math.random()*18}px;--d:${1.75+Math.random()*.75}s;--delay:${Math.random()*.45}s`;box.appendChild(p)}
 }else if(variant==='tale-prototype'){
  addWisp(15);const n=Math.max(1,Math.min(8,+type.slice(4)||1)),avatar=document.createElement('i'),x=['0%','33.333%','66.667%','100%'][(n-1)%4],y=n<=4?'0%':'100%';avatar.className='particle tale-avatar';avatar.style.cssText=`--bx:${x};--by:${y}`;box.appendChild(avatar);for(let i=0;i<3;i++){const p=document.createElement('i');p.className='particle spirit-shape';p.style.cssText=`left:${12+Math.random()*76}%;top:${91+Math.random()*12}%;--w:${45+Math.random()*48}px;--h:${115+Math.random()*105}px;--blur:${6+Math.random()*7}px;--x:${(-.07+Math.random()*.14)*w}px;--y:${-(.38+Math.random()*.34)*h}px;--d:${2.1+Math.random()*.7}s;--delay:${.12+Math.random()*.38}s;--alpha:${.1+Math.random()*.1}`;box.appendChild(p)}
 }else if(variant==='illusion-prototype'){
  addWisp(12);for(const side of [-1,1]){const p=document.createElement('i');p.className='particle illusion-veil';p.style.cssText=`--x:${side*.12*w}px;--y:${-.12*h}px;--x2:${side*.28*w}px;--y2:${-.34*h}px;--delay:${side<0?0:.12}s`;box.appendChild(p)}
 }else if(variant==='heal-prototype'){
  addWisp(14);addSparks(14,.16);
 }else if(variant==='impact-prototype'){
  addWisp(7);addSparks(20,.42);
 }else if(variant==='crit-prototype'){
  addWisp(12);addSparks(30,.46);const streak=document.createElement('i');streak.className='particle crit-streak';box.appendChild(streak);
 }else if(variant==='spirit-prototype'){
  addWisp(16);for(let i=0;i<4;i++){const p=document.createElement('i');p.className='particle spirit-shape';p.style.cssText=`left:${16+Math.random()*68}%;top:${91+Math.random()*11}%;--w:${48+Math.random()*56}px;--h:${125+Math.random()*120}px;--blur:${5+Math.random()*7}px;--x:${(-.07+Math.random()*.14)*w}px;--y:${-(.4+Math.random()*.4)*h}px;--d:${2.1+Math.random()*.75}s;--delay:${Math.random()*.38}s;--alpha:${.12+Math.random()*.12}`;box.appendChild(p)}
 }else if(variant==='rest-prototype'){
  addWisp(8);
 }else{
 const wisps=type==='spirit'||type==='psychic'?22:16,sparks=type==='crit'?24:14;
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
 }
 void f.offsetWidth;f.className='fx '+type+(variant?' prototype '+variant:'')+' play';
 if(navigator.vibrate)navigator.vibrate(type==='crit'?[28,18,55]:type==='fail'?[16,24,16]:tale?[14,18,32]:18);
 setTimeout(()=>{f.className='fx';box.innerHTML=''},3150);
};

const wonqRecordBase=record;
record=function(title,text,type='',fxType=type){const result=wonqRecordBase(title,text,type,fxType);if(fxType==='rest')playFX('rest',title);return result};
