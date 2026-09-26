(()=>{
const spellDocs={
"Lueurs féeriques":{
 text:"Un cube de 6 m à 18 m est illuminé pendant jusqu’à 1 minute avec concentration. Les créatures présentes font un JdS de Dextérité ; en cas d’échec elles émettent une faible lumière, ne peuvent pas bénéficier de l’invisibilité et les attaques contre elles ont l’avantage si l’attaquant peut les voir.",
 source:"https://www.aidedd.org/dnd/sorts.php?vf=lueurs-feeriques"
},
"Détection de la magie":{
 text:"Pendant 10 minutes avec concentration, Wonq perçoit la présence de magie dans un rayon de 9 m. Par une action, il peut voir l’aura autour d’une créature ou d’un objet magique visible et identifier l’école de magie. Le sort est un rituel.",
 source:"https://www.aidedd.org/dnd/sorts.php?vf=detection-de-la-magie"
},
"Suggestion":{
 text:"Une créature visible à 9 m, capable d’entendre et de comprendre Wonq, fait un JdS de Sagesse. En cas d’échec, elle suit au mieux une suggestion formulée de façon raisonnable pendant jusqu’à 8 heures avec concentration. Le sort prend fin si la tâche est accomplie ou si Wonq ou ses compagnons blessent la cible.",
 source:"https://www.aidedd.org/dnd/sorts.php?vf=suggestion"
},
"Invisibilité":{
 text:"Une créature touchée devient invisible pendant jusqu’à 1 heure avec concentration. Tout ce qu’elle porte reste invisible avec elle. Le sort prend fin si la cible attaque ou lance un sort. Avec un emplacement supérieur, Wonq peut cibler une créature supplémentaire par niveau au-delà du niveau 2.",
 source:"https://www.aidedd.org/dnd/sorts.php?vf=invisibilite"
},
"Restauration partielle":{
 text:"Wonq touche une créature et met fin à une maladie ou à l’une des conditions suivantes : aveuglé, assourdi, paralysé ou empoisonné.",
 source:"https://www.aidedd.org/dnd/sorts.php?vf=restauration-partielle"
},
"Motif hypnotique":{
 text:"Un cube de 9 m à 36 m se remplit brièvement de lueurs. Chaque créature qui les voit fait un JdS de Sagesse. En cas d’échec, elle est charmée, incapable d’agir et sa vitesse devient 0 pendant jusqu’à 1 minute avec concentration. L’effet prend fin pour une cible si elle subit des dégâts ou si quelqu’un utilise une action pour la secouer.",
 source:"https://www.aidedd.org/dnd/sorts.php?vf=motif-hypnotique"
},
"Dissipation de la magie":{
 text:"Choisissez une créature, un objet ou un effet magique à 36 m. Les sorts actifs de niveau 3 ou moins sur la cible prennent fin automatiquement. Pour chaque sort de niveau 4 ou plus, Wonq fait un test de Charisme contre un DD égal à 10 + le niveau du sort. Un emplacement supérieur dissipe automatiquement les sorts d’un niveau inférieur ou égal à celui de l’emplacement utilisé.",
 source:"https://www.aidedd.org/dnd/sorts.php?vf=dissipation-de-la-magie"
},
"Porte dimensionnelle":{
 text:"Wonq se téléporte jusqu’à 150 m vers un lieu qu’il voit, visualise ou décrit par une distance et une direction. Il peut emmener une créature consentante de sa taille ou plus petite située à 1,50 m de lui. Si la destination est occupée, la téléportation échoue et les voyageurs subissent 4d6 dégâts de force.",
 source:"https://www.aidedd.org/dnd/sorts.php?vf=porte-dimensionnelle"
},
"Invisibilité supérieure":{
 text:"Wonq ou une créature touchée devient invisible pendant jusqu’à 1 minute avec concentration. Tout ce que la cible porte ou transporte est également invisible tant que cela reste sur elle. Contrairement à Invisibilité, attaquer ou lancer un sort ne met pas fin à l’effet.",
 source:"https://www.aidedd.org/dnd/sorts.php?vf=invisibilite-superieure"
}
};

const style=document.createElement("style");
style.textContent=`
.spell-doc{margin-top:10px;padding-top:8px;border-top:1px solid #3a323a}
.spell-doc summary{display:flex;align-items:center;justify-content:space-between;gap:8px;cursor:pointer;color:var(--gold);font-weight:800;font-size:.82rem;list-style:none;user-select:none}
.spell-doc summary::-webkit-details-marker{display:none}
.spell-doc summary:after{content:'⌄';font-size:1rem;color:var(--muted);transition:transform .18s ease}
.spell-doc[open] summary:after{transform:rotate(180deg)}
.spell-doc-body{margin-top:8px;color:#ddd3c5;font-size:.84rem;line-height:1.5}
.spell-doc-source{display:inline-block;margin-top:7px;color:var(--teal);font-size:.78rem;text-decoration:none}
.spell-doc-source:hover,.spell-doc-source:focus-visible{text-decoration:underline}
`;
document.head.appendChild(style);

document.querySelectorAll("#spellGroups .spell").forEach(card=>{
 const name=card.querySelector("h3")?.textContent?.trim();
 const doc=spellDocs[name];
 if(!doc || card.querySelector(".spell-doc")) return;
 const details=document.createElement("details");
 details.className="spell-doc";
 details.innerHTML='<summary>Description du sort</summary><div class="spell-doc-body">'+esc(doc.text)+'<br><a class="spell-doc-source" href="'+doc.source+'" target="_blank" rel="noopener noreferrer">Source AideDD ↗</a></div>';
 const cast=card.querySelector(".spellCast");
 card.insertBefore(details,cast||null);
});
})();