const stage=$("#stage"),gridEl=$("#mgrid"),msg=$("#msg"),prog=$("#prog");
const byId=new Map(CAMS.map(c=>[c.id,c]));
const RMAP=new Map(REGIONS.map(r=>[r.id,r]));
const SECS=[0,15,30,60];

function favList(){
  const at=FavAt.get(),out=[];
  REGIONS.forEach(r=>{
    const a=LS.get("favs",[],r.id);
    if(Array.isArray(a))a.forEach((id,i)=>{const c=byId.get(id);if(c&&c.region===r.id)out.push({c,at:at[id]||0,i})});
  });
  return out.sort((a,b)=>b.at-a.at||b.i-a.i).map(x=>x.c);
}
let favs=favList();
let g=+LS.get("multiGrid",0);
if(g!==2&&g!==3)g=favs.length<=4?2:3;
let secs=SECS.includes(LS.get("multiSecs",0))?LS.get("multiSecs",0):0;
let page=0,solo=null,paused=false,timer=null,handles=[],uiHidden=false,tick;

const KTTL=2*3600*1000;
let saveKT=0;const seen={};
function note(c,st){
  seen[c.id]=[st,Date.now()];
  clearTimeout(saveKT);
  saveKT=setTimeout(()=>{
    const o=LS.get("known",{}),n=Date.now(),k={};
    if(o&&typeof o==="object")for(const id in o){const v=o[id];if(Array.isArray(v)&&n-v[1]<KTTL)k[id]=v}
    LS.set("known",Object.assign(k,seen));
  },1500);
}

const per=()=>g*g;
const pages=()=>Math.max(1,Math.ceil(favs.length/per()));
function stopAll(){handles.forEach(x=>{try{(x.h.hard||x.h)()}catch(e){}});handles=[]}

function tileLabel(el,c){el.setAttribute("aria-label",t(solo?"multi_small":"multi_big",{n:c.name}))}
function makeTile(c){
  const el=document.createElement("div");
  el.className="tile loading"+(c.pano?" pano":"");
  el.tabIndex=0;el.setAttribute("role","button");el._cam=c;
  const v=document.createElement("video"),tg=document.createElement("span"),tl=document.createElement("div"),b=document.createElement("b"),s=document.createElement("small");
  v.muted=true;v.autoplay=true;v.playsInline=true;v.setAttribute("muted","");v.setAttribute("playsinline","");
  tg.className="ktag";tg.textContent=t("tag_load");
  tl.className="tl";b.textContent=c.name;
  s.textContent=[c.detail,RMAP.get(c.region).name].filter(Boolean).join(" · ");
  tl.append(tg,b,s);el.append(v,tl);
  tileLabel(el,c);
  v.addEventListener("playing",()=>el.classList.remove("loading"));
  v.addEventListener("loadedmetadata",()=>{if(c.pano&&v.videoWidth)v.style.setProperty("--ar",v.videoWidth+"/"+v.videoHeight)});
  const open=()=>{
    if(solo){solo=null}else{solo=c;Recent.add(c.id)}
    draw();
  };
  el.onclick=open;
  el.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();e.stopPropagation();open()}};
  const h=attach(v,c,st=>{
    tg._st=st;
    tg.className="ktag "+(st==="on"||st==="off"?st:"");
    tg.textContent=t("tag_"+st);
    if(st==="off")el.classList.remove("loading");
    if(st==="on"||st==="off")note(c,st);
  });
  handles.push({h,c,el,tg,st:"cari"});
  return el;
}

function draw(){
  stopAll();clearTimeout(timer);
  gridEl.textContent="";
  gridEl.classList.toggle("solo",!!solo);
  msg.hidden=true;
  if(!favs.length){
    msg.textContent=t("multi_empty");msg.hidden=false;
    drawChrome();restartProgress();return;
  }
  let cams,cols,rows;
  if(solo){cams=[solo];cols=rows=1}
  else{
    page=Math.min(page,pages()-1);
    cams=favs.slice(page*per(),(page+1)*per());
    if(pages()>1)cols=rows=g;
    else{cols=Math.min(g,Math.ceil(Math.sqrt(cams.length)));rows=Math.ceil(cams.length/cols)}
  }
  gridEl.style.setProperty("--c",cols);gridEl.style.setProperty("--r",rows);
  cams.forEach(c=>gridEl.appendChild(makeTile(c)));
  for(let i=cams.length;i<cols*rows;i++){const e=document.createElement("div");e.className="tile empty";gridEl.appendChild(e)}
  drawChrome();startTimer();
}

function drawChrome(){
  const n=favs.length,multi=pages()>1;
  $("#mcount").textContent=n?t("multi_count",{n}):"";
  $("#mpage").textContent=solo?solo.name:multi?t("multi_page",{i:page+1,n:pages()}):"";
  $("#mhint").textContent=t("kb_multi");
  $("#g2").setAttribute("aria-pressed",String(g===2));
  $("#g3").setAttribute("aria-pressed",String(g===3));
  $(".seg").hidden=!n||!!solo;
  const nav=n>1&&(multi||!!solo);
  $("#mprev").hidden=$("#mnext").hidden=!nav;
  $("#mprev").setAttribute("aria-label",t(solo?"cam_prev":"multi_prev"));
  $("#mnext").setAttribute("aria-label",t(solo?"cam_next":"multi_next"));
  $("#mpause").hidden=!(multi&&!solo&&secs>0);
  $("#mpause").textContent=t(paused?"multi_resume":"multi_pause");
  $("#msecs").closest("label").hidden=!(multi&&!solo);
  handles.forEach(x=>{tileLabel(x.el,x.c);x.tg.textContent=t("tag_"+(x.tg._st||"load"))});
}

function restartProgress(){
  prog.style.animation="none";void prog.offsetWidth;
  if(paused||solo||pages()<2||!secs)return;
  prog.style.animation="kprog "+secs+"s linear forwards";
}
function startTimer(){
  clearTimeout(timer);restartProgress();
  if(!paused&&!solo&&pages()>1&&secs>0)timer=setTimeout(()=>step(1),secs*1000);
}

function step(d){
  if(!favs.length)return;
  if(solo){
    const i=favs.indexOf(solo);
    solo=favs[((i<0?0:i)+d+favs.length)%favs.length];
    Recent.add(solo.id);
  }else{
    if(pages()<2)return;
    page=(page+d+pages())%pages();
  }
  draw();
}
function setGrid(n){
  if(n===g)return;
  const first=solo?favs.indexOf(solo):page*per();
  g=n;LS.set("multiGrid",g);
  if(!solo)page=Math.floor(Math.max(0,first)/per());
  draw();
}
function togglePause(){paused=!paused;drawChrome();startTimer()}

$("#g2").onclick=()=>setGrid(2);
$("#g3").onclick=()=>setGrid(3);
$("#mprev").onclick=()=>step(-1);
$("#mnext").onclick=()=>step(1);
$("#mpause").onclick=togglePause;

function fillSecs(){
  const s=$("#msecs");s.innerHTML="";
  SECS.forEach(n=>{
    const o=document.createElement("option");
    o.value=n;o.textContent=n?t("k_sec",{n}):t("multi_off");o.selected=n===secs;
    s.appendChild(o);
  });
}
$("#msecs").onchange=e=>{secs=+e.target.value;LS.set("multiSecs",secs);drawChrome();startTimer()};

const canFs=document.fullscreenEnabled||document.webkitFullscreenEnabled;
if(!canFs)$("#mfull").hidden=true;
function toggleFs(){
  const d=document,el=d.documentElement;
  if(d.fullscreenElement||d.webkitFullscreenElement)(d.exitFullscreen||d.webkitExitFullscreen).call(d);
  else(el.requestFullscreen||el.webkitRequestFullscreen).call(el);
}
$("#mfull").onclick=toggleFs;
function setUi(h){
  uiHidden=h;
  stage.classList.toggle("ui-hidden",h);
  $("#mshow").hidden=!h;
  (h?$("#mshow"):$("#mhide")).focus({preventScroll:true});
}
$("#mhide").onclick=()=>setUi(true);
$("#mshow").onclick=()=>{setUi(false);wake()};

let idleT;
function wake(){
  stage.classList.remove("idle");
  clearTimeout(idleT);
  idleT=setTimeout(()=>stage.classList.add("idle"),4000);
}
["pointermove","pointerdown","keydown","touchstart"].forEach(ev=>document.addEventListener(ev,wake,{passive:true}));

document.addEventListener("keydown",e=>{
  if(e.ctrlKey||e.metaKey||e.altKey)return;
  const onCtl=e.target.closest&&e.target.closest("select");
  if(e.key==="ArrowRight"&&!onCtl)step(1);
  else if(e.key==="ArrowLeft"&&!onCtl)step(-1);
  else if(e.key==="2")setGrid(2);
  else if(e.key==="3")setGrid(3);
  else if((e.key==="f"||e.key==="F")&&canFs)toggleFs();
  else if(e.key==="h"||e.key==="H")setUi(!uiHidden);
  else if((e.key===" "||e.code==="Space")&&!e.target.closest("button,select,a,.tile")){e.preventDefault();togglePause()}
  else if(e.key==="Escape"){if(solo){solo=null;draw()}else if(uiHidden)setUi(false)}
});

async function lock(){
  try{if("wakeLock"in navigator&&!document.hidden)await navigator.wakeLock.request("screen")}catch(e){}
}
document.addEventListener("visibilitychange",()=>{
  if(document.hidden){clearTimeout(timer);stopAll()}
  else{lock();favs=favList();draw()}
});

$("#mlang").onclick=()=>{
  setLang(getLang()==="id"?"en":"id");
  applyI18n();fillSecs();drawChrome();
  if(!favs.length)msg.textContent=t("multi_empty");
  if(tick)tick();
};

tick=startClock();
applyI18n();
fillSecs();
draw();
lock();
wake();
