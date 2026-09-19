/* WONQ FX OVERHAUL — couche visuelle uniquement, injectée dans le moteur historique. */
(()=>{
const style=document.createElement('style');
style.textContent=`
.fx.wonq-cinematic{--fx-ivory:#f4ead6;--fx-gold:#d6b06c;--fx-teal:#78b9ad;--fx-violet:#9572ad;--fx-ash:#89928f;--fx-dark:#090b0f;background:radial-gradient(circle at 50% 58%,#15151ab8,transparent 62%)!important}
.fx.wonq-cinematic .fx-label{z-index:12;letter-spacing:.12em;font-size:clamp(1.4rem,5vw,3.4rem);text-shadow:0 0 12px #fff8e8,0 0 34px currentColor}
.fx.wonq-cinematic .fx-layer{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.fx.wonq-cinematic .mist{position:absolute;left:var(--x);top:var(--y);width:var(--w);height:var(--h);border-radius:50%;background:radial-gradient(ellipse,#e9f7f12a,#7ab8ac20 44%,transparent 72%);filter:blur(var(--b));opacity:0;animation:wonqMist var(--d) ease-out var(--delay) forwards}
.fx.wonq-cinematic .specter{position:absolute;left:var(--x);top:var(--y);width:var(--w);height:var(--h);transform:translate(-50%,-50%);opacity:0;filter:blur(1px) drop-shadow(0 0 18px #79b7aa52);background:
 radial-gradient(circle at 50% 20%,#f1f5e654 0 8%,transparent 9%),
 radial-gradient(ellipse at 50% 62%,#78b9ad39 0 22%,#7f6c8f24 42%,transparent 69%);
 border-radius:48% 52% 36% 36%/28% 28% 72% 72%;animation:wonqSpecter var(--d) ease-out var(--delay) forwards}
.fx.wonq-cinematic .face{position:absolute;left:var(--x);top:var(--y);width:var(--s);height:calc(var(--s)*1.18);transform:translate(-50%,-50%) rotate(var(--r));border-radius:48% 52% 46% 54%;background:radial-gradient(circle at 34% 42%,#f2eadc99 0 4%,transparent 5%),radial-gradient(circle at 66% 42%,#f2eadc99 0 4%,transparent 5%),radial-gradient(ellipse at 50% 66%,transparent 0 6%,#e1d2bc88 7% 9%,transparent 10%),radial-gradient(ellipse,#a9cfc94f,transparent 68%);filter:blur(.4px) drop-shadow(0 0 16px #8fc7be66);opacity:0;animation:wonqFace var(--d) ease-out var(--delay) forwards}
.fx.wonq-cinematic .hand{position:absolute;left:var(--x);top:var(--y);width:32px;height:84px;border-radius:50% 50% 44% 44%;background:linear-gradient(180deg,#f1ead965,#a9cec13b 54%,transparent);filter:blur(1px) drop-shadow(0 0 10px #cde2d777);opacity:0;transform:translate(-50%,-50%) rotate(var(--r));animation:wonqHand var(--d) ease-out var(--delay) forwards}
.fx.wonq-cinematic .ring{position:absolute;left:50%;top:52%;width:var(--s);height:var(--s);transform:translate(-50%,-50%);border:1px solid var(--c,#d6b06c);border-radius:50%;opacity:0;box-shadow:0 0 20px color-mix(in srgb,var(--c,#d6b06c) 38%,transparent);animation:wonqRing var(--d) ease-out var(--delay) forwards}
.fx.wonq-cinematic .word{position:absolute;left:var(--x);top:var(--y);transform:translate(-50%,-50%) rotate(var(--r));font:700 var(--s) Georgia,serif;letter-spacing:.12em;color:var(--c,#e7d3a7);text-shadow:0 0 16px var(--c,#e7d3a7);opacity:0;animation:wonqWord var(--d) ease-out var(--delay) forwards}
.fx.wonq-cinematic .page{position:absolute;left:var(--x);top:var(--y);width:var(--w);height:var(--h);border:1px solid #d0b77b66;border-radius:5px;background:linear-gradient(145deg,#d6c79c24,#6a56402c);box-shadow:0 0 14px #b5955d25;opacity:0;transform:rotate(var(--r));animation:wonqPage var(--d) ease-out var(--delay) forwards}
.fx.wonq-cinematic .slash{position:absolute;left:50%;top:50%;width:min(72vw,720px);height:3px;background:linear-gradient(90deg,transparent,var(--c,#e4c77c),#fff,transparent);box-shadow:0 0 22px var(--c,#e4c77c);opacity:0;transform:translate(-50%,-50%) rotate(var(--r));animation:wonqSlashFx var(--d) ease-out var(--delay) forwards}
.fx.wonq-cinematic .outline{position:absolute;left:50%;top:50%;width:min(48vw,430px);height:min(64vh,520px);transform:translate(-50%,-50%);border:2px solid var(--c,#d9bd82);border-radius:46% 54% 40% 40%;box-shadow:0 0 24px var(--c,#d9bd82),inset 0 0 34px color-mix(in srgb,var(--c,#d9bd82) 20%,transparent);opacity:0;animation:wonqOutline var(--d) ease-out var(--delay) forwards}
.fx.wonq-cinematic .tear{position:absolute;left:50%;top:50%;width:6px;height:0;transform:translate(-50%,-50%);background:linear-gradient(#f4e6bd,#7db8af,#9271a8,#f4e6bd);box-shadow:0 0 24px #9ccfc4,0 0 60px #8b6da6;animation:wonqTear 1.15s ease-out forwards}
.fx.wonq-cinematic .darkfall{position:absolute;inset:0;background:#030407;opacity:0;animation:wonqDarkFall 1.15s ease-out forwards}
.fx.wonq-cinematic .tale-avatar-cine{position:absolute;left:50%;top:56%;width:min(44vw,480px);height:min(44vw,480px);transform:translate(-50%,-50%);background-image:url('assets/fx/tale-spectres.webp');background-size:400% 200%;background-position:var(--bx) var(--by);background-repeat:no-repeat;filter:drop-shadow(0 0 30px #8ebfb65e);opacity:0;animation:wonqAvatarCine 1.55s ease-out var(--delay) forwards}
.fx.wonq-cinematic.fx-whisper .fx-label{color:#d8f2ed}.fx.wonq-cinematic.fx-heal .fx-label{color:#efe0a9}.fx.wonq-cinematic.fx-register .fx-label{color:#ddc189}.fx.wonq-cinematic.fx-dark .fx-label{color:#c2b1d6}.fx.wonq-cinematic.fx-command .fx-label{color:#ead39c}
@keyframes wonqMist{0%{opacity:0;transform:translate(-50%,20%) scale(.45)}22%{opacity:.35}100%{opacity:0;transform:translate(calc(-50% + var(--dx)),calc(-40% + var(--dy))) scale(1.45)}}
@keyframes wonqSpecter{0%{opacity:0;transform:translate(-50%,18%) scale(.55)}28%{opacity:.42}68%{opacity:.28}100%{opacity:0;transform:translate(calc(-50% + var(--dx)),-50%) scale(1.08)}}
@keyframes wonqFace{0%{opacity:0;transform:translate(-50%,-50%) scale(.55) rotate(var(--r))}28%{opacity:.6}68%{opacity:.36}100%{opacity:0;transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(1.1) rotate(calc(var(--r) + 8deg))}}
@keyframes wonqHand{0%{opacity:0;transform:translate(-50%,25%) rotate(var(--r)) scale(.7)}30%{opacity:.48}70%{opacity:.3}100%{opacity:0;transform:translate(-50%,-55%) rotate(var(--r)) scale(1.1)}}
@keyframes wonqRing{0%{opacity:0;transform:translate(-50%,-50%) scale(.35)}24%{opacity:.68}100%{opacity:0;transform:translate(-50%,-50%) scale(1.42)}}
@keyframes wonqWord{0%{opacity:0;filter:blur(6px);transform:translate(-50%,-50%) rotate(var(--r)) scale(.72)}26%{opacity:.85;filter:blur(0)}72%{opacity:.45}100%{opacity:0;filter:blur(4px);transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) rotate(var(--r)) scale(1.12)}}
@keyframes wonqPage{0%{opacity:0;transform:translateY(34%) rotate(var(--r)) scale(.65)}28%{opacity:.5}100%{opacity:0;transform:translate(var(--dx),var(--dy)) rotate(calc(var(--r) + 48deg)) scale(1.05)}}
@keyframes wonqSlashFx{0%{opacity:0;transform:translate(-50%,-50%) rotate(var(--r)) scaleX(.05)}24%{opacity:1}56%{opacity:.72;transform:translate(-50%,-50%) rotate(var(--r)) scaleX(1)}100%{opacity:0;transform:translate(-50%,-50%) rotate(var(--r)) scaleX(1.08)}}
@keyframes wonqOutline{0%{opacity:0;transform:translate(-50%,-50%) scale(.75)}30%{opacity:.65}72%{opacity:.35}100%{opacity:0;transform:translate(-50%,-50%) scale(1.04)}}
@keyframes wonqTear{0%{height:0;opacity:0}22%{height:62vh;opacity:1}72%{width:120px;height:66vh;opacity:.72}100%{width:0;height:70vh;opacity:0}}
@keyframes wonqDarkFall{0%{opacity:0}12%{opacity:.88}30%{opacity:.18}72%{opacity:.42}100%{opacity:0}}
@keyframes wonqAvatarCine{0%{opacity:0;filter:blur(10px) drop-shadow(0 0 12px #8ebfb6)}28%{opacity:.72;filter:blur(1px) drop-shadow(0 0 28px #8ebfb6)}72%{opacity:.42}100%{opacity:0;transform:translate(-50%,-66%) scale(1.07);filter:blur(6px) drop-shadow(0 0 38px #8ebfb6)}}
@media(max-width:767px){.fx.wonq-cinematic .tale-avatar-cine{width:min(76vw,360px);height:min(76vw,360px)}.fx.wonq-cinematic .outline{width:58vw;height:48vh}.fx.wonq-cinematic .face{filter:blur(.2px) drop-shadow(0 0 12px #8fc7be55)}}
`;
document.head.appendChild(style);

const fxRoot=()=>({f:$('#fx'),box:$('#particles'),label:$('#fxLabel')});
const node=(cls,css='',txt='')=>{const e=document.createElement('i');e.className=cls;e.style.cssText=css;if(txt)e.textContent=txt;return e};
const layer=()=>{const e=document.createElement('div');e.className='fx-layer';return e};
const addMist=(root,n=12)=>{for(let i=0;i<n;i++){root.appendChild(node('mist',`--x:${8+Math.random()*84}%;--y:${80+Math.random()*25}%;--w:${80+Math.random()*180}px;--h:${80+Math.random()*180}px;--b:${8+Math.random()*16}px;--d:${1.1+Math.random()*.7}s;--delay:${Math.random()*.24}s;--dx:${-90+Math.random()*180}px;--dy:${-140-Math.random()*220}px`))}};
const addSpecters=(root,n=3)=>{for(let i=0;i<n;i++){root.appendChild(node('specter',`--x:${18+i*(64/Math.max(1,n-1))}%;--y:${72+Math.random()*14}%;--w:${65+Math.random()*40}px;--h:${150+Math.random()*90}px;--dx:${-30+Math.random()*60}px;--d:${1.25+Math.random()*.45}s;--delay:${.05+i*.08}s`))}};
const addFaces=(root,n=4)=>{for(let i=0;i<n;i++){root.appendChild(node('face',`--x:${16+Math.random()*68}%;--y:${30+Math.random()*42}%;--s:${54+Math.random()*42}px;--r:${-18+Math.random()*36}deg;--dx:${-45+Math.random()*90}px;--dy:${-60-Math.random()*80}px;--d:${1.05+Math.random()*.38}s;--delay:${i*.08}s`))}};
const addHands=(root,n=4)=>{for(let i=0;i<n;i++){root.appendChild(node('hand',`--x:${18+Math.random()*64}%;--y:${74+Math.random()*18}%;--r:${-32+Math.random()*64}deg;--d:${1.15+Math.random()*.35}s;--delay:${i*.07}s`))}};
const addRings=(root,n=3,c='#d6b06c')=>{for(let i=0;i<n;i++){root.appendChild(node('ring',`--s:${120+i*90}px;--c:${c};--d:${.85+i*.18}s;--delay:${i*.1}s`))}};
const addWords=(root,words,c='#e7d3a7')=>{words.forEach((w,i)=>root.appendChild(node('word',`--x:${22+Math.random()*56}%;--y:${26+Math.random()*50}%;--s:${18+Math.random()*22}px;--r:${-13+Math.random()*26}deg;--c:${c};--dx:${-55+Math.random()*110}px;--dy:${-45-Math.random()*70}px;--d:${1.05+Math.random()*.4}s;--delay:${i*.06}s`,w)))};
const addPages=(root,n=10)=>{for(let i=0;i<n;i++){root.appendChild(node('page',`--x:${20+Math.random()*60}%;--y:${68+Math.random()*22}%;--w:${34+Math.random()*35}px;--h:${45+Math.random()*42}px;--r:${-28+Math.random()*56}deg;--dx:${-120+Math.random()*240}px;--dy:${-120-Math.random()*170}px;--d:${1.15+Math.random()*.45}s;--delay:${Math.random()*.2}s`))}};
const avatar=(root,n,left='50%',delay='0s')=>{n=Math.max(1,Math.min(8,+n||1));const x=['0%','33.333%','66.667%','100%'][(n-1)%4],y=n<=4?'0%':'100%';root.appendChild(node('tale-avatar-cine',`left:${left};--bx:${x};--by:${y};--delay:${delay}`))};
const slash=(root,r=0,c='#e4c77c',delay='0s')=>root.appendChild(node('slash',`--r:${r}deg;--c:${c};--d:1.05s;--delay:${delay}`));

const sceneFor=(type,label='')=>{
 const s=(label||'').toLowerCase();
 if(/^conte mémorisé|^conte choisi/.test(s))return 'draw';
 if(s.includes('deux voix'))return 'voices';
 if(/^tale[1-8]$/.test(type))return 'tale'+type.slice(4);
 if(s.includes('murmures dissonants'))return 'dissonant';
 if(s.includes('moquerie cruelle'))return 'mockery';
 if(s.includes('mot de guérison'))return 'healing';
 if(s.includes('inspiration bardique'))return 'inspiration';
 if(s.includes('lueurs féeriques'))return 'faerie';
 if(s.includes('suggestion'))return 'suggestion';
 if(s.includes('injonction'))return 'command';
 if(s.includes('motif hypnotique'))return 'hypnotic';
 if(s.includes('invisibilité supérieure'))return 'greater-invis';
 if(s.includes('invisibilité'))return 'invis';
 if(s.includes('porte dimensionnelle'))return 'door';
 if(s.includes('dissipation'))return 'dispel';
 if(s.includes('détection de la magie'))return 'detect';
 if(s.includes('restauration partielle'))return 'restore';
 if(s.includes('cortège des absents'))return 'cortege';
 if(type==='heal')return 'healing';
 if(type==='psychic')return 'dissonant';
 if(type==='spirit')return 'spirit';
 if(type==='crit')return 'crit';
 if(type==='physical')return 'impact';
 return type||'spirit';
};

const taleNames={1:'LA BÊTE',2:'LE GUERRIER',3:'LES AMIS',4:'LE FUYARD',5:'LE VENGEUR',6:'LE HÉROS',7:'LA FÉE',8:'SOMBRE ESPRIT'};
const labels={dissonant:'ILS PARLENT',mockery:'RIRE DES ABSENTS',healing:'SOUFFLE VITAL',inspiration:'LE RÉCIT CONTINUE',faerie:'RÉVÉLÉ',suggestion:'ÉCOUTE',command:'INJONCTION',hypnotic:'FASCINATION',invis:'EFFACEMENT','greater-invis':'HORS DE VUE',door:'PASSAGE',dispel:'DISSIPÉ',detect:'AURA PERÇUE',restore:'PURIFIÉ',draw:'UN ABSENT PARLE',voices:'DEUX VOIX',cortege:'LE CORTÈGE',spirit:'ESPRITS',crit:'CRITIQUE',impact:'IMPACT'};

playFX=function(type,label){
 if(type==='fail'||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const {f,box,label:labelEl}=fxRoot();if(!f||!box)return;
 const scene=sceneFor(type,label),root=layer();box.innerHTML='';box.appendChild(root);
 let theme='fx-register',duration=1750,shown=labels[scene]||label||'ESPRITS';
 if(/^tale[1-8]$/.test(scene)){const n=+scene.slice(4);shown=taleNames[n];theme=n===8?'fx-dark':'fx-register';duration=1800;addMist(root,10);avatar(root,n);
   if(n===1){addWords(root,['••','••'],'#b6d28e');slash(root,18,'#d7c276','.18s');slash(root,18,'#d7c276','.28s')}
   if(n===2){slash(root,-43,'#e5ca7a');slash(root,38,'#f2eadc','.12s')}
   if(n===3){addSpecters(root,2);addRings(root,3,'#daa1b8');addHands(root,4)}
   if(n===4){for(let i=0;i<4;i++)slash(root,-7+i*5,'#7fd7dc',`${i*.07}s`)}
   if(n===5){slash(root,-48,'#d07e65');slash(root,48,'#eab46e','.08s');addRings(root,2,'#c97863')}
   if(n===6){addSpecters(root,1);addRings(root,4,'#e7c86e');addWords(root,['✦','✦','✦'],'#f2dea1')}
   if(n===7){addFaces(root,2);addWords(root,['viens','regarde'],'#c7a4d6');addRings(root,2,'#a58ac0')}
   if(n===8){root.appendChild(node('darkfall'));addFaces(root,3);addHands(root,6);addSpecters(root,1)}
 } else if(scene==='draw'){theme='fx-register';duration=1650;addPages(root,12);addMist(root,12);for(let n=1;n<=8;n++)avatar(root,n,`${10+n*10}%`,`${n*.035}s`)}
 else if(scene==='voices'){theme='fx-register';duration=1750;addPages(root,8);addMist(root,12);const nums=(wonqFxRecordContext?.text?.match(/\b[1-8]\b/g)||[]).slice(0,2);avatar(root,nums[0]||1,'36%','0s');avatar(root,nums[1]||2,'64%','.12s')}
 else if(scene==='dissonant'){theme='fx-whisper';duration=1650;addMist(root,14);addFaces(root,6);addWords(root,['écoute','derrière','fuis'],'#c9ece6');addSpecters(root,2)}
 else if(scene==='mockery'){theme='fx-whisper';duration=1400;addMist(root,9);addFaces(root,3);addWords(root,['ha','ha','…'],'#d5bee1');slash(root,-8,'#9e7bb0','.12s')}
 else if(scene==='healing'){theme='fx-heal';duration=1450;addMist(root,12);addHands(root,5);addSpecters(root,3);addRings(root,3,'#dfc982')}
 else if(scene==='inspiration'){theme='fx-heal';duration=1200;addMist(root,8);addRings(root,4,'#d7b76e');addWords(root,['♪','♫','♪','✦'],'#d7b76e')}
 else if(scene==='faerie'){theme='fx-heal';duration=1350;addMist(root,8);root.appendChild(node('outline','--c:#d9c77a;--d:1.2s;--delay:0s'));addWords(root,['✦','✦','✦','✦'],'#d9c77a')}
 else if(scene==='suggestion'){theme='fx-whisper';duration=1450;addMist(root,10);addFaces(root,2);addWords(root,['écoute','suis','viens'],'#c7b1d8');addRings(root,2,'#9c7ab3')}
 else if(scene==='command'){theme='fx-command';duration=1150;addMist(root,6);const word=(label||'INJONCTION').split('·').pop().trim().toUpperCase();addWords(root,[word],'#e8c97f');addRings(root,2,'#e8c97f')}
 else if(scene==='hypnotic'){theme='fx-whisper';duration=1700;addMist(root,11);addFaces(root,7);addRings(root,5,'#9f82b7')}
 else if(scene==='invis'||scene==='greater-invis'){theme='fx-whisper';duration=1500;addMist(root,14);addSpecters(root,scene==='greater-invis'?5:2);root.appendChild(node('outline','--c:#89bfb5;--d:1.3s;--delay:0s'))}
 else if(scene==='door'){theme='fx-register';duration=1600;addPages(root,10);addMist(root,10);root.appendChild(node('tear'))}
 else if(scene==='dispel'){theme='fx-register';duration=1200;addWords(root,['◇','✧','△','○'],'#cab486');addMist(root,7);addRings(root,3,'#cab486')}
 else if(scene==='detect'){theme='fx-whisper';duration=1350;addMist(root,7);root.appendChild(node('outline','--c:#8dc0b5;--d:1.2s;--delay:0s'));addWords(root,['◌','✧','◌'],'#8dc0b5')}
 else if(scene==='restore'){theme='fx-heal';duration=1450;addHands(root,6);addMist(root,9);addWords(root,['✕'],'#c7b0c9');addRings(root,2,'#d2bd82')}
 else if(scene==='cortege'){theme='fx-register';duration=1550;addMist(root,13);addSpecters(root,3);addWords(root,['I','II','III'],'#c8b27b')}
 else if(scene==='crit'){theme='fx-register';duration=1050;addRings(root,4,'#f0d386');slash(root,-45,'#f0d386');slash(root,45,'#fff5cc','.08s')}
 else if(scene==='impact'){theme='fx-register';duration=950;addMist(root,5);slash(root,-12,'#d6b477')}
 else {theme='fx-register';duration=1250;addMist(root,10);addSpecters(root,3)}
 labelEl.textContent=shown;f.className=`fx wonq-cinematic ${theme} ${scene} play`;
 if(navigator.vibrate)navigator.vibrate(/^tale|draw|voices|door/.test(scene)?[12,18,28]:scene==='crit'?[25,18,45]:12);
 clearTimeout(window.__wonqFxTimer);window.__wonqFxTimer=setTimeout(()=>{f.className='fx';box.innerHTML=''},duration+250);
};
})();
