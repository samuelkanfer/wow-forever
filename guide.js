/* The attached guide is kept as the Ret route. Other specs use the same shell. */
const DATA = window.FOREVER_DATA || {};
const ret = 'paladin-retribution';
const method = 'https://www.method.gg/wow-forever/';
const refs = {
  enchanting: method+'all-enchanting-recipes-and-best-enchants-in-wow-forever',
  consumables: method+'list-of-all-consumables-and-enchants-in-wow-forever',
  roles: 'https://wow-forever.gg/guides/systems/consumables/',
  community: 'https://classicwowforever.com/class-guides/',
  faction: 'https://worldofwarcraft.blizzard.com/en-us/news/24303313',
  lesser: 'https://wow-forever.gg/db/spells/1248511-enchant-2h-weapon-lesser-strength/',
  bone: 'https://foreverdb.net/quest/1053-in-the-name-of-the-light',
  boots: 'https://forever-hub.com/en/database/items/273025',
  maxroll: 'https://timesaver.gg/tools/wow-forever/talent-calculator/paladin'
};
const colors = {shaman:'#67a0ff'};
const ext = el('v-extended');
const source = (url,label) => `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`;
const esc = v => String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nice = s => s.split('-').map(a=>a.charAt(0).toUpperCase()+a.slice(1)).join(' ');
const keyClass = c => c.n.toLowerCase();
const levels = Array.from({length:12},(_,i)=>5*(i+1));
const profile = {
  'warrior-protection':'tank','paladin-protection':'spellTank','paladin-holy':'healer',
  'priest-holy':'healer','priest-discipline':'healer','shaman-restoration':'healer','druid-restoration':'healer',
  'priest-shadow':'caster','shaman-elemental':'caster','druid-balance':'caster',
  'druid-feral':'feral','shaman-enhancement':'strength','warrior-arms':'strength','warrior-fury':'strength',
  [ret]:'ret'
};
C.push({n:'Shaman',c:colors.shaman,s:['Elemental','Enhancement','Restoration'].map(n=>({n,k:'shaman-'+n.toLowerCase()}))});
C.sort((a,b)=>a.n.localeCompare(b.n));
for(const c of C)for(const s of c.s){
  const k=keyClass(c);
  s.k=k+'-'+(s.n==='Feral Combat'?'feral':s.n.toLowerCase().replaceAll(' ','-'));
}
let activeKey='', extTab=1, searchState={};
const selectedBIS={};
const tabNames=['Guided path','Gear list','BiS by level','Enchants & consumables','Talent Tree'];
const roles = {
  ret: ['Weapon damage / Holy damage','Brilliant Wizard Oil','Baked Salmon','Major Frenzy Potion for Deep Ret or Major Spellblasting Potion for Holy Shock; carry mana potions.','Elixir of Holy Power or Elixir of the Grizzly, depending on build.'],
  strength:['Strength melee','Sharpening stone for edged weapons; weightstone for blunt weapons','Mightfish Steak','Major Frenzy Potion; keep a healing potion for close pulls.','Elixir of Ferocity'],
  agility:['Agility melee','Sharpening stone or weightstone that matches the weapon','Swiftstrike Steak','Major Frenzy Potion; carry healing potions while questing.','Elixir of the Mongoose'],
  ranged:['Ranged physical','A scope on a ranged weapon you plan to keep','Swiftstrike Steak','Major Healing Potion or Major Mana Potion for sustain.','Elixir of the Mongoose'],
  feral:['Feral damage / bear off-set','Prioritize the permanent weapon stats appropriate to your form; skip stones for form damage.','Swiftstrike Steak for damage or Savory Turtle Stew for bear','Keep healing potions for survival; use mitigation consumables for harder tank pulls.','Elixir of the Mongoose for damage or Elixir of the Phalanx for bear.'],
  tank:['Physical tank','Sharpening stone or weightstone for threat on appropriate weapons','Savory Turtle Stew','Greater Stoneshield Potion for physical mitigation; carry Major Healing Potion.','Elixir of the Phalanx'],
  spellTank:['Paladin tank','Brilliant Wizard Oil for spell threat','Baked Salmon for threat or Savory Turtle Stew for stamina','Major Spellblasting Potion for threat or Greater Stoneshield Potion for mitigation.','Elixir of Holy Power for threat or Elixir of the Phalanx for survival.'],
  healer:['Healing and mana','Brilliant Mana Oil','Sage’s Tea','Major Mana Potion for sustain; Major Mender’s Potion for a planned burst-healing window.','Greater Mageblood Elixir'],
  caster:['Spell damage','Minor or Lesser Wizard Oil on a budget; Brilliant Wizard Oil on stronger gear','Baked Salmon','Major Spellblasting Potion for burst or Major Mana Potion for sustain.','Greater Arcane Elixir']
};
function gameRole(key){return profile[key] || (key.startsWith('hunter-')?'ranged':key.startsWith('rogue-')?'agility':'caster')}
function imageLogo(c,sm){
  const k=keyClass(c);return `<img class="lg ${sm?'sm':''}" src="./icons/${k}.jpg" alt="" width="${sm?40:56}" height="${sm?40:56}">`;
}
const chip = l => `<span class="chip">L${esc(l)}</span>`;
const table=(head,rows,classes='')=>`<div class="wrap"><table class="${classes}"><thead><tr>${head.map(x=>`<th scope="col">${esc(x)}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>`;
const wrapMain = html => `<main>${html}</main>`;
const card=(title,html,id='')=>`<section class="card"${id?` id="${id}"`:''}><h2>${esc(title)}</h2>${html}</section>`;
const rankSource=g=>source(g.url,'Classic WoW Forever');
const talentSource=g=>g.talentUpdate?`Guide’s suggested order after the ${source(g.talentUpdate.hotfix,'Blizzard November 25 hotfix')}, informed by ${source(g.talentUpdate.reference,'WoW Forever Classes')}`:`Adapted from ${rankSource(g)} (${source('https://creativecommons.org/licenses/by/4.0/','CC BY 4.0')})`;
const levelingSource=c=>source(method+`wow-forever-${keyClass(c)}-leveling-guide-and-talents`,'Method class leveling guide');
const itemType = (x,k) => x==='Relic'&&k.startsWith('hunter')?'Ranged':({Back:'Cloak',Finger:'Ring',Shoulder:'Shoulders',Wrist:'Bracers',Waist:'Belt',Hands:'Gloves',Feet:'Boots'})[x]||x;
const itemLink = x => x?.[1]?source(x[3],x[1]):'';
function switches(tab,fn){
  return tabNames.map((n,i)=>`<button type="button" class="${i+1===tab?'on':''}" aria-pressed="${i+1===tab}" data-${fn}="${i+1}">${n}</button>`).join('');
}
function navButtons(items){
  return `<nav class="inner-nav" aria-label="Guide sections"><div class="rail">${items.map(([id,name])=>`<button type="button" data-jump="${id}">${name}</button>`).join('')}</div></nav>`;
}
function guideHead(c,s){
  return `<div class="vhead" style="--cc:${c.c}"><button class="back" type="button" data-go="${keyClass(c)}">← Specs</button>${TreeView.specIcon(s.k)||imageLogo(c,true)}<div class="vtitle" style="color:${c.c}">${esc(c.n)} · ${esc(s.n)}</div><a class="align-right dim" href="#" data-go="">All classes</a></div>`;
}
const unique = rows => [...new Map(rows.map(row=>[row[3],row])).values()];
function gearList(g,key){
  const seen=new Set(), a=[];
  for(const l of levels)for(const x of g.snap[l]||[]){
    if(!x[1])continue;const id=x[3];if(seen.has(id))continue;
    seen.add(id);a.push([l,x[1],itemType(x[0],key),x[2],id]);
  }
  return a;
}
function milestones(g,k,a){
  const keySlots=k.startsWith('hunter-')?['Relic','Ranged','Main Hand']:['Main Hand','Off Hand','Relic','Ranged'];
  return (a.chapters||[]).map(([range,name,notes])=>{
    const [lo,hi]=range.match(/\d+/g).map(Number);
    const inBand=levels.filter(l=>l>=lo&&l<=hi);
    const picks=inBand.flatMap(l=>keySlots.flatMap(slot=>(g.snap[l]||[]).filter(x=>x[0]===slot&&x[1]).map(x=>[l,...x])));
    return `<article class="milestone"><div><span class="dim">${esc(range)}</span><h3>${esc(name)}</h3></div><div>${notes.map(n=>`<p>${esc(n)}</p>`).join('')||'<p>See the opening playstyle and spell priorities below.</p>'}${unique(picks.map(x=>[x[0],x[2],x[3],x[4],x[1]])).slice(0,5).map(x=>`<p class="dim">${chip(x[0])} ${itemLink(x)} · ${esc(itemType(x[4],k))} · ${esc(x[2])}</p>`).join('')}</div></article>`;
  }).join('');
}
function talentTable(key,g){
  if(!g.talents?.length)return '<p>No verified point order available.</p>';
  const total=g.talents.reduce((n,[lo,hi])=>n+hi-lo+1,0);
  return `<p class="dim">${total} points from level 10 to 60. A range means spending one point each level; the last column gives the rank reached at the end of the range.</p>${table(['Player level','Talent','Rank after band'],g.talents.map(([lo,hi,name,rank,why])=>`<tr><td class="row-label"><label class="chk"><input type="checkbox" data-check="${key}-talent-${lo}" aria-label="${esc(name)}, level ${lo}"><span>${chip(lo===hi?lo:`${lo}–${hi}`)}</span></label></td><td><strong>${esc(name)}</strong>${why?`<br><small>${esc(why)}</small>`:''}</td><td>${esc(rank)}</td></tr>`).join(''),'gear-table')}`;
}
function trainerTable(key,g){
  const talents=new Map(g.talents.map(x=>[x[2].toLowerCase(),x[0]]));
  return `<p class="dim"><strong>Bold</strong> spells are highlighted by the spec guide. A star marks a talent-path unlock, not a trainer purchase. Level 1 entries may already be known. Some spells require a class quest, race, faction or pet trainer. The publisher only names selected rank upgrades in this view.</p>${table(['Player level','New spells & ability unlocks','Rank upgrades'],g.trainer.map(([l,spells,ranks])=>`<tr><td class="row-label"><label class="chk"><input type="checkbox" data-check="${key}-trainer-${l}" aria-label="Level ${l} checked"><span>${chip(l)}</span></label></td><td>${spells.map(([name,core])=>{const n=esc(name+(talents.get(name.toLowerCase())===l?' ★':''));return core?`<strong>${n}</strong>`:n}).join(', ')||'—'}</td><td>${esc(ranks.replace(/^New ranks: ?/i,''))||'—'}</td></tr>`).join(''),'gear-table')}`;
}
function renderRoute(c,s,d){
  const {guide:g,gear}=d;
  return navButtons([['ext-milestones','Leveling route'],['ext-talents','Talents'],['ext-trainer','Trainer']])+wrapMain(
    card(`${s.n} leveling overview`,`<p>${esc(g.lead)}</p><p class="dim"><strong>Leveling stat priorities:</strong> ${g.stats.map(esc).join(' → ')}</p><p class="source-row dim">${rankSource(g)}${levelingSource(c)}${source(gear.url,'Timesaver Alliance gear rankings')}</p>`)+
    card('Guided path by player level',`<p class="dim">Spec milestones and rotation notes are from ${rankSource(g)}. Listed gear comes from the first relevant Timesaver snapshot in each band; these are suggestions, not required farms.</p><div class="milestones">${milestones(gear,s.k,g)}</div>`,'ext-milestones')+
    card('Talent order by level',talentTable(s.k,g)+`<p class="foot-note">${talentSource(g)}.</p>`,'ext-talents')+
    card('Trainer visits & ability unlocks',trainerTable(s.k,g)+`<p class="foot-note">Spell schedule: ${rankSource(g)}, client build 1.60.1.70862; older guide snapshot, not an in-game test.</p>`,'ext-trainer')
  );
}
function gearRows(items){
  return items.map(([l,n,t,p,u])=>`<tr data-player-level="${l}"><td>${chip(l)}</td><td>${source(u,n)} <span class="ty">${esc(t)}</span></td><td>${esc(p)}</td></tr>`).join('');
}
function renderGear(key,g){
  const filter=searchState[key]||{};
  return wrapMain(card('Gear, player level & location',
    `<p class="dim">Each level is the first five-level checkpoint where this item is ranked first for a slot. It’s a recommended shopping or dungeon checkpoint, not an exact drop, quest or equip requirement. ${source(g.url,'Timesaver Alliance rankings')}</p>
    <div class="tools"><label>Search gear<input id="ext-search" type="search" placeholder="Item, slot, dungeon or quest" value="${esc(filter.query)}"></label><label>My player level<input id="ext-level" type="number" min="1" max="60" placeholder="1–60" value="${esc(filter.level)}"></label></div>
    <p class="dim" id="ext-count" aria-live="polite"></p>${table(['Player level','Gear & type','Location'],gearRows(gearList(g,key)),'gear-table')}`));
}
function filterGear(){
  if(!el('ext-search'))return;const q=el('ext-search').value.trim().toLowerCase(),v=el('ext-level').value,l=+v||60;
  searchState[activeKey]={query:el('ext-search').value,level:v};
  const rows=[...ext.querySelectorAll('[data-player-level]')];
  let n=0;for(const r of rows){r.hidden=!(Number(r.dataset.playerLevel)<=l&&r.textContent.toLowerCase().includes(q));n+=!r.hidden}
  el('ext-count').textContent=n===0?'No matching gear. Try a higher level or a different search.':`${n} ${n===1?'item':'items'}`;
}
function bisCard(key,g){
  const n=selectedBIS[key]||5;
  return card('Alliance BiS by player level',
    `<p class="dim">Timesaver scores gear by spec stat weights. These are source-ranked picks, not a simulation of your character or a requirement to farm each item. Your starting zone and profession can affect access. ${source(g.url,'Timesaver ranking and methodology')}</p>
    <div class="subs" aria-label="Choose a player level">${levels.map(l=>`<button class="sub ${l===n?'on':''}" type="button" aria-pressed="${l===n}" data-bis="${l}">L${l}</button>`).join('')}</div>
    <h3 class="level-stat">${n===60?'Level 60 · Pre-raid BiS':`Level ${n} · Gear snapshot`}</h3>
    ${table(['Slot','Item','Where to get it'],(g.snap[n]||[]).map(x=>`<tr><td>${esc(itemType(x[0],key))}</td>${x[1]?`<td>${itemLink(x)}</td><td>${esc(x[2])}</td>`:`<td colspan="2" class="dim">${esc(x[2]||'No clear upgrade')}</td>`}</tr>`).join(''),'gear-table')}`);
}
const roleSlots={
  tank:[['Weapon','Crusader (threat) or Agility'],['Neck','Deflection'],['Back','Greater Resistance'],['Chest','Greater Stats or Major Stamina'],['Wrists','Superior Stamina'],['Hands','Superior Strength or Minor Haste'],['Feet','Greater Stamina']],
  healer:[['Weapon','Mighty Spirit (1H) or Mighty Healing Power (2H)'],['Off-hand','Wisdom'],['Neck','Healing Power'],['Chest','Greater Stats or Major Intellect'],['Wrists','Healing Power or Mana Regeneration'],['Hands','Minor Haste'],['Feet','Spirit or Greater Stamina']],
  physical:[['Weapon','Crusader for Strength builds; Agility for ranged and Feral stat sticks'],['Neck','Strength or Agility'],['Back','Agility'],['Chest','Greater Stats'],['Wrists','Superior Strength for Strength builds'],['Hands','Superior Strength or Greater Agility'],['Feet','Greater Agility']],
  caster:[['Weapon','Mighty Intellect or Revelation (1H); Spellblasting (2H)'],['Off-hand','Wisdom'],['Neck','Spell Power'],['Chest','Greater Stats or Major Intellect'],['Wrists','Greater Spellpower or Superior Intellect'],['Hands','School power where appropriate, or Minor Haste'],['Feet','Greater Stamina']]
};
const scopeNote = 'Save expensive permanent enchants for a weapon you expect to keep through endgame dungeons or your first raids. An enchant stays on the item when you unequip it; it does not transfer to the replacement.';
function renderEnchant(k,d){
  const r=gameRole(k), opt=roles[r], m=d.enchants;
  const baseline=r==='tank'||r==='spellTank'?'tank':r==='healer'?'healer':r==='caster'?'caster':'physical';
  const end=(d.gear.snap[60]||[]).filter(x=>x[1]&&(r==='ranged'?['Ranged','Relic'].includes(x[0]):x[0]==='Main Hand'));
  const target=end.length?end.map(itemLink).join(' / '):'your long-term level 60 weapon';
  const decision=({
    ret:`Skip Crusader on Verigan’s Fist and most midgame swaps. Bonebiter is the first optional ${source(refs.lesser,'Lesser Strength')} target if keeping it for several levels; consider the same budget option on Alcaz Willcrusher only if it will last. Put Crusader on ${target} if that’s your long-term two-hander. If you get a better keeper first, enchant that instead. Spellblasting is a separate option for a spell-heavy build.`,
    strength:`Skip Crusader during routine swaps. Use a cheap temporary stone or, on an enduring two-hander, price ${source(refs.lesser,'Lesser Strength')}. At 60, ${target} is a candidate for Crusader if you expect to keep it. For dual-wield, upgrade the main hand first; avoid enchanting a short-lived off-hand.`,
    agility:`If you want Crusader, start with ${target} once it’s your long-term main hand and your spec recommendations favor it. Compare Agility first. Don’t pay for two Crusaders while either weapon is likely to be replaced.`,
    ranged:`Save money for the ranged weapon. Consider a scope on ${target} if it is the ranged weapon you are actually keeping. Don’t buy Crusader for a ranged-focused leveling set.`,
    feral:`Use Agility on ${target} if it’s your long-term Cat weapon; for a Bear set, match your mitigation goal instead. Don’t buy Crusader for form damage.`,
    caster:`No Crusader. Use a budget oil while swapping weapons. Only pay for a permanent caster enchant on ${target} if it’s a keeper, and pick a recipe that fits the weapon type.`,
    healer:`No Crusader. Use mana and healing consumables before buying an expensive enchant. Consider the listed weapon enchant on ${target} when you commit to that healing weapon.`,
    tank:`Consider Crusader on ${target} only for a keeper weapon and a threat-focused set. Skip it on leveling swaps; spend on survival if dying is the actual problem.`,
    spellTank:`Skip Crusader while leveling. At 60, decide whether ${target} is a keeper and what your set needs: threat, mana or durability. Method's Protection list is an early projection, not a universal Crusader recommendation.`
  })[r];
  const slotTable=m?.slots?.length>1?table(m.slots[0].map((x,i)=>x||['Slot','Enchant','Alternative'][i]||'Option'),m.slots.slice(1).map(row=>`<tr>${row.map(x=>`<td>${esc(x||'—')}</td>`).join('')}</tr>`).join(''),'gear-table'):table(['Slot','Endgame comparison'],roleSlots[baseline].map(row=>`<tr>${row.map(x=>`<td>${esc(x)}</td>`).join('')}</tr>`).join(''));
  return wrapMain(card('Where the gold is worth spending',`<p class="note">${decision}</p><p>${scopeNote}</p>${['ret','tank','spellTank','strength','agility'].includes(r)?`<p class="dim">Crusader recipe: Enchanting 300, 4 Large Brilliant Shards and 2 Righteous Orbs. Recipe skill is the enchanter’s requirement, not your character level. ${source(refs.enchanting,'Method recipe list')}</p>`:''}`)+
    card(m?.slots?.length>1?'Endgame enchants by slot · spec source':'Endgame enchants by slot · role baseline',
      `<p class="dim">${m?.slots?.length>1?`${source(m.url,'Method spec guide')}. Early/endgame suggestions, not a leveling shopping list.`:`${source(refs.enchanting,'Method role tables')}. No verified spec-specific slot list was available in the source set.`} Use cheap enchants or skip them on gear you’re about to replace.</p>${slotTable}`)+
    card('Consumables',`<p class="dim"><strong>${esc(opt[0])}.</strong> Start with affordable food and recovery; these names are late-game targets, not level 1 shopping. Don’t assume different effects stack. ${source(refs.consumables,'Method consumable list')} · ${source(refs.roles,'Role and level references')}${m?.url?` · ${source(m.url,'Spec consumables')}`:''}</p>${table(['Category','Recommendation'],[['Weapon buff / scope',opt[1]],['Food',opt[2]],['Potion',opt[3]],['Elixir',opt[4]]].map(([a,b])=>`<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join(''))}`));
}
function remember(container){
  container.querySelectorAll('input[data-check]').forEach(c=>{c.checked=getCheck(c.dataset.check);c.onchange=()=>{setCheck(c.dataset.check,c.checked);refreshProgress()}});
}
function refreshProgress(){
  const current=activeKey===ret?el('v-paladin-ret'):activeKey?ext:null;
  let inputs=current?[...current.querySelectorAll('input[type="checkbox"]')]:[];
  el('bar').firstChild.style.width=`${inputs.length?100*inputs.filter(x=>x.checked).length/inputs.length:0}%`;
}
function choosePage(c,s,tab){
  const d=DATA[s.k];extTab=tab;
  const content=tab===5?treePage(s.k):!d?.guide||!d?.gear?wrapMain(card('Guide data unavailable','<p>A source could not be loaded for this specialization.</p>')):tab===1?renderRoute(c,s,d):tab===2?renderGear(s.k,d.gear):tab===3?wrapMain(bisCard(s.k,d.gear)):renderEnchant(s.k,d);
  ext.innerHTML=guideHead(c,s)+`<div class="gtabs tabs" role="group" aria-label="Guide tabs">${switches(tab,'tab')}</div>`+content;
  remember(ext);if(tab===2)filterGear();
  if(tab===5)TreeView.mount(ext.querySelector('[data-spec-tree]'),s.k);
  if(tab===1)refreshProgress();
}
function treePage(key){
  const build=key===ret?source(refs.maxroll,'Maxroll path via Timesaver'):DATA[key]?.guide?talentSource(DATA[key].guide):'The leveling guide';
  return wrapMain(card('Talent Tree',`<p class="dim">Choose a player level to see where the leveling guide spends points across all three trees. Select any node to inspect its ranks and prerequisites. The full point order is still in Guided path.</p><p class="dim">${build}.</p><div data-spec-tree><p class="dim">Talent layout is unavailable.</p></div>`));
}
function findSpec(){
  const [name,id]=location.hash.slice(1).split('/');
  const c=C.find(x=>keyClass(x)===name);
  const aliases={ret:'retribution',prot:'protection',beastmastery:'beast-mastery',feralcombat:'feral'};
  return [c,c?.s.find(s=>s.k===`${name}-${aliases[id]||id}`)];
}
function appRoute(){
  const [c,s]=findSpec();const changed=(s?.k||'')!==activeKey;activeKey=s?.k||'';
  el('home').style.display=s?'none':'block';
  document.querySelectorAll('.view').forEach(v=>v.style.display='none');
  ext.hidden=(!s||s.k===ret);
  if(s){
    if(s.k===ret){el('v-paladin-ret').style.display='block';if(changed)show(1)}
    else{ext.style.display='block';choosePage(c,s,changed?1:extTab)}
  }else if(c){
    el('classes').style.display='none';el('specs').style.display='block';
    el('sph').style.setProperty('--cc',c.c);el('splogo').innerHTML=imageLogo(c);el('spt').textContent=c.n;el('spt').style.color=c.c;
    el('sg').innerHTML=c.s.map(s=>`<button class="sc sc-spec" type="button" style="--cc:${c.c}" data-go="${keyClass(c)}/${s.k.slice(keyClass(c).length+1)}">${TreeView.specIcon(s.k)}<span><b>${esc(s.n)}</b><br><span class="badge">${roles[gameRole(s.k)][0]}</span></span></button>`).join('');
  }else{
    el('specs').style.display='none';el('classes').style.display='grid';
    el('classes').innerHTML=C.map(c=>`<button class="cc" type="button" style="--cc:${c.c}" data-go="${keyClass(c)}">${imageLogo(c)}<span class="class-name">${c.n}</span><span class="dim">${c.s.map(x=>x.n).join(' · ')}</span></button>`).join('');
  }
  refreshProgress();
}
function retSetup(){
  const d=DATA[ret];if(!d?.gear)return;
  const view=el('v-paladin-ret'), title=el('vt-paladin-ret');
  title.textContent='Paladin · Retribution';title.style.color='#f58cba';
  view.querySelector('.vhead').style.setProperty('--cc','#f58cba');el('vl-paladin-ret').innerHTML=TreeView.specIcon(ret)||imageLogo(C.find(x=>x.n==='Paladin'),true);
  view.querySelector('.gtabs').insertAdjacentHTML('beforeend','<button id="b5" type="button" onclick="show(5)" aria-pressed="false">Talent Tree</button>');
  view.insertAdjacentHTML('beforeend',`<div id="p5" class="pg">${treePage(ret)}</div>`);
  TreeView.mount(el('p5').querySelector('[data-spec-tree]'),ret);
  view.querySelector('.vhead .back').setAttribute('onclick',"go('paladin')");view.querySelector('.vhead .back').textContent='← Specs';
  const nav=el('p1').querySelector('nav');nav.classList.add('inner-nav');
  const rail=document.createElement('div');rail.className='rail';rail.append(...nav.children);nav.append(rail);
  for(const a of rail.querySelectorAll('a')){a.href='#paladin/ret';a.addEventListener('click',e=>e.preventDefault())}
  rail.insertAdjacentHTML('beforeend','<button type="button" data-jump="trainer-detail">Trainer ranks</button>');
  el('p1').querySelector('main').insertAdjacentHTML('beforeend',card('Trainer visits & additional ranks',`<p>Use the milestone trainer calls in your route as the priority list. This supplemental client schedule follows a different leveling build, so its starred talent abilities are not instructions to change your point order.</p>${trainerTable(ret,d.guide)}<p class="foot-note">${rankSource(d.guide)} · ${levelingSource(C.find(x=>x.n==='Paladin'))}</p>`,'trainer-detail'));
  remember(el('p1'));
  el('q').setAttribute('aria-label','Search gear, type or location');el('lv').setAttribute('aria-label','My player level');
  for(const a of view.querySelectorAll('#p1 a,#p2 a')){
    const name=a.textContent.trim(), row=a.closest('tr')||a.closest('li');
    if(!row)continue;
    if(name==='Raptorclaw Greaves'){
      a.href='https://www.wowhead.com/forever/item=273025';row.querySelector('.ty').textContent='Boots (mail)';
    }
    if(name==='Bonebiter'){
      a.href='https://www.wowhead.com/forever/item=6830';row.querySelector('.ty').textContent='2H axe';
      const small=row.querySelector('small');if(small) small.textContent='In the Name of the Light, Scarlet Monastery (quest choice). Starts at level 34; group for the full run.';
    }
    const match=Object.values(d.gear.snap).flat().find(x=>x[1]===name);
    if(match)a.href=match[3];
  }
  el('p1').querySelector('.card').innerHTML=`<p class="dim">Original Ret route from your gear notes, with ${levelingSource(C.find(x=>x.n==='Paladin'))}, ${source('https://mobalytics.gg/wow-forever/classes/retribution-paladin-guide','Mobalytics')} and the Maxroll talent path via ${source(refs.maxroll,'Timesaver')}. L badges mean recommended player level, not item level. Items with conflicting source levels are marked in the original path; unverified item types still need a tooltip check. Corrected slots: ${source(refs.boots,'Raptorclaw Greaves')} and ${source(refs.bone,'Bonebiter quest')}.</p>`;
  el('p3').innerHTML=wrapMain(bisCard(ret,d.gear));el('p4').innerHTML=renderEnchant(ret,d);
  el('p2').querySelector('.wrap table').classList.add('gear-table');
  el('directory-note').insertAdjacentHTML('beforeend',`<p class="dim">All nine classes and 27 talent-tree specs, including ${source(refs.faction,'Dwarf Shaman')}. Talent and spell extracts adapted from ${source(refs.community,'Classic WoW Forever')} (${source('https://creativecommons.org/licenses/by/4.0/','CC BY 4.0')}); Alliance gear checkpoints from ${source('https://timesaver.gg/tools/wow-forever/leveling-gear','Timesaver')}. Independent fan guide. Class icons are Blizzard artwork supplied via Wowhead.</p>`);
}
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-go],[data-tab],[data-bis],[data-jump]');if(!b)return;
  if('go'in b.dataset){e.preventDefault();go(b.dataset.go);return}
  if('jump'in b.dataset){el(b.dataset.jump)?.scrollIntoView({block:'start'});return}
  const [c,s]=findSpec();if(!s)return;
  if(b.dataset.tab){choosePage(c,s,Number(b.dataset.tab));window.scrollTo({top:0,behavior:'instant'});ext.querySelector(`[data-tab="${b.dataset.tab}"]`)?.focus({preventScroll:true});return}
  if(b.dataset.bis){
    const level=Number(b.dataset.bis);selectedBIS[s.k]=level;
    (s.k===ret?el('p3'):ext).querySelector('main').innerHTML=bisCard(s.k,DATA[s.k].gear);
    document.querySelector(`${s.k===ret?'#p3':'#v-extended'} [data-bis="${level}"]`)?.focus({preventScroll:true});
  }
});
document.addEventListener('input',e=>{if(e.target.matches('#ext-search,#ext-level'))filterGear()});
document.addEventListener('change',e=>{if(e.target.matches('input[type="checkbox"]'))refreshProgress()});
route=appRoute;
retSetup();appRoute();
