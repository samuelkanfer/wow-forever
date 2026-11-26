(() => {
  const button=el('back-to-top');
  let frame=0;
  const refresh=()=>{
    frame=0;
    button.hidden=window.scrollY<360;
  };
  window.addEventListener('scroll',()=>{
    if(!frame)frame=requestAnimationFrame(refresh);
  },{passive:true});
  window.addEventListener('pageshow',refresh);
  button.addEventListener('click',()=>{
    const candidates=[...document.querySelectorAll('.vhead .vtitle, #home h1')];
    const heading=candidates.find(node=>node.getClientRects().length);
    if(heading){
      if(!heading.hasAttribute('tabindex')){
        heading.tabIndex=-1;
        heading.addEventListener('blur',()=>heading.removeAttribute('tabindex'),{once:true});
      }
      heading.focus({preventScroll:true});
    }
    window.scrollTo({top:0,left:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  });
  refresh();
})();
