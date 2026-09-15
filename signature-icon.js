(()=>{
const svg=`<svg viewBox="0 0 96 96" role="img" aria-label="Pipe fumante de Wonq" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="wpWood" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c68a50"/><stop offset=".52" stop-color="#71432f"/><stop offset="1" stop-color="#321f24"/></linearGradient><radialGradient id="wpAura"><stop offset="0" stop-color="#69a99b" stop-opacity=".22"/><stop offset="1" stop-color="#a47bb4" stop-opacity="0"/></radialGradient><filter id="wpGlow"><feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#d3a65e" flood-opacity=".55"/></filter></defs><circle cx="48" cy="52" r="41" fill="url(#wpAura)"/><g filter="url(#wpGlow)"><path class="pipe-smoke smoke-one" d="M68 35c-12-8 7-15-2-25"/><path class="pipe-smoke smoke-two" d="M76 35c11-10-6-17 5-26"/><path class="pipe-smoke smoke-three" d="M62 35c-5-8 0-13 4-18"/><path d="M10 66c22 1 41-3 57-14" fill="none" stroke="url(#wpWood)" stroke-width="8" stroke-linecap="round"/><path d="M12 63c21 0 38-4 53-13" fill="none" stroke="#e0b675" stroke-width="2" stroke-linecap="round" opacity=".7"/><path d="M62 43h25l-3 20c-2 13-10 20-20 18-10-2-15-11-11-21z" fill="url(#wpWood)" stroke="#d3a65e" stroke-width="2"/><ellipse cx="74.5" cy="43" rx="13" ry="5" fill="#171116" stroke="#d3a65e" stroke-width="2.3"/><ellipse cx="74.5" cy="43" rx="8" ry="2.4" fill="#ef9b51"/><path d="M7 62h12v9H9c-6 0-7-7-2-9z" fill="#21171a" stroke="#b77c49" stroke-width="2"/></g></svg>`;
const style=document.createElement('style');style.textContent=`
.identity:after{content:none!important}
.signature-icon{position:absolute;right:12px;top:50%;width:104px;height:104px;transform:translateY(-50%) rotate(-4deg);pointer-events:none;filter:drop-shadow(0 8px 18px #000b);z-index:1}
.signature-icon svg{width:100%;height:100%;display:block;overflow:visible}
.identity .eyebrow,.identity h1,.identity p,.identity .motto{position:relative;z-index:2}
.pipe-smoke{fill:none;stroke:#d8e5e1;stroke-width:3.2;stroke-linecap:round;stroke-dasharray:30;stroke-dashoffset:30;opacity:0}.smoke-two{stroke:#d2b9dc}
@media(max-width:767px){
 .signature-icon{width:76px;height:76px;right:6px}
 .identity{padding-right:82px!important}
}
@media(min-width:768px) and (max-width:1366px){
 .top{display:grid!important;grid-template-columns:1fr!important;gap:5px!important}
 .identity{padding:8px 82px 8px 12px!important;min-height:62px!important}
 .identity h1{font-size:1.65rem!important;margin:.05rem 0 .15rem!important;line-height:1!important}
 .identity p{font-size:.72rem!important;line-height:1.18!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;padding-right:4px!important}
 .identity .motto{margin-top:3px!important;font-size:.73rem!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
 .signature-icon{width:54px;height:54px;right:12px;top:50%;transform:translateY(-50%) rotate(-4deg)!important}
 .dashboard{display:grid!important;grid-template-columns:repeat(7,minmax(0,1fr))!important;grid-auto-rows:auto!important;padding:4px!important;gap:3px!important;overflow:hidden!important}
 .dashboard>.hpstat{grid-column:1/-1!important;grid-row:1!important;min-width:0!important;padding:5px!important;display:grid!important;grid-template-columns:auto minmax(0,1fr) auto!important;align-items:center!important;column-gap:5px!important}
 .dashboard>.hpstat>small{grid-column:1!important;grid-row:1!important;white-space:nowrap!important;margin:0!important}
 .dashboard .hpgrid{grid-column:2!important;grid-row:1!important;display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:3px!important;margin:0!important;min-width:0!important}
 .dashboard .hp-tools{grid-column:3!important;grid-row:1!important;display:grid!important;grid-template-columns:54px 1fr 1fr!important;gap:3px!important;margin:0!important;min-width:0!important}
 .dashboard>.stat:not(.hpstat){grid-row:2!important;grid-column:auto!important;min-width:0!important;padding:4px!important;text-align:center!important}
 .dashboard>.stat b{font-size:.9rem!important;line-height:1!important}
 .dashboard>.stat small{font-size:.45rem!important;line-height:1.05!important}
 .dashboard .number{height:27px!important;min-height:27px!important;padding:3px 4px!important;font-size:.75rem!important}
 .dashboard .hp-tools button{min-height:27px!important;height:27px!important;padding:2px 4px!important;font-size:.58rem!important}
}
@media(prefers-reduced-motion:no-preference){.pipe-smoke{animation:wonqSmoke 3.5s ease-in-out infinite}.smoke-two{animation-delay:1.1s}.smoke-three{animation-delay:2.1s}@keyframes wonqSmoke{0%{stroke-dashoffset:30;opacity:0;transform:translateY(4px)}24%{opacity:.82}72%{stroke-dashoffset:0;opacity:.48}100%{stroke-dashoffset:-18;opacity:0;transform:translateY(-10px)}}}
@media(min-width:768px) and (max-width:1100px){.dashboard{grid-template-columns:minmax(155px,1.25fr) repeat(4,minmax(60px,1fr))!important;gap:5px!important}.hpstat{padding:7px!important}.hpgrid{gap:4px!important;margin-top:3px!important}.hp-tools{grid-template-columns:54px 1fr 1fr!important;gap:4px!important;margin-top:4px!important}.hp-tools input{padding:4px!important}.hp-tools button{min-height:32px!important;padding:3px!important}}
@media(prefers-reduced-motion:reduce){.pipe-smoke{stroke-dashoffset:0;opacity:.58}}
`;
document.head.appendChild(style);
const mount=()=>{const id=document.querySelector('.identity');if(!id)return false;id.querySelector('.signature-icon')?.remove();const d=document.createElement('div');d.className='signature-icon';d.innerHTML=svg;id.appendChild(d);return true};
if(!mount()){const o=new MutationObserver(()=>{if(mount())o.disconnect()});o.observe(document.documentElement,{childList:true,subtree:true})}
const fav=document.createElement('link');fav.rel='icon';fav.type='image/svg+xml';fav.href='data:image/svg+xml,'+encodeURIComponent(svg);document.head.appendChild(fav);
})();
