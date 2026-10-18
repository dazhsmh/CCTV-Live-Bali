const stage=$("#stage"),video=$("#kv"),msg=$("#msg"),prog=$("#prog");
const byId=new Map(CAMS.map(c=>[c.id,c]));
const RMAP=new Map(REGIONS.map(r=>[r.id,r]));
const INTERVALS=[10,15,30,60,120];

const hashPart=k=>{
  const m=location.hash.match(new RegExp("[#&]"+k+"=([^&]*)"));
  return m?decodeURIComponent(m[1]).split(",").filter(Boolean):[];
};
const hashIds=hashPart("cams").filter(id=>byId.has(id));
const validRegs=a=>Array.isArray(a)?a.filter(id=>RMAP.has(id)):[];

let regs=(()=>{
  let a=validRegs(hashPart("r"));
  if(!a.length)a=validRegs(LS.get("kioskRegions",null));
  if(!a.length)a=REGIONS.map(r=>r.id);
  return new Set(a);
})();
let shuf=!!LS.get("kioskShuf",false);
let onFirst=!!LS.get("kioskOnFirst",false),onlyOn=!!LS.get("kioskOnlyOn",false);

const KTTL=2*3600*1000;
const readKnown=()=>{
  const o=LS.get("known",{}),n=Date.now(),k={};
  if(o&&typeof o==="object")for(const id in o){const v=o[id];if(Array.isArray(v)&&(v[0]==="on"||v[0]==="off")&&n-v[1]<KTTL)k[id]=v}
  return k;
};
let known=readKnown(),saveKT=0;
const stOf=c=>known[c.id]?known[c.id][0]:"";
const rankOf=c=>stOf(c)==="on"?0:stOf(c)==="off"?2:1;
function note(c,st){
  known[c.id]=[st,Date.now()];
  clearTimeout(saveKT);
  saveKT=setTimeout(()=>{known=Object.assign(readKnown(),known);LS.set("known",known)},1500);
}

let source=hashIds.length?"link":LS.get("kioskSrc","all");
if(!["all","fav","sel","link"].includes(source)||(source==="link"&&!hashIds.length))source="all";
let secs=INTERVALS.includes(LS.get("kioskSecs",30))?LS.get("kioskSecs",30):30;

let list=[],idx=0,paused=false,timer=null,skipT=null,handle=null,lastTag="cari";

const idsOf=k=>{
  const s=new Set();
  REGIONS.forEach(r=>{
    const a=LS.get(k,[],r.id);
    if(Array.isArray(a))a.forEach(id=>{if(byId.has(id))s.add(id)});
  });
  return s;
};
function pool(src){
  if(src==="link")return hashIds.map(id=>byId.get(id));
  let a=CAMS.filter(c=>regs.has(c.region));
  if(src==="fav"||src==="sel"){const s=idsOf(src==="fav"?"favs":"sel");a=a.filter(c=>s.has(c.id))}
  return a;
}
function shuffled(a){
  a=a.slice();
  for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}
  return a;
}
const listFor=src=>{
  let a=src!=="link"&&shuf?shuffled(pool(src)):pool(src);
  if(onlyOn)a=a.filter(c=>stOf(c)!=="off");
  if(onFirst)a=a.map((c,i)=>[c,i]).sort((x,y)=>rankOf(x[0])-rankOf(y[0])||x[1]-y[1]).map(x=>x[0]);
  return a;
};

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
    msg.textContent=t(onlyOn?"k_none_online":"k_none");msg.hidden=false;
    $("#kname").textContent="";$("#kdetail").textContent="";
    $("#ktag").className="ktag";$("#ktag").textContent="";
    drawCount();restartProgress();
    return;
  }
  msg.hidden=true;
  idx=((i%list.length)+list.length)%list.length;
  const c=list[idx];
  $("#kname").textContent=c.name;
  $("#kdetail").textContent=[c.detail,RMAP.get(c.region).name].filter(Boolean).join(" · ");
  drawCount();
  setTag("cari");
  if(wxDraw)wxDraw();
  video.classList.toggle("pano",!!c.pano);video.style.removeProperty("--ar");
  handle=attach(video,c,s=>{
    if(list[idx]!==c)return;
    setTag(s);
    if(s==="on"||s==="off")note(c,s);
    if(s==="off"&&onlyOn){dropCurrent(c);return}
    if(s==="on")clearTimeout(skipT);
    if(s==="off"&&list.length>1&&!paused){
      clearTimeout(skipT);
      skipT=setTimeout(()=>{if(list[idx]===c&&!paused)next()},6000);
    }
  });
  startTimer();
}
function dropCurrent(c){
  const k=list.indexOf(c);
  if(k<0)return;
  list.splice(k,1);
  clearTimeout(skipT);
  show(k);
}
const next=()=>show(idx+1);
video.addEventListener("loadedmetadata",()=>{const c=list[idx];if(c&&c.pano&&video.videoWidth)video.style.setProperty("--ar",video.videoWidth+"/"+video.videoHeight)});
const prev=()=>show(idx-1);

function rebuild(){
  list=listFor(source);
  show(0);
}
function setSource(src){
  source=src;
  if(src!=="link")LS.set("kioskSrc",src);
  rebuild();
}
function setRegs(ids){
  regs=new Set(ids);
  LS.set("kioskRegions",[...regs]);
  drawRegs();
  fillSelects();
  if(source!=="link")rebuild();
}
function toggleReg(id){
  const s=new Set(regs);
  if(s.has(id)){if(s.size>1)s.delete(id);else return}
  else s.add(id);
  setRegs([...s]);
}
function togglePause(){
  paused=!paused;
  $("#kpause").textContent=t(paused?"k_play":"k_pause");
  clearTimeout(skipT);
  startTimer();
}

function drawRegs(){
  const box=$("#kreg");
  box.innerHTML="";
  const add=(label,on,fn)=>{
    const b=document.createElement("button");
    b.type="button";b.className="kbtn";b.textContent=label;
    b.setAttribute("aria-pressed",String(on));
    b.onclick=fn;
    box.appendChild(b);
  };
  add(t("k_all_regions"),regs.size===REGIONS.length,()=>setRegs(REGIONS.map(r=>r.id)));
  REGIONS.forEach(r=>add(r.name+" ("+r.cams.length+")",regs.has(r.id),()=>toggleReg(r.id)));
  const rb=$("#kregbtn");
  rb.textContent=t("k_regions")+" ("+regs.size+"/"+REGIONS.length+")";
  rb.setAttribute("aria-expanded",String(!box.hidden));
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
    o.value=v;o.textContent=t(k)+" ("+pool(v).length+")";o.selected=v===source;
    r.appendChild(o);
  });
}
$("#ksecs").onchange=e=>{secs=+e.target.value;LS.set("kioskSecs",secs);startTimer()};
$("#ksrc").onchange=e=>setSource(e.target.value);
$("#kprev").onclick=prev;
$("#knext").onclick=next;
$("#kpause").onclick=togglePause;
$("#kregbtn").onclick=()=>{const b=$("#kreg");b.hidden=!b.hidden;drawRegs()};
$("#kshuf").onclick=()=>{
  shuf=!shuf;LS.set("kioskShuf",shuf);
  $("#kshuf").setAttribute("aria-pressed",String(shuf));
  rebuild();
};

function syncToggles(){
  $("#konfirst").setAttribute("aria-pressed",String(onFirst));
  $("#konly").setAttribute("aria-pressed",String(onlyOn));
}
function toggleOn(which){
  if(which==="first"){onFirst=!onFirst;LS.set("kioskOnFirst",onFirst)}
  else{onlyOn=!onlyOn;LS.set("kioskOnlyOn",onlyOn)}
  known=Object.assign(readKnown(),known);
  syncToggles();
  rebuild();
}
$("#konfirst").onclick=()=>toggleOn("first");
$("#konly").onclick=()=>toggleOn("only");

function setPanel(o){
  $("#kpanel").hidden=!o;
  $("#kset").setAttribute("aria-expanded",String(o));
}
$("#kset").onclick=()=>setPanel($("#kpanel").hidden);

let uiHidden=false;
function setUi(h){
  uiHidden=h;
  if(h)setPanel(false);
  stage.classList.toggle("ui-hidden",h);
  $("#kshow").hidden=!h;
  (h?$("#kshow"):$("#khide")).focus({preventScroll:true});
}
$("#khide").onclick=()=>setUi(true);
$("#kshow").onclick=()=>{setUi(false);wake()};

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
  drawRegs();
  if(list.length)setTag(lastTag);
  else msg.textContent=t(onlyOn?"k_none_online":"k_none");
  drawCount();
  if(wxDraw)wxDraw();
  if(tick)tick();
}
$("#klang").onclick=()=>{setLang(getLang()==="id"?"en":"id");onLang()};

let idleT;
function wake(){
  stage.classList.remove("idle");
  clearTimeout(idleT);
  idleT=setTimeout(()=>{if($("#kpanel").hidden)stage.classList.add("idle")},4000);
}
["pointermove","pointerdown","keydown","touchstart"].forEach(ev=>document.addEventListener(ev,wake,{passive:true}));

document.addEventListener("keydown",e=>{
  if(e.ctrlKey||e.metaKey||e.altKey)return;
  const onSel=e.target.closest&&e.target.closest("select");
  if(e.key==="ArrowRight"&&!onSel)next();
  else if(e.key==="ArrowLeft"&&!onSel)prev();
  else if((e.key===" "||e.code==="Space")&&!e.target.closest("button,select,a")){e.preventDefault();togglePause()}
  else if((e.key==="f"||e.key==="F")&&canFs)$("#kfull").click();
  else if(e.key==="h"||e.key==="H")setUi(!uiHidden);
  else if(e.key==="Escape"){if(!$("#kpanel").hidden){setPanel(false);$("#kset").focus({preventScroll:true})}else if(uiHidden)setUi(false)}
});

async function lock(){
  try{if("wakeLock"in navigator&&!document.hidden)await navigator.wakeLock.request("screen")}catch(e){}
}
document.addEventListener("visibilitychange",()=>{
  if(!list.length)return;
  if(document.hidden){clearTimeout(timer);clearTimeout(skipT);if(handle)handle()}
  else{lock();show(idx)}
});

try{
  const u=new URL(document.referrer);
  const seg=u.pathname.split("/").filter(s=>s&&s!=="index.html");
  const last=seg[seg.length-1];
  if(u.origin===location.origin&&RMAP.has(last))$("#kback").href="../"+last+"/";
}catch(e){}

tick=startClock();
wxDraw=startWeather($("#wx"),()=>{
  const c=list[idx];
  return RMAP.get(c?c.region:[...regs][0]);
});
applyI18n();
$("#kpause").textContent=t("k_pause");
$("#kshuf").setAttribute("aria-pressed",String(shuf));
syncToggles();
fillSelects();
drawRegs();
list=listFor(source);
show(0);
lock();
wake();
