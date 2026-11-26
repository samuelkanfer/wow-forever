(() => {
  const host=el('tier-list-view');
  let snapshot=window.FOREVER_TIERS;
  const origin='https://mythicsim.com';
  const boards={
    single:['Single-target DPS','One target, reference builds with trinkets.'],
    multi:['Five-target DPS','Five targets for one minute, reference builds without trinkets.'],
    tank:['Tank threat','Single-target threat per second (TPS), reference builds with trinkets. Threat is not a survivability ranking.']
  };
  const mappings={
    hunter:'hunter-beast-mastery', 'hunter-turret':'hunter-beast-mastery', warrior:'warrior-fury',
    'feral-bear-druid':'druid-feral','survival-hunter-melee':'hunter-survival','marksmanship-hunter-turret':'hunter-marksmanship',
    'demonology-warlock-fire':'warlock-demonology','destruction-warlock-fire':'warlock-destruction'
  };
  let mode='single', classFilter='', includeVariants=false;
  let importing=false, importMessage='', importError=false;
  function apiURL(){
    const base=window.FOREVER_ARMORY_BASE||'';
    if(base.startsWith('__PORT_')&&['localhost','127.0.0.1','[::1]'].includes(location.hostname))return 'http://127.0.0.1:8810/api/tier-list';
    if(!base||base.startsWith('__PORT_'))throw Error('Live imports are unavailable on this version of the guide.');
    return `${base.replace(/\/$/,'')}/api/tier-list`;
  }
  function guideKey(r){
    const mapped=mappings[r.id]||`${r.classKey}-${r.id.replace(new RegExp(`-${r.classKey}$`),'')}`;
    return DATA[mapped]?mapped:'';
  }
  function renderFrame(){
    const classes=C.map(c=>`<option value="${keyClass(c)}">${esc(c.n)}</option>`).join('');
    host.innerHTML=`<div class="vhead"><a class="back" href="#">← All classes</a><span class="vtitle">Tier List</span><a class="align-right dim" href="#class-chooser">What class should I play?</a></div>
      <main class="tier-shell"><section class="card tier-intro"><div class="eyebrow">REFERENCE SIMULATIONS / WORLD OF WARCRAFT: FOREVER</div><h1 tabindex="-1" id="tier-title">WoW Forever Tier List</h1><p class="dim">Compare MythicSim’s reference builds. These are simulated results, not live raid logs, leveling advice, healer rankings, or Alliance-only rankings.</p><div class="tier-toolbar"><div class="tier-controls" role="group" aria-label="Ranking scenario">${Object.entries(boards).map(([k,v])=>`<button class="back" type="button" data-tier-mode="${k}">${esc(v[0])}</button>`).join('')}</div><button class="armory-action" id="tier-import" type="button" ${importing?'disabled':''}>${importing?'Importing…':'Import latest'}</button></div><p id="tier-import-status" class="armory-status${importError?' error':''}" role="status">${esc(importMessage)}</p></section>
      <div class="tier-filters"><label>Class <select id="tier-class"><option value="">All classes</option>${classes}</select></label><label class="armory-switch" id="tier-variants-label"><input id="tier-variants" type="checkbox"> Include alternate playstyles</label></div><div id="tier-results"></div></main>`;
    el('tier-class').value=classFilter;
    el('tier-variants').checked=includeVariants;
  }
  function renderResults(){
    const results=el('tier-results');
    const board=snapshot?.[mode];
    host.querySelectorAll('[data-tier-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tierMode===mode)));
    el('tier-variants-label').hidden=mode==='tank';
    if(!board){results.innerHTML=`<p class="card">This snapshot is unavailable. ${source(origin+'/wow-forever/tier-list','Open MythicSim')}.</p>`;return;}
    const rank=includeVariants&&mode!=='tank'?'full':'best';
    const overall=board.rows.filter(r=>r[rank]!==null).sort((a,b)=>a[rank]-b[rank]);
    const filtered=overall.filter(r=>!classFilter||r.classKey===classFilter);
    const grouped=new Map();
    for(const row of filtered){if(!grouped.has(row.tier))grouped.set(row.tier,[]);grouped.get(row.tier).push(row);}
    const direct=origin+board.path+(mode==='tank'?'#tank-specs':'');
    const fmt=n=>n.toLocaleString('en-US');
    const top=overall[0];
    results.innerHTML=`<section class="card tier-meta"><div><h2>${esc(boards[mode][0])}</h2><p>${esc(boards[mode][1])}</p><p class="dim">MythicSim snapshot: ${esc(board.stamp)} · ${esc(board.iterations)} iterations · Engine ${esc(board.engine)}. ${source(direct,'Open the source rankings ↗')}</p></div><div class="tier-leader"><span class="dim">Top reference build</span><strong>${esc(top.name)}</strong><span>${fmt(top.value)} ${board.unit}</span></div></section><p class="tier-count dim" role="status">${filtered.length} of ${overall.length} ranked builds shown. Ranks are from the full scenario.</p>${filtered.length?[...grouped].map(([tier,rows])=>`<section class="tier-band tier-${esc(tier[0].toLowerCase())}" aria-label="Tier ${esc(tier)}"><div class="tier-band-label"><span class="dim">TIER</span><h2>${esc(tier)}</h2></div><div class="tier-row-grid">${rows.map(r=>{
      const c=C.find(c=>keyClass(c)===r.classKey), sk=guideKey(r), icon=(sk&&TreeView.specIcon(sk))||(c&&imageLogo(c,true))||'';
      const percent=Math.round(100*r.value/top.value);
      const guide=sk?`<a href="#${r.classKey}/${esc(sk.slice(r.classKey.length+1))}">Leveling guide</a>`:'';
      return `<article class="tier-spec" style="--cc:${c?.c||'#aaa'}"><div class="tier-spec-head">${icon}<div><p class="dim">#${r[rank]}${r.experimental?' · Experimental':''}</p><h3>${esc(r.name)}</h3></div></div><div class="tier-score"><strong>${fmt(r.value)} <small>${board.unit}</small></strong><span class="dim">${percent}% of top</span></div><meter min="0" max="100" value="${percent}" aria-label="${percent}% of the top reference result"></meter><p class="tier-build dim">${[r.race,r.build].filter(Boolean).map(esc).join(' · ')}</p><div class="tier-links">${source(origin+r.sim,'Sim details ↗')}${guide}</div></article>`;
    }).join('')}</div></section>`).join(''):'<p class="card dim">MythicSim has no builds for this class in the selected scenario. Try a different class or scenario.</p>'}<p class="foot-note">The snapshot keeps MythicSim’s tier letters and preset races, including non-Alliance races. Alternate builds and experimental hybrids are not separate specs in the guide. See ${source(direct,'MythicSim')} for its latest data and methodology.</p>`;
  }
  host.addEventListener('click',e=>{
    const choice=e.target.closest('[data-tier-mode]')?.dataset.tierMode;
    if(choice&&choice!==mode){mode=choice;renderResults();}
    if(e.target.closest('#tier-import'))importLatest();
  });
  async function importLatest(){
    if(importing)return;
    importing=true;
    importError=false;
    const update=message=>{
      importMessage=message;
      const button=el('tier-import');
      if(button){button.disabled=importing;button.textContent=importing?'Importing…':'Import latest';}
      const status=el('tier-import-status');
      if(status){status.textContent=message;status.classList.toggle('error',importError);}
    };
    let message='The import didn’t finish. Your current snapshot is unchanged.';
    update('Checking MythicSim for the latest rankings…');
    try{
      const result=await fetch(apiURL(),{credentials:'same-origin',signal:AbortSignal.timeout(20000)});
      const payload=await result.json();
      if(!result.ok)throw Error(payload.error||message);
      if(!['single','multi','tank'].every(k=>payload.snapshot?.[k]?.rows?.length))throw Error(message);
      snapshot=payload.snapshot;
      if(!host.hidden)renderResults();
      message=payload.checkedRecently?'Already checked within the last minute. Showing the latest imported snapshot.':'Import complete. Showing MythicSim’s latest available snapshots.';
    }catch(err){
      importError=true;
      if(err instanceof Error && !['TimeoutError','TypeError','SyntaxError'].includes(err.name))message=err.message;
    }finally{
      importing=false;update(message);
    }
  }
  host.addEventListener('change',e=>{
    if(e.target.id==='tier-class'){classFilter=e.target.value;renderResults();}
    if(e.target.id==='tier-variants'){includeVariants=e.target.checked;renderResults();}
  });
  const priorRoute=route;
  route=()=>{
    const shown=location.hash==='#tier-list';
    host.hidden=!shown;
    if(!shown){priorRoute();return;}
    el('home').style.display='none';
    el('class-quiz').hidden=el('armory-view').hidden=true;
    document.querySelectorAll('.view').forEach(v=>v.style.display='none');
    el('bar').firstChild.style.width='0';
    renderFrame();renderResults();el('tier-title').focus({preventScroll:true});
  };
  route();
})();
