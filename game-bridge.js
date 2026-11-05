/* First-frame readiness: independent of window.load, fonts and unrelated assets. */
(()=>{
 let fatal=false,ready=false;
 const send=(type,message)=>{if(window.parent!==window)window.parent.postMessage({channel:'palette-arcade',type,message},'*');};
 window.PaletteGameReady=()=>{
  if(fatal||ready)return;ready=true;
  requestAnimationFrame(()=>{if(!fatal)send('ready');});
 };
 addEventListener('error',e=>{
  if(e.target?.tagName==='SCRIPT'){fatal=true;send('error','게임 엔진 파일을 불러오지 못했어요. 다시 불러오기를 눌러 주세요.');}
  else if(e instanceof ErrorEvent){fatal=true;send('error',(e.message||'게임 코드 오류')+' · 새 탭에서 열어도 반복되면 이 문구를 운영자에게 알려 주세요.');}
 },true);
 addEventListener('unhandledrejection',e=>{console.warn('Optional game feature failed:',e.reason);});
 addEventListener('keydown',e=>{if(e.code==='Escape'){e.preventDefault();if(e.shiftKey){e.stopImmediatePropagation();send('exit');}}},true);
 document.addEventListener('webglcontextlost',e=>{e.preventDefault();fatal=true;send('error','3D 그래픽 연결이 끊겼어요. 다른 3D 탭을 닫고 다시 시작해 주세요.');},true);
})();
