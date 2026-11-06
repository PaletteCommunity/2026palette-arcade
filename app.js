'use strict';
const games=window.PALETTE_GAMES,byId=Object.fromEntries(games.map(g=>[g.id,g]));
const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let selected=null,active=null,returnFocus=null,loadTimer=null,toastTimer=null,fatalError=false;
function syncArcadeMotion(){document.body.classList.toggle('arcade-paused',document.hidden||!!active);}
document.addEventListener('visibilitychange',syncArcadeMotion);
syncArcadeMotion();
const glowColors={seongnam:['#76c4ff','118,196,255'],gangwon:['#ffd875','255,216,117'],busan:['#63ecd5','99,236,213'],daegu:['#e08cff','224,140,255'],jeonju:['#82dffb','130,223,251']};
function miniMachine(g){return `<svg viewBox="0 0 48 64" aria-hidden="true"><path d="M6 2h36v40l4 7v13H2V49l4-7Z" fill="${g.color}" stroke="#31475a" stroke-width="2"/><path d="M10 7h28v5H10Z" fill="${g.light}"/><rect x="9" y="17" width="30" height="23" rx="2" fill="#263b4c"/><path d="m21 22 10 7-10 6Z" fill="${g.light}"/><path d="M3 48h42" stroke="#31475a"/><path d="M12 46v-5" stroke="#31475a" stroke-width="3"/><circle cx="12" cy="41" r="3" fill="#fff" stroke="#31475a"/><circle cx="32" cy="44" r="2.5" fill="#fff"/><circle cx="39" cy="43" r="2.5" fill="#fff"/><path d="M19 53h10v4H19Z" fill="#31475a"/></svg>`;}
// Overlapping invisible alternatives reserve the tallest wrapped text at any width.
// Only the selected value is exposed to assistive technology.
function stableText(value,field){
 return `<span class="text-current">${esc(value)}</span>`+games.map(g=>`<span class="text-reserve" aria-hidden="true">${esc(g[field])}</span>`).join('');
}
function selectGame(id){
 if(selected===id)return;const switching=selected!==null;selected=id;const g=byId[id],f=$('#feature');f.style.setProperty('--machine',g.color);f.style.setProperty('--light',g.light);f.style.setProperty('--glow',glowColors[id][0]);f.style.setProperty('--glow-rgb',glowColors[id][1]);
 document.querySelectorAll('.map-marker').forEach(b=>{const on=b.dataset.id===id;b.classList.toggle('active',on);b.setAttribute('aria-current',on?'true':'false');});
 f.innerHTML=`<div class="feature-header"><p class="region">${esc(g.region)}</p><h2 class="text-slot">${stableText(g.center,'center')}</h2></div><button class="big-cabinet${switching?' game-switch':''}" type="button" aria-label="${esc(g.center)} ${esc(g.title)} 바로 플레이"><div class="machine"><div class="marquee text-slot">${stableText(g.title,'title')}</div><div class="screen-bezel"><div class="screen"><img src="${g.thumbnail}" alt="${esc(g.title)} 게임 썸네일"><span class="screen-scan" aria-hidden="true"></span><span class="screen-switch" aria-hidden="true"></span><div class="screen-play"><span>바로 플레이 ↗</span></div></div></div><div class="control-deck" aria-hidden="true"><span class="joystick"><span class="joystick-stick"><i></i></span></span><span class="machine-buttons"><i></i><i></i></span></div><div class="machine-bottom"><span class="speaker" aria-hidden="true"></span><span class="play-label">바로 플레이 <span>↗</span></span></div></div><div class="machine-feet" aria-hidden="true"></div></button><div class="feature-copy"><p class="desc text-slot">${stableText(g.description,'description')}</p><p class="genre">${esc(g.genre)}</p></div>`;
 f.querySelector('button').addEventListener('click',e=>openGame(g,e.currentTarget));
}
for(const g of games){
 const marker=document.createElement('button');marker.className='map-marker';marker.type='button';marker.dataset.id=g.id;marker.style.left=g.position[0]+'%';marker.style.top=g.position[1]+'%';marker.setAttribute('aria-label',`${g.center} · ${g.region} · ${g.title} 플레이`);marker.title=g.title;
 marker.style.setProperty('--glow',glowColors[g.id][0]);marker.style.setProperty('--glow-rgb',glowColors[g.id][1]);marker.innerHTML=miniMachine(g)+`<span class="marker-label"><strong>${esc(g.region)}</strong></span>`;
 marker.addEventListener('pointerenter',()=>{if(matchMedia('(hover:hover)').matches)selectGame(g.id);});marker.addEventListener('focus',()=>selectGame(g.id));marker.addEventListener('click',()=>{selectGame(g.id);openGame(g,marker);});$('#map-markers').append(marker);
}
selectGame('seongnam');
function setLoad(state,message,detail=''){
 const blocked=state==='error'||state==='slow';$('#load-state').hidden=state==='ready';$('#load-state').classList.toggle('error',blocked);$('#load-message').textContent=message;$('#load-detail').textContent=detail;$('#retry').hidden=!blocked;$('#direct-play').hidden=!blocked;
}
function supportsWebGL(){try{const canvas=document.createElement('canvas'),gl=canvas.getContext('webgl')||canvas.getContext('experimental-webgl');if(!gl)return false;gl.getExtension('WEBGL_lose_context')?.loseContext();return true;}catch{return false;}}
function mountGame(){
 clearTimeout(loadTimer);$('#viewport iframe')?.remove();fatalError=false;setLoad('loading','게임을 준비하고 있어요','잠시만 기다려 주세요.');$('#direct-play').href=active.url;
 if(active.webgl&&!supportsWebGL()){fatalError=true;setLoad('error','3D 그래픽을 시작하지 못했어요','브라우저의 그래픽 가속 설정을 확인하거나 다른 브라우저에서 시도해 주세요.');return;}
 const iframe=document.createElement('iframe');iframe.title=active.title+' 게임';iframe.src=active.url;iframe.setAttribute('sandbox','allow-scripts allow-same-origin allow-modals');iframe.setAttribute('allow','autoplay; fullscreen');
 iframe.addEventListener('load',()=>{try{iframe.contentWindow.focus();}catch{}});$('#viewport').append(iframe);
 // A slow load is recoverable: a later ready message always clears this notice.
 loadTimer=setTimeout(()=>{if(!fatalError)setLoad('slow','게임 준비 시간이 길어지고 있어요','준비가 끝나면 자동으로 게임이 열려요. 계속 기다려도 열리지 않으면 새 탭에서 열어보세요.');},15000);
}
function openGame(g,trigger){
 active=g;returnFocus=trigger;$('#player-title').textContent=g.title;$('#player-center').textContent=g.center;$('#controls').textContent=g.controls;
 $('#compatibility').textContent=g.note||'';$('#compatibility').hidden=!g.note;$('#player').showModal();syncArcadeMotion();document.body.style.overflow='hidden';mountGame();
}
window.addEventListener('message',e=>{
 const iframe=$('#viewport iframe');if(!active||e.source!==iframe?.contentWindow||e.data?.channel!=='palette-arcade')return;
 if(e.data.type==='ready'&&!fatalError){clearTimeout(loadTimer);setLoad('ready','');iframe.focus();}
 if(e.data.type==='error'){fatalError=true;clearTimeout(loadTimer);setLoad('error','게임 실행 중 문제가 생겼어요',String(e.data.message||'게임을 다시 불러와 주세요.'));}
 if(e.data.type==='exit')$('#player').close();
});
$('#player').addEventListener('close',()=>{clearTimeout(loadTimer);$('#viewport iframe')?.remove();active=null;syncArcadeMotion();document.body.style.overflow='';if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});returnFocus?.focus();});
$('#close-player').addEventListener('click',()=>$('#player').close());$('#restart').addEventListener('click',()=>{if(active)mountGame();});$('#retry').addEventListener('click',()=>{if(active)mountGame();});
if(!document.fullscreenEnabled)$('#fullscreen').hidden=true;
$('#fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('#player-shell').requestFullscreen();$('#viewport iframe')?.focus();}catch{toast('이 브라우저에서는 전체 화면을 지원하지 않아요.');}});
function toast(text){clearTimeout(toastTimer);$('#toast').textContent=text;$('#toast').hidden=false;toastTimer=setTimeout(()=>$('#toast').hidden=true,4000);}
