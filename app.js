const grid=$("#grid"),dlg=$("#dlg");
const norm=s=>s.toLowerCase().replace(/\s+/g," ").trim();
const VALID=new Set(CAMS.map(c=>c.id));

let live=new Map();
let status={};
let lastKnown={};

const loadIds=k=>{const a=LS.get(k,[]);return new Set(Array.isArray(a)?a.filter(id=>VALID.has(id)):[])};
const favs=loadIds("favs");
let applied=loadIds("sel");
let draft=new Set(applied);
let area=LS.get("area","");
let favOnly=!!LS.get("favOnly",false);
let onlyOnline=!!LS.get("onlyOnline",false);
let sortOnline=!!LS.get("sortOnline",false);

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
CAMS.forEach(c=>{c.streets=streetsOf(c.detail)});
const AREAS=(()=>{
  const n=new Map();
  CAMS.forEach(c=>c.streets.forEach(s=>n.set(s,(n.get(s)||0)+1)));
  return[...n].filter(([,k])=>k>=3).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,14).map(([s])=>s);
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
    if(st==="on"||st==="off")lastKnown[c.id]=st;
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
const io=new IntersectionObserver(es=>{
  es.forEach(e=>{
    const card=e.target;
    if(e.isIntersecting)vis.add(card);
    else{vis.delete(card);if(live.has(card)){live.get(card)();live.delete(card)}}
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
  card.className="cam";card._cam=c;card.dataset.id=c.id;
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
function openModal(c){
  $("#dt").textContent=c.name+" | "+c.detail;
  mcam=c;
  dlg.showModal();
  $("#mv").classList.add("loading");
  md=attach($("#dv"),c,mState);
  syncHold();
}
function closeModal(){
  if(md){(md.hard||md)();md=null}
  dlg.close();
}
function syncModal(){
  if(md)document.hidden?md():md=attach($("#dv"),mcam,mState);
}
$("#dv").addEventListener("playing",()=>$("#mv").classList.remove("loading"));
$("#dc").onclick=closeModal;
dlg.addEventListener("close",()=>{
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

$("#tema").onclick=()=>{
  const root=document.documentElement;
  const cur=root.dataset.theme||(matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light");
  const next=cur==="dark"?"light":"dark";
  root.dataset.theme=next;
  LS.set("theme",next);
};
$("#reload").onclick=()=>{status={};lastKnown={};refreshGrid()};

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
