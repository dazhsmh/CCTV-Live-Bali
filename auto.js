const stage=$("#stage"),video=$("#kv"),msg=$("#msg"),prog=$("#prog");
const byId=new Map(CAMS.map(c=>[c.id,c]));
const INTERVALS=[10,15,30,60,120];

const idsOf=k=>{const a=LS.get(k,[]);return new Set(Array.isArray(a)?a.filter(id=>byId.has(id)):[])};
const hashIds=(()=>{
  const m=location.hash.match(/[#&]cams=([^&]*)/);
  return m?decodeURIComponent(m[1]).split(",").filter(id=>byId.has(id)):[];
})();

let source=hashIds.length?"link":LS.get("kioskSrc","all");
if(!["all","fav","sel","link"].includes(source)||(source==="link"&&!hashIds.length))source="all";
let secs=INTERVALS.includes(LS.get("kioskSecs",30))?LS.get("kioskSecs",30):30;

let list=[],idx=0,paused=false,timer=null,skipT=null,handle=null,lastTag="cari";

function listFor(src){
  if(src==="link")return hashIds.map(id=>byId.get(id));
  if(src==="fav"){const s=idsOf("favs");return CAMS.filter(c=>s.has(c.id))}
  if(src==="sel"){const s=idsOf("sel");return CAMS.filter(c=>s.has(c.id))}
  return CAMS.slice();
}

function setTag(s){
  lastTag=s;
  const tg=$("#ktag");
  tg.className="ktag "+(s==="on"||s==="off"?s:"");
  tg.textContent=t("tag_"+s);
}
function drawCount(){
  $("#kcount").textContent=list.length?t("k_count",{i:idx+1,n:list.length}):"";
}
function restartProgress(){
  prog.style.animation="none";
  void prog.offsetWidth;
  if(paused||list.length<2)return;
  prog.style.animation="kprog "+secs+"s linear forwards";
}
function startTimer(){
  clearTimeout(timer);
  restartProgress();
  if(!paused&&list.length>1)timer=setTimeout(next,secs*1000);
}

function show(i){
  clearTimeout(timer);clearTimeout(skipT);
  if(!list.length){
    if(handle){(handle.hard||handle)();handle=null}
    msg.textContent=t("k_none");msg.hidden=false;
    $("#kname").textContent="";$("#kdetail").textContent="";
    $("#ktag").className="ktag";$("#ktag").textContent="";
    drawCount();restartProgress();
    return;
  }
  msg.hidden=true;
  idx=((i%list.length)+list.length)%list.length;
  const c=list[idx];
  $("#kname").textContent=c.name;
  $("#kdetail").textContent=c.detail;
  drawCount();
  setTag("cari");
  handle=attach(video,c,s=>{
    if(list[idx]!==c)return;
    setTag(s);
    if(s==="on")clearTimeout(skipT);
    if(s==="off"&&list.length>1&&!paused){
      clearTimeout(skipT);
      skipT=setTimeout(()=>{if(list[idx]===c&&!paused)next()},6000);
    }
  });
  startTimer();
}
const next=()=>show(idx+1);
const prev=()=>show(idx-1);

function setSource(src){
  source=src;
  if(src!=="link")LS.set("kioskSrc",src);
  list=listFor(src);
  show(0);
}
function togglePause(){
  paused=!paused;
  $("#kpause").textContent=t(paused?"k_play":"k_pause");
  clearTimeout(skipT);
  startTimer();
}

function fillSelects(){
  const s=$("#ksecs");s.innerHTML="";
  INTERVALS.forEach(n=>{
    const o=document.createElement("option");
    o.value=n;o.textContent=t("k_sec",{n});o.selected=n===secs;
    s.appendChild(o);
  });
  const r=$("#ksrc");r.innerHTML="";
  const opts=[["all","k_src_all"],["fav","k_src_fav"],["sel","k_src_sel"]];
  if(hashIds.length)opts.push(["link","k_src_link"]);
  opts.forEach(([v,k])=>{
    const o=document.createElement("option");
    o.value=v;o.textContent=t(k)+" ("+listFor(v).length+")";o.selected=v===source;
    r.appendChild(o);
  });
}
$("#ksecs").onchange=e=>{secs=+e.target.value;LS.set("kioskSecs",secs);startTimer()};
$("#ksrc").onchange=e=>setSource(e.target.value);
$("#kprev").onclick=prev;
$("#knext").onclick=next;
$("#kpause").onclick=togglePause;

const canFs=document.fullscreenEnabled||document.webkitFullscreenEnabled;
if(!canFs)$("#kfull").hidden=true;
$("#kfull").onclick=()=>{
  const d=document,el=d.documentElement;
  if(d.fullscreenElement||d.webkitFullscreenElement)(d.exitFullscreen||d.webkitExitFullscreen).call(d);
  else(el.requestFullscreen||el.webkitRequestFullscreen).call(el);
};

let tick,wxDraw;
function onLang(){
  applyI18n();
  $("#kpause").textContent=t(paused?"k_play":"k_pause");
  fillSelects();
  if(list.length)setTag(lastTag);
  else msg.textContent=t("k_none");
  drawCount();
  if(wxDraw)wxDraw();
  if(tick)tick();
}
$("#klang").onclick=()=>{setLang(getLang()==="id"?"en":"id");onLang()};

let idleT;
function wake(){
  stage.classList.remove("idle");
  clearTimeout(idleT);
  idleT=setTimeout(()=>stage.classList.add("idle"),4000);
}
["pointermove","pointerdown","keydown","touchstart"].forEach(ev=>document.addEventListener(ev,wake,{passive:true}));

document.addEventListener("keydown",e=>{
  if(e.key==="ArrowRight")next();
  else if(e.key==="ArrowLeft")prev();
  else if((e.key===" "||e.code==="Space")&&!e.target.closest("button,select,a")){e.preventDefault();togglePause()}
  else if((e.key==="f"||e.key==="F")&&canFs)$("#kfull").click();
});

async function lock(){
  try{if("wakeLock"in navigator&&!document.hidden)await navigator.wakeLock.request("screen")}catch(e){}
}
document.addEventListener("visibilitychange",()=>{
  if(!list.length)return;
  if(document.hidden){clearTimeout(timer);clearTimeout(skipT);if(handle)handle()}
  else{lock();show(idx)}
});

tick=startClock();
wxDraw=startWeather($("#wx"));
applyI18n();
$("#kpause").textContent=t("k_pause");
fillSelects();
list=listFor(source);
show(0);
lock();
wake();
