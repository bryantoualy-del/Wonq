(()=>{
const asset=name=>`assets/context/${name}.png`;
const icon=(name,label='')=>`<img class="wonq-glyph" src="${asset(name)}" alt="" aria-hidden="true">${label}`;

const style=document.createElement('style');
style.textContent=`
.wonq-glyph{width:22px;height:22px;object-fit:contain;flex:0 0 auto;filter:drop-shadow(0 2px 5px #000b);pointer-events:none}.nav button{display:inline-flex;align-items:center;justify-content:center;gap:6px}.nav .wonq-glyph{width:19px;height:19px;opacity:.78}.nav button.active .wonq-glyph{opacity:1;filter:drop-shadow(0 0 7px #78d7cd88)}
.context-glyph-button{display:inline-flex!important;align-items:center;justify-content:center;gap:7px}.context-glyph-button .wonq-glyph{width:25px;height:25px}.turn-conc{display:grid!important;grid-template-columns:30px 1fr!important;grid-template-rows:auto auto!important;column-gap:7px!important}.turn-conc .wonq-glyph{grid-row:1/3;width:30px;height:30px;align-self:center}.quick-slots-label{display:flex;align-items:center;gap:6px}.quick-slots-label .wonq-glyph{width:25px;height:25px}
.context-panel{position:relative;overflow:hidden}.context-panel:after{content:'';position:absolute;right:-10px;bottom:-14px;width:86px;height:86px;background:var(--context-icon) center/contain no-repeat;opacity:.15;filter:saturate(.8);pointer-events:none}.context-panel>*{position:relative;z-index:1}.context-panel:hover:after{opacity:.23}
.hpstat{position:relative;overflow:hidden}.hpstat:after{content:'';position:absolute;right:-9px;top:-8px;width:58px;height:58px;background:url('${asset('vitality')}') center/contain no-repeat;opacity:.18;pointer-events:none}
#taleState{padding-left:29px!important;background-image:url('${asset('tales')}')!important;background-repeat:no-repeat!important;background-position:6px center!important;background-size:18px!important}
@media(max-width:767px){.nav button{gap:4px}.nav .wonq-glyph{width:17px;height:17px}.context-panel:after{width:72px;height:72px}.context-glyph-button .wonq-glyph{width:22px;height:22px}.turn-conc{grid-template-columns:25px 1fr!important}.turn-conc .wonq-glyph{width:25px;height:25px}}
`;
document.head.appendChild(style);

const addButtonIcon=(el,name)=>{if(!el||el.querySelector('.wonq-glyph'))return;el.classList.add('context-glyph-button');el.insertAdjacentHTML('afterbegin',icon(name))};
const decoratePanel=(needle,name)=>{[...document.querySelectorAll('.panel')].forEach(panel=>{const heading=panel.querySelector('h2');if(heading&&heading.textContent.trim().toLowerCase().includes(needle)){panel.classList.add('context-panel');panel.style.setProperty('--context-icon',`url('${asset(name)}')`)}})};
const mount=()=>{
 const nav={spells:'spell',tales:'tales',defense:'shield',resources:'vitality',social:'social'};
 Object.entries(nav).forEach(([view,name])=>{const b=document.querySelector(`.nav [data-view="${view}"]`);if(b&&!b.querySelector('.wonq-glyph'))b.insertAdjacentHTML('afterbegin',icon(name))});
 addButtonIcon(document.querySelector('#glide'),'glide');
 addButtonIcon(document.querySelector('#hadozeeDodge'),'shield');
 addButtonIcon(document.querySelector('#giveInspiration'),'inspiration');
 addButtonIcon(document.querySelector('#drawTale'),'tales');
 ['#quickShort','#quickLong','#shortRest','#longRest'].forEach(s=>addButtonIcon(document.querySelector(s),'rest'));
 const concentration=document.querySelector('#turnConcentration');if(concentration&&!concentration.querySelector('.wonq-glyph'))concentration.insertAdjacentHTML('afterbegin',icon('concentration'));
 const slots=document.querySelector('#quickSpellSlots .quick-slots-label');if(slots&&!slots.querySelector('.wonq-glyph'))slots.insertAdjacentHTML('afterbegin',icon('spell'));
 decoratePanel('planeur','glide');decoratePanel('concentration','concentration');decoratePanel('esquive hadozee','shield');decoratePanel('inspiration bardique','social');decoratePanel('contes de l’au-delà','tales');decoratePanel('emplacements de sorts','spell');
 [...document.querySelectorAll('#spellGroups .spell')].forEach(card=>{
  if(/mot de guérison/i.test(card.textContent))addButtonIcon(card.querySelector('button'),'healing');
  if(/illusion|image silencieuse|invisibilit/i.test(card.textContent)){card.classList.add('context-panel');card.style.setProperty('--context-icon',`url('${asset('illusion')}')`)}
 });
};
mount();
const observer=new MutationObserver(mount);observer.observe(document.body,{childList:true,subtree:true});
})();
