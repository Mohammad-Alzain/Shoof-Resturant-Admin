/* Shoof STUDY 01 — attachShoofGaze(svg, optionalPointerSurface) */
function attachShoofGaze(svg, surface=svg) {
  const pupils=svg.querySelector('.v2-pupils');
  if(!pupils)return null;
  const mq=window.matchMedia('(prefers-reduced-motion: reduce)');
  let x=0,y=0,animation=null;
  const clamp=(v,m)=>Math.max(-m,Math.min(m,v));
  pupils.style.transition=mq.matches?'none':'transform 220ms cubic-bezier(.2,.8,.25,1)';
  const move=(a,b)=>{
    if(mq.matches)return;
    animation?.cancel();
    x=clamp(a,5);y=clamp(b,4);
    pupils.style.transform='translate('+x+'px,'+y+'px)';
  };
  const reset=()=>move(0,0);
  const replay=()=>{
    if(mq.matches || !pupils.animate)return;
    reset();
    animation=pupils.animate([
      {transform:'translate(0px,0px)',offset:0},
      {transform:'translate(-7px,3px)',offset:.28},
      {transform:'translate(3px,-4px)',offset:.64},
      {transform:'translate(0px,0px)',offset:1}
    ],{duration:1050,easing:'cubic-bezier(.25,.65,.35,1)'});
  };
  function pointer(e){
    const b=surface.getBoundingClientRect();
    if(!b.width||!b.height)return;
    move(((e.clientX-b.left)/b.width-.5)*10,((e.clientY-b.top)/b.height-.5)*8);
  }
  surface.addEventListener('pointermove',pointer);
  surface.addEventListener('pointerdown',pointer);
  surface.addEventListener('pointerleave',reset);
  surface.addEventListener('pointercancel',reset);
  surface.addEventListener('pointerup',e=>{if(e.pointerType!=='mouse')reset()});
  surface.addEventListener('keydown',e=>{
    const keys={ArrowLeft:[-2,0],ArrowRight:[2,0],ArrowUp:[0,-2],ArrowDown:[0,2]};
    if(keys[e.key]){e.preventDefault();move(x+keys[e.key][0],y+keys[e.key][1]);}
    else if(e.key===' '||e.key==='Enter'){e.preventDefault();replay();}
  });
  mq.addEventListener?.('change',()=>{
    animation?.cancel();x=0;y=0;pupils.style.transform='';
    pupils.style.transition=mq.matches?'none':'transform 220ms cubic-bezier(.2,.8,.25,1)';
  });
  return {replay,reset};
}
