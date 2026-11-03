(function(){
const configNode=document.getElementById('byjdg-hero-settings'),hero=document.querySelector('.hero');if(!configNode||!hero)return;
const config=JSON.parse(configNode.textContent),motion=matchMedia('(prefers-reduced-motion: reduce)');
if(config.mode!=='rotating'||config.images.length<2)return;
const base=getComputedStyle(hero).backgroundImage;let index=0,active=0,timer=null,paused=false,loading=false,generation=0;
const layers=[0,1].map(()=>{const el=document.createElement('div');el.className='hero-slide';el.setAttribute('aria-hidden','true');hero.prepend(el);return el;});
function background(url){return base.replace(/url\((?:"[^"]*"|'[^']*'|[^)]*)\)/g,()=> 'url('+JSON.stringify(url)+')');}
layers[0].style.backgroundImage=background(config.images[0]);layers[0].style.opacity='1';
const button=document.createElement('button');button.className='hero-rotation-pause';button.type='button';button.innerHTML='<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true" focusable="false"><rect x="7" y="5" width="3" height="14" rx=".5"/><rect x="14" y="5" width="3" height="14" rx=".5"/></svg>';button.setAttribute('aria-label','Pause images');button.setAttribute('aria-pressed','false');hero.append(button);
function stop(){clearTimeout(timer);timer=null;generation++;loading=false;}
function schedule(){clearTimeout(timer);if(!paused&&!motion.matches&&!document.hidden)timer=setTimeout(next,config.interval*1000);}
function next(){if(loading)return;loading=true;const ticket=generation,nextIndex=(index+1)%config.images.length,img=new Image();img.onload=()=>{if(ticket!==generation)return;loading=false;const other=1-active;layers[other].style.backgroundImage=background(config.images[nextIndex]);layers[other].style.opacity='1';layers[active].style.opacity='0';active=other;index=nextIndex;schedule();};img.onerror=()=>{if(ticket!==generation)return;loading=false;index=nextIndex;schedule();};img.src=config.images[nextIndex];}
function update(){stop();button.hidden=motion.matches;layers.forEach(el=>el.hidden=motion.matches);if(!motion.matches)schedule();}
button.addEventListener('click',()=>{paused=!paused;button.innerHTML=paused?'<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true" focusable="false"><path d="m8 5 11 7-11 7Z"/></svg>':'<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true" focusable="false"><rect x="7" y="5" width="3" height="14" rx=".5"/><rect x="14" y="5" width="3" height="14" rx=".5"/></svg>';button.setAttribute('aria-label',paused?'Resume images':'Pause images');button.setAttribute('aria-pressed',String(paused));update();});
document.addEventListener('visibilitychange',update);motion.addEventListener('change',update);update();
})();
