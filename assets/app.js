const grid=$("#grid"),dlg=$("#dlg");
const norm=s=>s.toLowerCase().replace(/\s+/g," ").trim();
const VALID=new Set(CAMS.map(c=>c.id));

let live=new Map();
let status={};
let lastKnown={};
const KNOWN_TTL=2*3600*1000;
const known=(()=>{
  const o=LS.get("known",{}),n=Date.now(),k={};
  if(o&&typeof o==="object")for(const id in o){
    const v=o[id];
    if(Array.isArray(v)&&(v[0]==="on"||v[0]==="off")&&n-v[1]<KNOWN_TTL)k[id]=v;
  }
  return k;
})();
for(const id in known)if(VALID.has(id))lastKnown[id]=known[id][0];
let saveT=0;
function saveKnown(){
  clearTimeout(saveT);
  saveT=setTimeout(()=>LS.set("known",known),1500);
}

const loadIds=k=>{const a=LS.get(k,[]);return new Set(Array.isArray(a)?a.filter(id=>VALID.has(id)):[])};
const favs=loadIds("favs");
let applied=loadIds("sel");
let draft=new Set(applied);
let area=LS.get("area","");
let favOnly=!!LS.get("favOnly",false);
let onlyOnline=!!LS.get("onlyOnline",false);
let sortOnline=LS.get("sortOnline",true)!==false;

(()=>{
  const m=location.hash.match(/[#&]cams=([^&]*)/);
  if(!m)return;
  const ids=decodeURIComponent(m[1]).split(",").filter(id=>VALID.has(id));
  if(ids.length){applied=new Set(ids);draft=new Set(ids)}
})();

const PREFIX=/^(simpang|ruas jalan|jalan|bundaran|patung|pelabuhan)\s+/i;
function streetsOf(detail){
  const out=new Set();
  detail.split(/\s+-\s*|\s*-\s+/).forEach(p=>{
    p=p.replace(PREFIX,"").replace(/\s+(Barat|Utara|Selatan|Timur)$/i,"").trim();
    if(p)out.add(p);
  });
  return[...out];
}
CAMS.forEach(c=>{c.streets=c.streets||streetsOf(c.detail)});
const CATS=["Jalan","Simpang","Pantai","Pura","Pasar","Taman","Kantor"];
const AREAS=(()=>{
  const n=new Map();
  CAMS.forEach(c=>c.streets.forEach(s=>n.set(s,(n.get(s)||0)+1)));
  const roads=[...n].filter(([s,k])=>k>=3&&!CATS.includes(s)).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,14).map(([s])=>s);
  const cats=CATS.filter(s=>n.has(s));
  return[...roads,...cats];
})();
if(!AREAS.includes(area))area="";

function baseCams(){
  const q=norm($("#q").value);
  return CAMS.filter(c=>
    (!q||norm(c.name+" "+c.detail).includes(q))&&
    (!area||c.streets.includes(area))&&
    (!favOnly||favs.has(c.id)));
}
function shownCams(){
  let a=baseCams();
  if(applied.size)a=a.filter(c=>applied.has(c.id));
  if(sortOnline){
    const r=c=>lastKnown[c.id]==="on"?0:lastKnown[c.id]==="off"?2:1;
    a=a.slice().sort((x,y)=>r(x)-r(y));
  }
  return a;
}
function refreshGrid(){render(shownCams())}
const emptyText=()=>t(favOnly&&!favs.size?"empty_fav":"empty");

const rankOf=id=>lastKnown[id]==="on"?0:lastKnown[id]==="off"?2:1;
let ordT=0,lastScroll=0;
addEventListener("scroll",()=>{lastScroll=Date.now()},{passive:true});
function applyOrder(){
  let i=0;
  for(const card of grid.children){
    if(!card._cam)continue;
    card.style.order=sortOnline?rankOf(card._cam.id)*10000+i:"";
    i++;
  }
}
function queueOrder(){
  if(!sortOnline||ordT)return;
  ordT=setTimeout(()=>{
    ordT=0;
    if(!sortOnline)return;
    if(dlg.open||Date.now()-lastScroll<1500){queueOrder();return}
    applyOrder();
  },2500);
}

const vis=new Set();
let hold=false;

function setTag(card,s){
  card._tag=s;
  const tg=card.querySelector(".tag");
  tg.className="tag "+(s==="on"||s==="off"?s:"");
  tg.textContent=t("tag_"+s);
}
function startCam(card){
  const c=card._cam,v=card.querySelector(".v");
  card.classList.remove("wait");
  v.classList.add("loading");
  live.set(card,attach(card.querySelector("video"),c,s=>{
    if(s==="cari")v.classList.add("loading");
    else if(s==="off")v.classList.remove("loading");
    setTag(card,s);
    const st=s==="buf"||s==="ulang"?"on":s;
    status[c.id]=st;
    card.dataset.state=st;
    if(st==="on"||st==="off"){
      if(lastKnown[c.id]!==st)queueOrder();
      lastKnown[c.id]=st;known[c.id]=[st,Date.now()];saveKnown();
    }
    stat();
  }));
}
function stopCam(card){
  const h=live.get(card);
  if(h){(h.hard||h)();live.delete(card)}
}
function reloadCam(card){
  stopCam(card);
  delete status[card._cam.id];
  delete card.dataset.state;
  startCam(card);
  stat();
}
function fill(){
  if(hold)return;
  let n=live.size;
  for(const card of grid.children){
    if(!vis.has(card)||live.has(card))continue;
    if(n<CONFIG.maxLive){startCam(card);n++}
    else if(!card.classList.contains("wait")){
      card.classList.add("wait");
      card.querySelector(".v").classList.remove("loading");
      setTag(card,"dijeda");
    }
  }
}
function parkCard(card){
  if(live.has(card))stopCam(card);
  if(card._tag!=="dijeda"){setTag(card,"dijeda");card.querySelector(".v").classList.remove("loading")}
}
let rcQ=0;
function reconcile(){
  rcQ=0;
  if(hold)return;
  const H=innerHeight;
  for(const card of grid.children){
    if(!card._cam)continue;
    const r=card.getBoundingClientRect();
    if(r.bottom>-50&&r.top<H+50)vis.add(card);
    else if(vis.has(card)){vis.delete(card);parkCard(card)}
  }
  fill();
  live.forEach((h,card)=>{
    const v=card.querySelector("video");
    if(vis.has(card)&&v.paused&&v.readyState>=2)v.play().catch(()=>{});
  });
}
const queueReconcile=()=>{if(!rcQ)rcQ=requestAnimationFrame(reconcile)};
addEventListener("scroll",queueReconcile,{passive:true});
addEventListener("resize",queueReconcile);
setInterval(reconcile,1500);
const io=new IntersectionObserver(es=>{
  es.forEach(e=>{
    const card=e.target;
    if(e.isIntersecting)vis.add(card);
    else{vis.delete(card);parkCard(card)}
  });
  fill();
},{rootMargin:"50px"});

function syncHold(){
  const h=document.hidden||dlg.open;
  if(h===hold)return;
  hold=h;
  if(hold)live.forEach(fn=>fn());
  else{[...live.keys()].forEach(card=>{if(vis.has(card))startCam(card)});fill()}
}

function labelCard(card){
  const c=card._cam;
  card.querySelector(".v").setAttribute("aria-label",t("zoom",{n:c.name}));
  card.querySelector(".play").setAttribute("aria-label",t("play"));
  const rt=card.querySelector(".retry");
  rt.setAttribute("aria-label",t("retry_aria",{n:c.name}));
  rt.title=t("retry");
  const fv=card.querySelector(".fav"),on=favs.has(c.id);
  fv.textContent=on?"★":"☆";
  fv.setAttribute("aria-pressed",String(on));
  fv.setAttribute("aria-label",t(on?"fav_del":"fav_add",{n:c.name}));
  setTag(card,card._tag||"load");
}
function dropCard(card){
  io.unobserve(card);vis.delete(card);stopCam(card);card.remove();
  if(!grid.querySelector(".cam"))refreshGrid();else{fill();stat()}
}
function makeCard(c){
  const card=document.createElement("article");
  card.className="cam"+(c.pano?" pano":"");card._cam=c;card.dataset.id=c.id;
  card.innerHTML='<div class="vw"><div class="v loading" tabindex="0" role="button"><video muted playsinline autoplay></video><span class="tag"></span></div><button type="button" class="play">&#9654;</button><button type="button" class="fav"></button></div><div class="info"><b></b><span></span><button type="button" class="retry">&#8635;</button></div>';
  card.querySelector("b").textContent=c.name;
  card.querySelector(".info span").textContent=c.detail;
  const v=card.querySelector(".v");
  card.querySelector("video").addEventListener("playing",()=>v.classList.remove("loading"));
  v.onclick=()=>openModal(c);
  v.onkeydown=e=>{if(e.target===v&&(e.key==="Enter"||e.key===" ")){e.preventDefault();openModal(c)}};
  card.querySelector(".play").onclick=()=>startCam(card);
  card.querySelector(".retry").onclick=()=>reloadCam(card);
  card.querySelector(".fav").onclick=()=>{
    if(favs.has(c.id))favs.delete(c.id);else favs.add(c.id);
    LS.set("favs",[...favs]);
    FavAt.touch(c.id,favs.has(c.id));
    labelCard(card);
    if(favOnly&&!favs.has(c.id))dropCard(card);
  };
  labelCard(card);
  return card;
}
function render(list){
  io.disconnect();
  live.forEach(h=>(h.hard||h)());
  warm.splice(0).forEach(h=>h.hard());
  live.clear();vis.clear();
  clearTimeout(ordT);ordT=0;
  status={};
  grid.innerHTML="";
  grid.classList.toggle("only-online",onlyOnline);
  if(!list.length){
    const p=document.createElement("p");
    p.className="empty";p.textContent=emptyText();
    grid.appendChild(p);
    stat();return;
  }
  const f=document.createDocumentFragment();
  list.forEach(c=>{const card=makeCard(c);f.appendChild(card);io.observe(card)});
  grid.appendChild(f);
  stat();
}
function stat(){
  const cards=[...grid.querySelectorAll(".cam")];
  const shown=onlyOnline?cards.filter(c=>c.dataset.state!=="off"):cards;
  const active=shown.filter(c=>status[c._cam.id]==="on").length;
  $("#stat").textContent=t("stat",{n:shown.length,a:active});
}

let md=null,mcam=null;
const mState=s=>{
  const m=$("#mv");
  if(s==="cari")m.classList.add("loading");else if(s==="off")m.classList.remove("loading");
};
function loadModal(c){
  if(md){(md.hard||md)();md=null}
  Recent.add(c.id);
  $("#dt").textContent=c.name+(c.detail?" | "+c.detail:"");$("#dt").title=$("#dt").textContent;
  mcam=c;
  dlg.classList.toggle("pano",!!c.pano);$("#dv").style.removeProperty("--ar");
  $("#mv").classList.add("loading");
  md=attach($("#dv"),c,mState);
  const n=navCams().length>1;
  $("#dprev").hidden=$("#dnext").hidden=!n;
}
let lockY=null;
function lockScroll(){
  if(lockY!==null)return;
  lockY=window.scrollY;
  const b=document.body.style;
  b.position="fixed";b.top=-lockY+"px";b.left=b.right="0";b.width="100%";
}
function unlockScroll(){
  if(lockY===null)return;
  const y=lockY;lockY=null;
  const b=document.body.style;
  b.position=b.top=b.left=b.right=b.width="";
  window.scrollTo(0,y);
}
function openModal(c){
  lockScroll();
  dlg.showModal();
  loadModal(c);
  syncHold();
}
function navCams(){
  const cards=[...grid.querySelectorAll(".cam")].map((el,i)=>({el,i,o:parseInt(el.style.order,10)||0}))
    .filter(x=>getComputedStyle(x.el).display!=="none");
  cards.sort((x,y)=>x.o-y.o||x.i-y.i);
  return cards.map(x=>x.el._cam);
}
function modalGo(d){
  if(!dlg.open||!mcam)return;
  const cs=navCams();
  if(cs.length<2)return;
  const i=cs.findIndex(c=>c.id===mcam.id);
  loadModal(cs[((i<0?0:i)+d+cs.length)%cs.length]);
}
const canFs=document.fullscreenEnabled||document.webkitFullscreenEnabled;
if(!canFs)$("#dfull").hidden=true;
function toggleModalFs(){
  const d=document,el=$("#mv");
  if(d.fullscreenElement||d.webkitFullscreenElement)(d.exitFullscreen||d.webkitExitFullscreen).call(d);
  else if(canFs)(el.requestFullscreen||el.webkitRequestFullscreen).call(el);
}
$("#dprev").onclick=()=>modalGo(-1);
$("#dnext").onclick=()=>modalGo(1);
$("#dfull").onclick=toggleModalFs;
document.addEventListener("keydown",e=>{
  if(!dlg.open||e.ctrlKey||e.metaKey||e.altKey)return;
  if(e.key==="ArrowRight"){e.preventDefault();modalGo(1)}
  else if(e.key==="ArrowLeft"){e.preventDefault();modalGo(-1)}
  else if((e.key==="f"||e.key==="F")&&canFs){e.preventDefault();toggleModalFs()}
});
function closeModal(){
  if(md){(md.hard||md)();md=null}
  dlg.close();
}
function syncModal(){
  if(md)document.hidden?md():md=attach($("#dv"),mcam,mState);
}
$("#dv").addEventListener("loadedmetadata",()=>{const d=$("#dv");if(mcam&&mcam.pano&&d.videoWidth)d.style.setProperty("--ar",d.videoWidth+"/"+d.videoHeight)});
$("#dv").addEventListener("playing",()=>$("#mv").classList.remove("loading"));
$("#dc").onclick=closeModal;
dlg.addEventListener("close",()=>{
  unlockScroll();
  if(document.fullscreenElement||document.webkitFullscreenElement)(document.exitFullscreen||document.webkitExitFullscreen).call(document);
  $("#mv").classList.remove("loading");
  if(md){(md.hard||md)();md=null}
  syncHold();
});
dlg.addEventListener("click",e=>{if(e.target===dlg)closeModal()});
document.addEventListener("visibilitychange",()=>{syncHold();syncModal()});

function updatePickBtn(){
  $("#pilihCam").textContent=t("pick")+(applied.size?" ("+applied.size+")":"");
  $("#pilihCam").setAttribute("aria-expanded",String(!$("#panelCam").hidden));
}
function updatePickerCount(){$("#pilihCount").textContent=t("picker_count",{n:draft.size})}
function drawPicker(){
  const list=$("#daftarPilihan");
  list.innerHTML="";
  const f=document.createDocumentFragment();
  baseCams().forEach(c=>{
    const label=document.createElement("label");label.className="cam-option";
    const cb=document.createElement("input");
    cb.type="checkbox";cb.value=c.id;cb.checked=draft.has(c.id);
    cb.addEventListener("change",()=>{cb.checked?draft.add(c.id):draft.delete(c.id);updatePickerCount()});
    const span=document.createElement("span"),b=document.createElement("b"),s=document.createElement("small");
    b.textContent=c.name;s.textContent=c.detail;
    span.append(b,s);label.append(cb,span);f.appendChild(label);
  });
  list.appendChild(f);
  updatePickerCount();
}
function applySelection(){
  applied=new Set(draft);
  LS.set("sel",[...applied]);
  updatePickBtn();
  refreshGrid();
}
function flash(btn,text){
  btn.textContent=text;
  clearTimeout(btn._t);
  btn._t=setTimeout(()=>{btn.textContent=t("copy_link")},1800);
}
async function copyLink(){
  const btn=$("#salinLink"),ids=[...(draft.size?draft:applied)];
  if(!ids.length){flash(btn,t("copy_none"));return}
  const url=location.href.split("#")[0]+"#cams="+ids.join(",");
  try{await navigator.clipboard.writeText(url)}
  catch(e){window.prompt(t("copy_prompt"),url);return}
  flash(btn,t("copied"));
}
$("#pilihCam").onclick=()=>{
  const p=$("#panelCam");
  p.hidden=!p.hidden;
  if(!p.hidden){draft=new Set(applied);drawPicker()}
  updatePickBtn();
};
$("#pilihSemua").onclick=()=>{baseCams().forEach(c=>draft.add(c.id));drawPicker()};
$("#hapusPilihan").onclick=()=>{draft.clear();applySelection();drawPicker()};
$("#terapkanPilihan").onclick=()=>{applySelection();$("#panelCam").hidden=true;updatePickBtn()};
$("#salinLink").onclick=copyLink;

let qTimer;
$("#q").addEventListener("input",()=>{
  clearTimeout(qTimer);
  qTimer=setTimeout(()=>{if(!$("#panelCam").hidden)drawPicker();refreshGrid()},200);
});

function drawChips(){
  const box=$("#chips");
  box.innerHTML="";
  box.hidden=AREAS.length<2;
  const add=(label,value)=>{
    const b=document.createElement("button");
    b.type="button";b.className="chip";b.textContent=label;
    b.setAttribute("aria-pressed",String(area===value));
    b.onclick=()=>{
      area=area===value?"":value;
      LS.set("area",area);
      drawChips();
      if(!$("#panelCam").hidden)drawPicker();
      refreshGrid();
    };
    box.appendChild(b);
  };
  add(t("area_all"),"");
  AREAS.forEach(a=>add(a,a));
  if(!area)box.firstChild.onclick=()=>{};
}
function syncToggles(){
  $("#fFav").setAttribute("aria-pressed",String(favOnly));
  $("#fOn").setAttribute("aria-pressed",String(onlyOnline));
  $("#fSort").setAttribute("aria-pressed",String(sortOnline));
}
$("#fFav").onclick=()=>{favOnly=!favOnly;LS.set("favOnly",favOnly);syncToggles();if(!$("#panelCam").hidden)drawPicker();refreshGrid()};
$("#fOn").onclick=()=>{onlyOnline=!onlyOnline;LS.set("onlyOnline",onlyOnline);syncToggles();grid.classList.toggle("only-online",onlyOnline);stat()};
$("#fSort").onclick=()=>{sortOnline=!sortOnline;LS.set("sortOnline",sortOnline);syncToggles();refreshGrid()};

$("#reload").onclick=()=>{status={};lastKnown={};for(const id in known)delete known[id];LS.set("known",known);refreshGrid()};

let tick,wxDraw;
function onLang(){
  applyI18n();
  updatePickBtn();
  drawChips();
  updatePickerCount();
  grid.querySelectorAll(".cam").forEach(labelCard);
  const e=grid.querySelector(".empty");
  if(e)e.textContent=emptyText();
  stat();
  if(wxDraw)wxDraw();
  if(tick)tick();
}
$("#lang").onclick=()=>{setLang(getLang()==="id"?"en":"id");onLang()};

tick=startClock();
wxDraw=startWeather($("#wx"));
applyI18n();
syncToggles();
updatePickBtn();
drawChips();
refreshGrid();

(()=>{
  const m=location.hash.match(/[#&]cam=([^&]*)/);
  if(!m)return;
  const c=CAMS.find(x=>x.id===decodeURIComponent(m[1]));
  const rest=location.hash.slice(1).split("&").filter(p=>p&&!/^cam=/.test(p)).join("&");
  history.replaceState(null,"",location.pathname+location.search+(rest?"#"+rest:""));
  if(c)openModal(c);
})();
