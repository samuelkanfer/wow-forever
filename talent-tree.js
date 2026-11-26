/* Read-only tree views. Point order remains the guide's source of truth. */
const TreeView=(()=>{
  const db=window.FOREVER_TREES;
  const clean=s=>String(s||'').normalize('NFD').replace(/\p{M}|[^\p{L}\p{N}]/gu,'').toLowerCase();
  const classKey=spec=>spec.split('-')[0];
  const canonical=s=>({feralcombat:'feral',shadowmagic:'shadow',elementalcombat:'elemental',defense:'defence'})[clean(s)]||clean(s);
  const specTree=sk=>db?.trees[classKey(sk)]?.find(t=>canonical(t.slug)===canonical(sk.slice(classKey(sk).length+1))||canonical(t.name)===canonical(sk.slice(classKey(sk).length+1)));
  const sprite=(icon,extra='')=>{
    const p=db?.atlas.positions[icon];
    return p?`<span aria-hidden="true" class="talent-icon ${extra}" style="--atlas-x:${p[0]*100/(db.atlas.cols-1)}%;--atlas-y:${p[1]*100/(db.atlas.rows-1)}%;--atlas-w:${db.atlas.cols*100}%;--atlas-h:${db.atlas.rows*100}%"></span>`:'';
  };
  const specIcon=sk=>sprite(specTree(sk)?.icon,'spec-icon');
  function order(sk){
    const g=sk===ret?[...document.querySelectorAll('#talents table tr')].slice(1).map(r=>{
      const cells=r.querySelectorAll('td'), m=cells[0]?.textContent.match(/L(\d+)(?:\s*[-–]\s*(\d+))?/);
      return m&&[+m[1],+(m[2]||m[1]),cells[1]?.querySelector('b')?.textContent.trim()];
    }).filter(x=>x?.[2]):DATA[sk]?.guide?.talents||[];
    return g.flatMap(([lo,hi,n])=>Array.from({length:hi-lo+1},(_,i)=>[lo+i,n]));
  }
  const alias = n=>({
    sanctifiedjudgment:'sanctifiedjudgement', improvedjudgment:'improvedjudgement',
    judgmentofthewise:'judgementofthewise'
  })[clean(n)]||clean(n);
  function match(nodes,name){
    const key=alias(name);
    return nodes.find(n=>alias(n.name)===key);
  }
  const states=new WeakMap();
  const guideLevels={};
  const sourceURL=cls=>`https://theforeverera.com/en/talents/${cls}/`;
  const assets=(a,b)=>[a,b].filter(Boolean).join(' ');
  function connect(tree){
    return tree.nodes.flatMap(n=>n.req.map(r=>{
      const p=tree.nodes.find(x=>x.id===r.talent);
      if(!p)return '';
      const a=40+p.col*80,b=34+p.row*68,c=40+n.col*80,d=34+n.row*68;
      if(a===c)return `<path d="M${a},${b} V${d-23}"/><path d="M${c-5},${d-30} L${c},${d-22} ${c+5},${d-30}"/>`;
      if(b===d){const k=Math.sign(c-a);return `<path d="M${a},${b} H${c-23*k}"/><path d="M${c-30*k},${d-5} L${c-22*k},${d} ${c-30*k},${d+5}"/>`;}
      return `<path d="M${a},${b} V${d-34} H${c} V${d-23}"/><path d="M${c-5},${d-30} L${c},${d-22} ${c+5},${d-30}"/>`;
    })).join('');
  }
  function mark(state,tree,node){
    return state.values.get(`${tree.slug}:${node.id}`)||0;
  }
  function draw(host, keepSlider=false){
    const state=states.get(host), {sk,cls,trees,level,observed,mode,picked,mobileTree}=state;
    const values=new Map(), missing=new Set(), levelsByNode=new Map();
    const lookup=trees.flatMap(t=>t.nodes.map(n=>({...n,tree:t})));
    const key=n=>`${n.tree.slug}:${n.id}`;
    const path=order(sk);
    let mapped=0;
    if(mode==='current'){
      for(const current of observed){
        const pool=lookup.filter(n=>canonical(n.tree.slug)===canonical(current.id)||canonical(n.tree.name)===canonical(current.name));
        for(const item of current.talents){
          const n=match(pool,item.name);
          if(n){values.set(key(n),item.rank);mapped+=item.rank;}else missing.add(item.name);
        }
      }
    }else{
      for(const [l,name] of path){
        const n=match(lookup,name);
        if(!n){if(l<=level)missing.add(name);continue;}
        const k=key(n);if(!levelsByNode.has(k))levelsByNode.set(k,[]);
        levelsByNode.get(k).push(l);
        if(l<=level){values.set(k,(values.get(k)||0)+1);mapped++;}
      }
    }
    state.values=values;
    const chosen=lookup.find(n=>key(n)===picked);
    const detail=chosen?(()=>{
      const rank=values.get(key(chosen))||0, slots=levelsByNode.get(key(chosen))||[];
      const req=chosen.req.map(x=>`${chosen.tree.nodes.find(a=>a.id===x.talent)?.name} (rank ${x.rank})`);
      return `<div class="tree-detail-name">${sprite(chosen.icon)}<div><strong>${esc(chosen.name)}</strong><span class="dim">${esc(chosen.tree.name)} · Rank ${rank}/${chosen.maxRank} · Tier ${chosen.row+1}</span></div></div><p>${esc(chosen.desc[Math.max(0,Math.min(chosen.desc.length-1,rank-1))]||'')}${!rank&&chosen.desc.length?' <span class="dim">(Rank 1 effect)</span>':''}</p>${chosen.row?`<p class="dim">Requires ${chosen.row*5} points in ${esc(chosen.tree.name)}${req.length?` and ${req.map(esc).join(', ')}`:''}.</p>`:req.length?`<p class="dim">Requires ${req.map(esc).join(', ')}.</p>`:''}${slots.length?`<p class="dim">Guide spends points at ${slots.map(l=>`L${l}`).join(', ')}.</p>`:''}`;
    })():'<p class="dim">Select a talent icon to see its effect, requirements, and guide levels.</p>';
    const totalAvailable=Math.max(0,Math.min(51,level-9));
    const next=path.find(x=>x[0]>level);
    const ctrl=observed?`<div class="tree-mode" role="group" aria-label="Talent allocation view"><button type="button" data-tree-mode="current" aria-pressed="${mode==='current'}">Current build</button><button type="button" data-tree-mode="guide" aria-pressed="${mode==='guide'}">Guide at L${level}</button></div>`:`<label class="tree-level"><span>Player level <strong data-level-value>${level}</strong></span><input type="range" data-tree-level min="1" max="60" step="1" value="${level}" aria-label="Player level" aria-valuetext="Level ${level}"><span class="tree-scale dim" aria-hidden="true"><span>1</span><span>30</span><span>60</span></span></label>`;
    const pathStrip=mode!=='current'&&path.length?`<section class="tree-path"><h3>Leveling Path</h3><p class="dim">${observed?'Select a point to inspect it.':'Select a level to move the slider and inspect that point.'} Dimmed points are after the selected level.</p><div class="tree-path-grid">${path.map(([l,name])=>{
      const n=match(lookup,name);
      const k=n?key(n):'';
      return `<button type="button" class="tree-path-step ${l>level?'future':''} ${l===level?'here':''} ${l===level+1?'next':''}" data-path-level="${l}" data-path-key="${esc(k)}" aria-label="Level ${l}: ${esc(name)}" ${l===level?'aria-current="step"':''} title="Level ${l}: ${esc(name)}">${sprite(n?.icon)}<span>${l}</span></button>`;
    }).join('')}</div></section>`:'';
    const totals=`<div class="tree-totals" role="status"><strong>${mapped}</strong> ${mode==='current'?'points shown':`/ ${totalAvailable} points shown`}${mode!=='current'&&next?`<span class="dim">Next: L${next[0]} ${esc(next[1])}</span>`:''}</div>`;
    const content=`
      <div class="tree-mobile-pick" role="group" aria-label="Talent tree on mobile">${trees.map((t,i)=>`<button type="button" data-tree-panel="${i}" aria-pressed="${i===mobileTree}">${esc(t.name)}</button>`).join('')}</div>
      <div class="talent-boards">${trees.map((t,i)=>{
        const total=t.nodes.reduce((sum,n)=>sum+mark(state,t,n),0);
        const focused=t===specTree(sk);
        return `<section class="talent-board board-${i} ${i===mobileTree?'board-mobile-visible':''}" aria-label="${esc(t.name)} talent tree"><div class="talent-board-head">${sprite(t.icon,'spec-icon')}<div><h3>${esc(t.name)}</h3><span class="dim">${total} points${focused?' · Selected spec':''}</span></div></div><div class="talent-grid">
          <svg aria-hidden="true" viewBox="0 0 320 476" preserveAspectRatio="none">${connect(t)}</svg>
          ${t.nodes.map(n=>{
            const id=`${t.slug}:${n.id}`,rank=mark(state,t,n), cls=assets(rank>=n.maxRank?'maxed':rank?'ranked':'unspent',picked===id?'selected':'');
            return `<button type="button" class="talent-node ${cls}" data-tree-node="${esc(id)}" aria-pressed="${picked===id}" aria-label="${esc(n.name)}, rank ${rank} of ${n.maxRank}" title="${esc(n.name)}" style="grid-row:${n.row+1};grid-column:${n.col+1}">${sprite(n.icon)}${rank?`<span class="talent-rank">${rank}</span>`:''}</button>`;
          }).join('')}</div></section>`;
      }).join('')}</div>
      ${pathStrip}<div class="tree-detail" aria-live="polite">${detail}</div>
      ${missing.size?`<p class="foot-note">Could not match ${[...missing].map(esc).join(', ')} to this client snapshot. ${mode==='current'?'The Armory talent list below shows the original names.':'See Guided path for the full point order.'}</p>`:''}
      <p class="foot-note">Layout and ranks: ${source(sourceURL(cls),'The Forever Era client data')}. Icons: Blizzard artwork via Wowhead. This view does not change in-game talents.</p>`;
    if(keepSlider){
      host.querySelector('[data-level-value]').textContent=level;
      host.querySelector('[data-tree-level]').setAttribute('aria-valuetext',`Level ${level}`);
      host.querySelector('.tree-totals').outerHTML=totals;
      host.querySelector('.tree-content').innerHTML=content;
    }else host.innerHTML=`<div class="tree-tools">${ctrl}${totals}</div><div class="tree-content">${content}</div>`;
  }
  function mount(host,sk,{level,observed=null}={}){
    const cls=classKey(sk), trees=db?.trees[cls];
    if(!host||!trees)return;
    states.set(host,{sk,cls,trees,level:level??guideLevels[sk]??60,observed,mode:observed?'current':'guide',picked:'',mobileTree:Math.max(0,trees.indexOf(specTree(sk)))});
    draw(host);
    host.onclick=e=>{
      const btn=e.target.closest('button[data-tree-node],button[data-tree-mode],button[data-tree-panel],button[data-path-level]');
      if(!btn)return;
      const {treeNode,treeMode,treePanel,pathLevel,pathKey}=btn.dataset, state=states.get(host);
      const nodeKey=treeNode||pathKey;
      if(nodeKey){state.picked=nodeKey;state.mobileTree=state.trees.findIndex(t=>nodeKey.startsWith(`${t.slug}:`));}
      if(pathLevel&&!state.observed)guideLevels[sk]=state.level=+pathLevel;
      if(treeMode)state.mode=treeMode;
      if(treePanel!==undefined){state.mobileTree=+treePanel;state.picked='';}
      draw(host);
      const attr=pathLevel?'path-level':treeNode?'tree-node':treeMode?'tree-mode':'tree-panel', val=pathLevel||treeNode||treeMode||treePanel;
      host.querySelector(`[data-${attr}="${CSS.escape(val)}"]`)?.focus({preventScroll:true});
    };
    host.oninput=e=>{
      if(!e.target.matches('[data-tree-level]'))return;
      const state=states.get(host);
      guideLevels[sk]=state.level=+e.target.value;
      draw(host,true);
    };
  }
  return {specIcon,mount,order};
})();
