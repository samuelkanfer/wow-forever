(() => {
  const host=el('class-quiz');
  const icy='https://www.icy-veins.com/wow-forever/choosing-your-main';
  const options=(...rows)=>rows;
  const questions=[
    {id:'role',title:'What job sounds fun in a group?',options:options(
      ['damage','Deal damage','Focus on defeating enemies.'],['tank','Tank','Hold enemy attention and protect the group.'],['heal','Heal','Keep the group alive and recover from mistakes.'],['any','I’m open','Show me options across roles.'])},
    {id:'range',title:'How do you want to deal damage?',when:a=>a.role!=='tank'&&a.role!=='heal',options:options(
      ['melee','Up close','Fight in melee range.'],['physical','Ranged weapons','Fight at distance with a bow or gun.'],['caster','Ranged spells','Cast spells at a distance.'],['any','Any range','No preference.'])},
    {id:'feel',title:'Which toolkit sounds most fun?',options:options(
      ['direct','Weapons and direct hits','A hands-on, weapon-focused toolkit.'],['support','Support magic','Buffs, heals, absorbs, or defensive tools.'],['control','Control and timing','Set up fights with control, movement, or well-timed abilities.'],['pet','Pets and summons','Fight alongside an animal or demon, or summon one for key fights.'],['forms','Shape-shifting','Use different forms for different jobs.'],['spell','Spell combos','Build around casts, effects, or spell interactions.'],['any','No preference','Let the other answers decide.'])},
    {id:'activity',title:'Where will you spend most of your time?',options:options(
      ['solo','Questing on my own','I value tools that make solo play smoother.'],['group','Dungeons and raids','I value a useful group toolkit.'],['pvp','PvP','I like control, escapes, or surviving pressure.'],['any','A mix','No activity gets extra weight.'])},
    {id:'flex',title:'Do you want to switch roles on one character?',options:options(
      ['yes','Yes, give me options','Favor classes that can tank or heal as well as deal damage.'],['no','I’d rather specialize','Favor classes built mainly around one role.'],['any','Doesn’t matter','Either is fine.'])}
  ];
  const profiles={
    'druid-balance':['caster','forms spell support','solo group','A ranged caster that weaves Wrath and Starfire and can switch into forms for utility.'],
    'druid-feral':['melee tank','forms direct','solo pvp group','Use Cat Form for melee damage or Bear Form to tank.'],
    'druid-restoration':['heal','forms support','group pvp','Use healing-over-time effects and shapeshift for mobility and utility.'],
    'hunter-beast-mastery':['physical','pet direct','solo','Fight at range while your pet handles much of the pressure up close.'],
    'hunter-marksmanship':['physical','direct control','solo group pvp','A ranged weapon spec that puts more emphasis on your own shots.'],
    'hunter-survival':['melee','direct control','solo pvp','Get in close for melee attacks and use traps to control the fight.'],
    'mage-arcane':['caster','spell control','group','Use Arcane spell combinations and manage Mana as you cast.'],
    'mage-fire':['caster','spell','group','Look for Fire crits and chain them into burst.'],
    'mage-frost':['caster','control spell','solo pvp','Use slows and roots to control distance, then take advantage of freezes.'],
    'paladin-holy':['heal','support spell','group','Direct Holy healing, blessings, and defensive tools for the group.'],
    'paladin-protection':['tank','support direct spell','group','A shield tank that uses Holy spells and brings blessings and defensive utility.'],
    'paladin-retribution':['melee','direct support spell','solo group','Fight with a two-handed weapon and use Holy damage, seals, and blessings.'],
    'priest-discipline':['heal','support control spell','group pvp','Lean into shields, absorbs, and preventative support.'],
    'priest-holy':['heal','support spell','group','A healing toolkit with direct heals and ways to recover group health.'],
    'priest-shadow':['caster','spell control','solo pvp','Use Shadow spells and damage over time, with utility from the Priest toolkit.'],
    'rogue-assassination':['melee','control direct','solo pvp','A stealth melee spec built around poisons, combo points, and finishers.'],
    'rogue-combat':['melee','direct','solo group','Weapon-focused melee with combo points and offensive cooldowns.'],
    'rogue-subtlety':['melee','control','pvp','Use Stealth, positioning, and control to set up your attacks.'],
    'shaman-elemental':['caster','spell support','group','Cast elemental spells at range and bring totem utility.'],
    'shaman-enhancement':['melee','direct spell support','solo group','Combine weapon swings with spells and totems.'],
    'shaman-restoration':['heal','support spell','group','Heal the group with spells such as Chain Heal and bring totem support.'],
    'warlock-affliction':['caster','spell pet','solo pvp','Wear enemies down with damage-over-time spells and drains, with demon utility.'],
    'warlock-demonology':['caster','pet spell','solo group','Make demons and their benefits central to your ranged spell toolkit.'],
    'warlock-destruction':['caster','spell pet','group','Use Fire and Shadow casts for burst, backed by demon utility.'],
    'warrior-arms':['melee','direct control','group pvp','A two-handed, weapon-focused fighter with a toolkit for controlling opponents.'],
    'warrior-fury':['melee','direct','group','A weapon-focused melee spec that spends Rage on sustained damage.'],
    'warrior-protection':['tank','direct control','group','A shield tank that uses Rage and active tools to hold enemy attention.']
  };
  const flexibility={druid:4,paladin:3,shaman:2,priest:2,warrior:2,rogue:1,mage:1,warlock:1,hunter:1};
  const label={caster:'Ranged spells',physical:'Ranged weapons',melee:'Melee damage',tank:'Tank',heal:'Healer'};
  let step=0, answers={}, complete=false;
  const active=()=>questions.filter(q=>!q.when||q.when(answers));
  const classes=()=>C.flatMap(c=>c.s.map(s=>({key:s.k,c,s,profile:profiles[s.k]}))).filter(x=>x.profile);
  function rank(a){
    const ranged=a.range&&a.range!=='any';
    const fits=(roles)=>a.role==='tank'||a.role==='heal'?roles.includes(a.role):a.role==='damage'?roles.some(r=>r!=='tank'&&r!=='heal'):true;
    const candidates=classes().flatMap(row=>{
      const [type,feel,activity]=row.profile, roles=type.split(' ');
      if(!fits(roles)||ranged&&!roles.includes(a.range))return [];
      const f=flexibility[keyClass(row.c)], reasons=[];
      const trait=feel.split(' ').includes(a.feel), activityMatch=activity.split(' ').includes(a.activity);
      let score=(trait?5:0)+(activityMatch?3:0);
      if(trait)reasons.push(questions[2].options.find(x=>x[0]===a.feel)[1]);
      if(activityMatch)reasons.push(questions[3].options.find(x=>x[0]===a.activity)[1]);
      if(a.flex==='yes'){score+=f-1;if(f>1)reasons.push('Can switch roles');}
      if(a.flex==='no'){score+=f===1?3:0;if(f===1)reasons.push('Damage-focused class');}
      return [{...row,roles,reasons,score}];
    }).sort((a,b)=>b.score-a.score||a.c.n.localeCompare(b.c.n)||a.s.n.localeCompare(b.s.n));
    return candidates.filter((x,i)=>candidates.findIndex(y=>y.c===x.c)===i).slice(0,3);
  }
  function base(inner){
    host.innerHTML=`<div class="vhead"><a class="back" href="#">← All classes</a><span class="vtitle">Class Chooser</span><a class="align-right dim" href="#tier-list">Tier List</a><a class="dim" href="#character">Character lookup</a></div><main class="quiz-shell"><section class="card quiz-card"><div class="eyebrow">ALLIANCE / PLAYSTYLE QUIZ</div>${inner}<p class="foot-note">Inspired by ${source(icy,'Icy Veins’ Choosing Your Class guide')}. These are playstyle suggestions, not a DPS or PvP ranking.</p></section></main>`;
  }
  function render(focus=false){
    if(complete){
      const rows=rank(answers);
      base(`<h1 tabindex="-1" id="quiz-title">Your class matches</h1><p class="dim">We filtered by role and range, then ranked by the rest of your answers. Each result shows one spec to try first.</p><div class="quiz-results">${rows.map(({c,s,profile,roles,reasons,score})=>`<article class="quiz-result"><div class="quiz-result-head">${TreeView.specIcon(s.k)||imageLogo(c,true)}<div><div class="eyebrow">${score===rows[0].score?'TOP MATCH':'ALSO CONSIDER'}</div><h2>${esc(c.n)} · ${esc(s.n)}</h2></div></div><p>${esc(profile[3])}</p><div class="quiz-tags">${[...roles.map(r=>label[r]),...reasons].map(r=>`<span class="armory-tag">${esc(r)}</span>`).join('')}</div><a class="back" href="#${keyClass(c)}/${esc(s.k.slice(keyClass(c).length+1))}">Open ${esc(s.n)} guide →</a></article>`).join('')}</div><div class="quiz-actions"><button class="back" type="button" data-quiz="back">← Change answers</button><button class="back" type="button" data-quiz="reset">Start over</button></div>`);
    }else{
      const all=active(), q=all[step];
      base(`<h1 tabindex="-1" id="quiz-title">What class should I play?</h1><div class="quiz-progress"><span class="dim">Question ${step+1} of ${all.length}</span><progress value="${step+1}" max="${all.length}" aria-label="Quiz progress"></progress></div><form id="class-quiz-form"><fieldset><legend tabindex="-1" id="quiz-question-title">${esc(q.title)}</legend><div class="quiz-options">${q.options.map(([id,name,desc])=>`<label><input type="radio" name="answer" value="${id}" ${answers[q.id]===id?'checked':''} required><span><strong>${esc(name)}</strong><small>${esc(desc)}</small></span></label>`).join('')}</div></fieldset><div class="quiz-actions">${step?'<button class="back" type="button" data-quiz="back">← Back</button>':''}<button class="armory-action" type="submit">${step===all.length-1?'See my matches':'Next question'}</button></div></form>`);
    }
    if(focus)host.querySelector(step&&!complete?'#quiz-question-title':'#quiz-title').focus({preventScroll:true});
  }
  host.addEventListener('submit',e=>{
    if(e.target.id!=='class-quiz-form')return;
    e.preventDefault();
    const choice=new FormData(e.target).get('answer'), q=active()[step];
    if(!q.options.some(o=>o[0]===choice))return;
    answers[q.id]=choice;
    if(q.id==='role'&&(choice==='tank'||choice==='heal'))delete answers.range;
    if(step===active().length-1)complete=true;else step++;
    render(true);
  });
  host.addEventListener('click',e=>{
    const action=e.target.closest('button[data-quiz]')?.dataset.quiz;
    if(action==='back'){if(complete)complete=false;else step=Math.max(0,step-1);render(true);}
    if(action==='reset'){answers={};step=0;complete=false;render(true);}
  });
  const priorRoute=route;
  route=()=>{
    const shown=location.hash==='#class-chooser';
    host.hidden=!shown;
    if(!shown){priorRoute();return;}
    el('home').style.display='none';
    el('armory-view').hidden=true;
    document.querySelectorAll('.view').forEach(v=>v.style.display='none');
    el('bar').firstChild.style.width='0';
    render(true);
  };
  route();
})();
