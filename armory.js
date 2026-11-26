(() => {
  const host = el('armory-view');
  const official = 'https://worldofwarcraft.blizzard.com/en-us/forever/us/armory';
  const norm = s => String(s || '').normalize('NFD').replace(/\p{M}/gu,'').replace(/[^\p{L}\p{N}]/gu,'').toLowerCase();
  const regions = {us:'Americas & Oceania',eu:'Europe',kr:'Korea',tw:'Taiwan'};
  const slotKeys = {head:'HEAD',neck:'NECK',shoulder:'SHOULDER',back:'BACK',chest:'CHEST',wrist:'WRIST',hands:'HANDS',waist:'WAIST',legs:'LEGS',feet:'FEET',finger:'FINGER',trinket:'TRINKET',mainhand:'MAIN_HAND',offhand:'OFF_HAND',ranged:'RANGED',relic:'RANGED',wand:'RANGED'};
  const slotLabels = {HEAD:'Head',NECK:'Neck',SHOULDER:'Shoulders',BACK:'Cloak',CHEST:'Chest',WRIST:'Wrists',HANDS:'Hands',WAIST:'Waist',LEGS:'Legs',FEET:'Feet',FINGER:'Ring',TRINKET:'Trinket',MAIN_HAND:'Main hand',OFF_HAND:'Off hand',RANGED:'Ranged / relic',SHIRT:'Shirt',TABARD:'Tabard'};
  let character=null, spec='', controller=null, changedOnly=false;
  const itemURL = id=>`https://www.wowhead.com/forever/item=${Number(id)}`;
  const officialProfile = u => {
    try { const a=new URL(u);return a.protocol==='https:'&&a.hostname==='worldofwarcraft.blizzard.com'&&a.pathname.includes('/forever/')?a.href:official; } catch {return official;}
  };
  const renderURL = u => {
    try {const a=new URL(u);return a.protocol==='https:'&&a.hostname==='render.worldofwarcraft.com'?a.href:null;}catch{return null;}
  };
  const image = (url,cl) => renderURL(url)?`<img class="${cl}" src="${esc(renderURL(url))}" alt="" loading="lazy" referrerpolicy="no-referrer">`:'';
  const guideLink = sk=>{
    const c=C.find(x=>x.s.some(s=>s.k===sk));
    return c?`#${c.n.toLowerCase()}/${sk.slice(c.n.length+1)}`:'#';
  };
  function apiURL(){
    const base=window.FOREVER_ARMORY_BASE||'';
    if(base.startsWith('__PORT_')){
      if(['localhost','127.0.0.1','[::1]'].includes(location.hostname)) return 'http://127.0.0.1:8810/api/character';
      throw Error('Live lookup is not enabled on this version of the guide.');
    }
    if(!base)throw Error('Live lookup is not configured.');
    return `${base.replace(/\/$/,'')}/api/character`;
  }
  host.innerHTML=`<div class="vhead"><a class="back" href="#">← All classes</a><span class="vtitle">Character lookup</span></div><main class="armory">
    <section class="card armory-search" aria-labelledby="armory-title"><div class="eyebrow">PUBLIC ARMORY / CHARACTER LOADOUT</div>
    <h1 id="armory-title">Your character, next to the guide.</h1><p class="dim">Enter both character names and choose the region, or paste a Blizzard Forever Armory profile URL. No sign-in required.</p>
    <form id="character-form"><label>Character name or profile URL<input type="text" id="character-name" maxlength="250" placeholder="Edward Hallowvale" autocomplete="off" required aria-describedby="armory-help"></label>
    <label>Region<select id="character-region">${Object.entries(regions).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></label>
    <button id="character-submit" class="armory-action" type="submit">Look up character</button></form>
    <div class="armory-meta dim" id="armory-help"><button type="button" id="character-example">Try a public example</button><span>Uses ${source(official,'Blizzard’s public Armory')}. Gear recommendations are Alliance-only.</span></div>
    <p class="armory-status" id="character-status" aria-live="polite" role="status"></p></section>
    <div id="character-result"></div></main>`;
  const form=el('character-form'), status=el('character-status'), result=el('character-result'), nameInput=el('character-name'), regionInput=el('character-region'), submit=el('character-submit');
  const mainRoute=route;
  route=()=>{
    const shown=location.hash==='#character';
    host.hidden=!shown;
    if(!shown){mainRoute();return;}
    el('home').style.display='none';
    document.querySelectorAll('.view').forEach(v=>v.style.display='none');
    el('bar').firstChild.style.width='0';
  };
  route();
  for(const parent of [el('v-paladin-ret').querySelector('.vhead')]){
    parent.insertAdjacentHTML('beforeend','<a class="align-right dim" href="#character">Character lookup</a>');
  }
  const addGuideEntry=()=>{
    const head=ext.querySelector('.vhead');if(!head||head.querySelector('[href="#character"]'))return;
    head.insertAdjacentHTML('beforeend','<a class="dim" href="#character">Character lookup</a>');
  };
  const renderGuide=choosePage;
  choosePage=(...args)=>{renderGuide(...args);addGuideEntry()};
  addGuideEntry();

  function readInput(){
    let name=nameInput.value.trim(),region=regionInput.value;
    if(/^https?:\/\//i.test(name)){
      const p=new URL(name);
      const match=p.pathname.match(/^\/[a-z]{2}-[a-z]{2}\/forever\/(us|eu|kr|tw)\/armory\/character\/([^/]+)\/?$/i);
      if(p.protocol!=='https:'||p.hostname!=='worldofwarcraft.blizzard.com'||!match)throw Error('Paste a direct Blizzard Forever character profile URL, or enter both names.');
      region=match[1].toLowerCase();name=decodeURIComponent(match[2]);regionInput.value=region;
    }
    const words=name.normalize('NFC').replace(/’/g,"'").split(/[\s-]+/);
    if(words.length!==2||words.some(x=>!/^[\p{L}\p{M}']{1,32}$/u.test(x)))throw Error('Enter the character’s first name and surname, for example Edward Hallowvale.');
    return {name:words.join(' '),region};
  }
  const getSpecs=()=> C.find(c=>c.n.toLowerCase()===character.classKey)?.s||[];
  const activeTrees=()=>{
    const t=character.trees||[];
    return t.some(x=>x.active)?t.filter(x=>x.active):t;
  };
  function guessSpec(){
    const candidates=getSpecs();
    const tree=[...activeTrees()].sort((a,b)=>(b.points||0)-(a.points||0))[0];
    const match=candidates.find(s=>norm(s.n)===norm(tree?.name)||norm(s.k.slice(character.classKey.length+1))===norm(tree?.id));
    return match?.k||candidates[0]?.k||'';
  }
  function snapRows(ch, snap){
    const groups=new Map();
    for(const it of ch.items||[]){
      const key=String(it.slot||'').replace(/^(FINGER|TRINKET)_\d$/,'$1').replace(/^RELIC$/,'RANGED');
      if(!key)continue;
      if(!groups.has(key))groups.set(key,[]);
      groups.get(key).push(it);
    }
    const generated=[];
    for(const key of Object.keys(slotLabels)){
      const worn=groups.get(key)||[];
      const planned=(snap||[]).filter(x=>slotKeys[norm(x[0])]===key);
      const assign=planned.map(p=>{
        if(!p[1])return [null,p];
        const id=Number(p[3]?.match(/item=(\d+)/)?.[1]);
        const index=worn.findIndex(w=>id?+w.id===id:norm(w.name)===norm(p[1]));
        return [index<0?null:worn.splice(index,1)[0],p];
      });
      for(const row of assign){
        if(!row[0]&&worn.length)row[0]=worn.shift();
        if(row[0]||row[1][1])generated.push([key,...row]);
      }
      for(const item of worn)generated.push([key,item,null]);
    }
    return generated;
  }
  function gearBlock(d, checkpoint, alliance){
    const comparison=alliance&&checkpoint&&d?.gear?.snap?.[checkpoint];
    const rows=snapRows(character,comparison), diff=(a,b)=>b?.[1]&&(!a||(+a.id!==Number(b[3]?.match(/item=(\d+)/)?.[1])&&norm(a.name)!==norm(b[1])));
    const changes=rows.filter(([,a,b])=>diff(a,b)).length;
    const shortlist=changedOnly&&comparison?rows.filter(([,a,b])=>diff(a,b)):rows;
    const header=comparison?['Slot','Currently equipped',`Level ${checkpoint} guide pick`]:['Slot','Currently equipped'];
    const html=shortlist.map(([key,w,p])=>{
      const item=w?`<div class="armory-item">${image(w.icon,'armory-item-icon')}<div>${w.id?source(itemURL(w.id),w.name):esc(w.name)}<div class="dim">${[w.type,w.itemLevel?`Item level ${w.itemLevel}`:null].filter(Boolean).map(esc).join(' · ')}</div></div></div>`:'<span class="dim">Empty</span>';
      const more=w&&[...w.stats,...w.enchants].filter(Boolean);
      const choice=p?.[1]?`${itemLink(p)} <span class="armory-tag ${diff(w,p)?'':'same'}">${!w?'Fill slot':diff(w,p)?'Compare':'Match'}</span><br><small>${esc(p[2])}</small>`:'<span class="dim">No ranked pick</span>';
      return `<tr><td>${esc(slotLabels[key])}</td><td>${item}${more?.length?`<details><summary>Item details</summary><small>${more.map(esc).join('<br>')}</small></details>`:''}</td>${comparison?`<td>${choice}</td>`:''}</tr>`;
    }).join('');
    const sub=!alliance?'Your current gear is shown below. Gear rankings are only available for Alliance profiles.':!checkpoint?'The first gear checkpoint is level 5.':!comparison?'No ranked gear is available for this class and checkpoint.':`${checkpoint===60?'Level 60 pre-raid picks.':'Using the highest available checkpoint at or below your player level.'} A different item is a candidate, not a guaranteed upgrade. ${d?.gear?.url?source(d.gear.url,'Ranking source'):''}`;
    return card('Equipment',`<div class="armory-summary"><p class="dim">${sub}</p>${comparison?`<label class="armory-switch"><input id="character-changes" type="checkbox" ${changedOnly?'checked':''}> Only different picks <span class="armory-tag">${changes}</span></label>`:''}</div>${html?table(header,html,'armory-table'):'<p class="dim">No equipment rows to show with this filter.</p>'}`);
  }
  function pointPlan(d, limit){
    const flat=TreeView.order(spec);
    return [flat.filter(x=>x[0]<=limit),flat.find(x=>x[0]>limit)];
  }
  function talentBlock(d,alliance){
    const t=activeTrees(), [plan,next]=pointPlan(d,character.level);
    const ranks=new Map();
    for(const [l,n] of plan){const k=norm(n);const row=ranks.get(k)||{name:n,rank:0,first:l};row.rank++;ranks.set(k,row);}
    const raw=t.flatMap(tree=>tree.talents.map(x=>({...x,tree:tree.name})));
    const actual=new Map(raw.map(x=>[norm(x.name),x]));
    const compared=[
      ...[...ranks].map(([k,v])=>[v.name,actual.get(k)?.rank||0,v.rank,v.first]),
      ...[...actual].filter(([k])=>!ranks.has(k)).map(([,v])=>[v.name,v.rank,0,null])
    ];
    const current=t.map(tree=>`<details class="tree-panel" open><summary>${esc(tree.name)} <span class="armory-tag">${tree.points??'—'} points</span></summary><ul>${tree.talents.map(a=>`<li><strong>${esc(a.name)}</strong> <small>Rank ${a.rank}</small></li>`).join('')}</ul></details>`).join('');
    const planning=plan.length?`<p class="dim">${alliance?'This is your current build versus one leveling path, not a respec instruction.':'Talent comparison uses the class-wide point order; the linked guide’s gear and leveling route are Alliance-specific.'} ${spec===ret?source(refs.maxroll,'Maxroll build via Timesaver'):talentSource(d.guide)}</p>${table(['Talent','Current rank','Guide rank','Guide starts'],compared.map(([n,a,b,first])=>`<tr><td>${esc(n)}</td><td>${raw.length?a:'—'}</td><td>${b}</td><td>${first?'L'+first:'—'}</td></tr>`).join(''),'armory-table')}`:'<p class="dim">No talent points are planned yet at this level, or the selected guide has no plan.</p>';
    return card('Talents',`<div data-character-tree></div>${next?`<p class="note">Next guide point: ${chip(next[0])} <strong>${esc(next[1])}</strong>.</p>`:''}<div class="armory-tree-grid">${current||'<p class="dim">Blizzard didn’t return an allocated talent tree for this character.</p>'}</div>${planning}`);
  }
  function render(){
    if(!character)return;
    const c=character, d=DATA[spec], alliance=norm(c.faction)==='alliance', checkpoint=Math.floor(Math.min(60,c.level)/5)*5;
    const timestamp=c.updated&&Number.isFinite(Date.parse(c.updated))?`${new Date(c.updated).toLocaleString()} (your time zone)`:'Not provided';
    const facts=[c.race,c.class,c.faction,c.region,c.ruleset].filter(Boolean).map(esc).join(' · ');
    const specOpts=getSpecs().map(s=>`<option value="${esc(s.k)}" ${s.k===spec?'selected':''}>${esc(s.n)}</option>`).join('');
    result.innerHTML=`<section class="card character-heading"><div class="character-identity">${image(c.portrait,'armory-portrait')}<div><div class="eyebrow">BLIZZARD ARMORY SNAPSHOT</div><h2>${esc(c.name)} ${chip(c.level)}</h2><p>${facts}${c.guild?` · ${esc(c.guild)}`:''}</p><p class="dim">Armory last updated: ${esc(timestamp)} · ${source(officialProfile(c.source),'Open Blizzard profile')}</p></div></div>${specOpts?`<div class="character-spec"><label>Compare against<select id="character-spec">${specOpts}</select></label><a class="dim" href="${esc(guideLink(spec))}">Open ${alliance?'spec':'Alliance spec'} guide →</a></div>`:''}</section>${gearBlock(d,checkpoint,alliance)}${talentBlock(d,alliance)}`;
    el('character-spec')?.addEventListener('change',e=>{spec=e.target.value;render();el('character-spec')?.focus({preventScroll:true});});
    el('character-changes')?.addEventListener('change',e=>{changedOnly=e.target.checked;render();el('character-changes')?.focus({preventScroll:true});});
    if(spec)TreeView.mount(result.querySelector('[data-character-tree]'),spec,{level:c.level,observed:activeTrees()});
  }
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    controller?.abort();controller=new AbortController();
    const request=controller;
    status.className='armory-status';status.textContent='';result.innerHTML='';character=null;changedOnly=false;
    try{
      const input=readInput(),url=`${apiURL()}?${new URLSearchParams(input)}`;
      submit.disabled=true;result.setAttribute('aria-busy','true');status.textContent='Looking up the public Blizzard profile…';
      const response=await fetch(url,{signal:request.signal,credentials:'same-origin'});
      const type=response.headers.get('content-type')||'';
      if(!type.includes('application/json'))throw Error('Character lookup is temporarily unavailable. Try the official Armory.');
      const data=await response.json();
      if(!response.ok)throw Error(data.error||'The lookup didn’t succeed.');
      if(!Array.isArray(data.items)||!Array.isArray(data.trees)||!data.name)throw Error('Blizzard returned an incomplete profile.');
      if(controller!==request)return;
      character=data;spec=guessSpec();render();
      status.textContent=`Loaded ${character.name}.`;
    }catch(err){
      if(err.name==='AbortError'||controller!==request)return;
      status.classList.add('error');
      status.textContent=err instanceof TypeError?'Could not reach the lookup service. Try again or open the official Armory.':err.message;
    }finally{
      if(controller===request){submit.disabled=false;result.removeAttribute('aria-busy');}
    }
  });
  el('character-example').addEventListener('click',()=>{nameInput.value='Edward Hallowvale';regionInput.value='us';form.requestSubmit()});
})();
