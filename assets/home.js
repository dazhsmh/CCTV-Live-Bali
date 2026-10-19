const grid=$("#regions");
const RIDS=REGIONS.map(r=>r.id);

(()=>{
  const m=location.hash.match(/[#&]cams=([^&]*)/);
  if(!m)return;
  const id=decodeURIComponent(m[1]).split(",")[0];
  const c=CAMS.find(c=>c.id===id);
  if(c)location.replace(c.region+"/"+location.hash);
})();

let chosen=(()=>{
  const a=LS.get("kioskRegions",null);
  const v=Array.isArray(a)?a.filter(id=>RIDS.includes(id)):[];
  return new Set(v.length?v:RIDS);
})();

const NS="http://www.w3.org/2000/svg";
const NAMES={};
const RMAP=new Map(REGIONS.map(r=>[r.id,r]));
const MAPIDS=Object.keys(BALI_MAP.regions).sort((a,b)=>BALI_MAP.regions[a].cx-BALI_MAP.regions[b].cx);
const VB=BALI_MAP.vb;
const CCTV_ICON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g transform="rotate(14 12 9)"><rect x="3.2" y="5.4" width="14.6" height="7.2" rx="2.2" fill="currentColor" fill-opacity=".2"/><path d="M5 4.1h11.4"/><rect x="17.8" y="6.4" width="3.4" height="5.2" rx="1" fill="currentColor" fill-opacity=".2"/><circle cx="19.5" cy="9" r="1.35" fill="currentColor" stroke="none"/><circle cx="6.5" cy="8.3" r=".75" fill="currentColor" stroke="none"/><path d="M9 8.3h5" stroke-opacity=".55" stroke-width="1.1"/></g><circle cx="9.6" cy="14.3" r="1.1" fill="currentColor" stroke="none"/><path d="M9.6 14.8v4.4"/><path d="M5.6 20.4h8"/></svg>';
const MK_OFF={badung:[-8,-70],denpasar:[10,0]};
const svg=$("#map"),mks=$("#mks"),card=$("#mcard");
const regName=id=>RMAP.has(id)?RMAP.get(id).name:NAMES[id]||id;
const nCams=id=>RMAP.has(id)?RMAP.get(id).cams.length:0;

let hov=null,sel=null,ptr="mouse";
const paths={},marks={};
const isTouchUI=()=>matchMedia("(hover:none),(pointer:coarse)").matches||ptr==="touch"||ptr==="pen";
const isSmall=()=>matchMedia("(max-width:899px)").matches;

function pick(id,e){
  const r=RMAP.get(id);
  if(!r){if(e.preventDefault)e.preventDefault();sel=id;paint();return}
  if(ptr==="touch"&&sel!==id){e.preventDefault();sel=id;paint();return}
  if(e.currentTarget.tagName!=="A")location.href=id+"/";
}
function enter(id,e){if(e.pointerType&&e.pointerType!=="mouse")return;hov=id;paint()}
function leave(id,e){if(e.pointerType&&e.pointerType!=="mouse")return;if(hov===id){hov=null;paint()}}

function buildMap(){
  svg.setAttribute("viewBox",VB.join(" "));
  const g=document.createElementNS(NS,"g");
  MAPIDS.forEach(id=>{
    const p=document.createElementNS(NS,"path");
    p.setAttribute("d",BALI_MAP.regions[id].d);
    p.setAttribute("fill-rule","evenodd");
    p.setAttribute("class","rg"+(RMAP.has(id)?"":" none"));
    p.dataset.id=id;
    p.style.animationDelay=sec(T0+.15+MAPIDS.indexOf(id)*.09);
    p.addEventListener("pointerenter",e=>enter(id,e));
    p.addEventListener("pointerleave",e=>leave(id,e));
    p.addEventListener("click",e=>pick(id,e));
    g.appendChild(p);paths[id]=p;
  });
  const hl=document.createElementNS(NS,"path");
  hl.setAttribute("class","hl");hl.id="hl";
  svg.append(g,hl);
  const f=document.createDocumentFragment();
  MAPIDS.forEach(id=>{
    const R=BALI_MAP.regions[id],has=RMAP.has(id);
    const m=document.createElement(has?"a":"button");
    m.className="mk"+(has?"":" none");
    if(has)m.href=id+"/";else m.type="button";
    const k=MAPIDS.indexOf(id);
    m.style.animationDelay=sec(T0+.95+k*.08);
    m.style.setProperty("--pd",sec(T0+2+k*.35));
    const [ox,oy]=MK_OFF[id]||[0,0];
    m.style.left=((R.cx+ox-VB[0])/VB[2]*100).toFixed(2)+"%";
    m.style.top=((R.cy+oy-VB[1])/VB[3]*100).toFixed(2)+"%";
    m.innerHTML=CCTV_ICON+(has?'<i class="mk-dot"></i>':"")+'<span class="mk-lb"></span>';
    m.querySelector(".mk-lb").style.animationDelay=sec(T0+1.3+k*.08);
    m.addEventListener("pointerenter",e=>enter(id,e));
    m.addEventListener("pointerleave",e=>leave(id,e));
    m.addEventListener("click",e=>pick(id,e));
    m.addEventListener("focus",()=>{if(ptr==="key"){hov=id;paint()}});
    m.addEventListener("blur",()=>{if(hov===id){hov=null;paint()}});
    f.appendChild(m);marks[id]=m;
  });
  mks.appendChild(f);
}

function fillWx(w){
  const d=Weather.get(w.dataset.id);
  w.hidden=!d;w.textContent="";
  if(!d)return;
  const [k,ic]=Weather.group(d.code),lbl=t("wx"+k)+(d.rain>0?" · "+d.rain+" mm":"");
  const i=document.createElement("span"),b=document.createElement("b"),s=document.createElement("small");
  i.className="mc-wi";i.setAttribute("aria-hidden","true");i.textContent=ic;
  b.textContent=d.temp+"°C";s.textContent=lbl;
  w.append(i,b,s);
  w.setAttribute("role","img");
  w.setAttribute("aria-label",t("wx_label",{n:regName(w.dataset.id)})+": "+d.temp+"°C, "+lbl);
  w.title=t("wx_label",{n:regName(w.dataset.id)});
}
function drawCard(){
  const id=hov||sel;
  card.innerHTML="";
  if(!id){
    const p=document.createElement("p");
    p.className="mc-h";p.textContent=t(isTouchUI()?"map_hint_touch":isSmall()?"map_hint_small":"map_hint");
    card.appendChild(p);return;
  }
  const r=RMAP.get(id);
  const k=document.createElement("small"),n=document.createElement("b"),c=document.createElement("span");
  k.className="mc-k";n.className="mc-n";c.className="mc-c";
  k.textContent=t(r&&r.kota?"kota":"kab");
  n.textContent=regName(id);
  c.textContent=r?t("n_cams",{n:r.cams.length}):t("no_cctv");
  const w=document.createElement("span");
  w.className="mc-w";w.dataset.id=id;fillWx(w);
  const kc=document.createElement("div");
  kc.className="mc-kc";kc.append(k,c);
  card.append(kc,n,w);
  if(r){
    const a=document.createElement("a");
    a.className="btn primary mk-go";a.href=id+"/";
    a.setAttribute("aria-label",t("open_region",{n:r.name}));
    const lf=document.createElement("span"),ls=document.createElement("span");
    lf.className="l-full";lf.textContent=t("open_region",{n:r.name});
    ls.className="l-short";ls.textContent=t("open_short")+" \u2192";
    a.append(lf,ls);
    card.appendChild(a);
  }
}
function paint(){
  const act=hov||sel;
  MAPIDS.forEach(id=>{
    const on=id===act;
    paths[id].classList.toggle("on",on);
    marks[id].classList.toggle("on",on);
  });
  $("#hl").setAttribute("d",act?BALI_MAP.regions[act].d:"");
  drawCard();
}
let heroDone=false;
function drawHero(){
  const h=$("#heroT");
  h.textContent="";
  h.classList.toggle("static",heroDone);
  t("hero_title").split(" ").forEach((w,i)=>{
    const o=document.createElement("span"),n=document.createElement("span");
    o.className="w";n.textContent=w;n.style.animationDelay=sec(T0+.3+i*.09);
    o.appendChild(n);h.appendChild(o);
  });
  heroDone=true;
}
const root=document.documentElement;
const T0=root.classList.contains("intro")?1.6:0;
const reduced=matchMedia("(prefers-reduced-motion:reduce)").matches&&!root.classList.contains("fullmotion");
const sec=n=>(n).toFixed(2)+"s";
function countUp(el,to,delay){
  if(!to){el.textContent=to;return}
  const dur=2200;let t0=null;
  el.textContent="1";
  const step=ts=>{
    if(t0===null)t0=ts+delay;
    const k=Math.min(Math.max((ts-t0)/dur,0),1),e=1-Math.pow(1-k,3);
    el.textContent=Math.round(1+(to-1)*e);
    if(k<1)requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
let counted=false;
function drawCounts(){
  const a=$("#nCam"),b=$("#nReg");
  if(counted){a.textContent=CAMS.length;b.textContent=REGIONS.length;return}
  counted=true;
  a.textContent=b.textContent="1";
  setTimeout(()=>{countUp(a,CAMS.length,0);countUp(b,REGIONS.length,0)},(T0+1)*1000);
}
(()=>{
  const box=$("#mapbox");
  if(reduced)return;
  addEventListener("pointermove",e=>{
    if(e.pointerType!=="mouse")return;
    const r=box.getBoundingClientRect();
    const x=Math.max(-1,Math.min(1,(e.clientX-r.left)/r.width*2-1));
    const y=Math.max(-1,Math.min(1,(e.clientY-r.top)/r.height*2-1));
    box.style.setProperty("--ty",(x*2.2).toFixed(2)+"deg");
    box.style.setProperty("--tx",(-y*2.2).toFixed(2)+"deg");
  },{passive:true});
  box.addEventListener("pointerleave",()=>{box.style.setProperty("--tx","0deg");box.style.setProperty("--ty","0deg")});
})();

function labelMap(){
  drawHero();drawCounts();
  MAPIDS.forEach(id=>{
    const m=marks[id],n=regName(id);
    m.querySelector(".mk-lb").textContent=n;
    m.setAttribute("aria-label",RMAP.has(id)?t("mk_aria",{n,c:nCams(id)}):t("mk_aria_none",{n}));
  });
  paint();
  drawSearch();drawQuick();
}
addEventListener("pointerdown",e=>{const o=ptr;ptr=e.pointerType||"mouse";if(o!==ptr&&!hov&&!sel)drawCard()},true);
matchMedia("(max-width:899px)").addEventListener("change",()=>{if(!hov&&!sel)drawCard()});
addEventListener("keydown",()=>{ptr="key"},true);
svg.addEventListener("click",e=>{if(e.target===svg&&sel){sel=null;paint()}});

function setChosen(ids){
  chosen=new Set(ids);
  LS.set("kioskRegions",[...chosen]);
  drawAuto();
}
function drawAuto(){
  const box=$("#autoChips");
  box.innerHTML="";
  const add=(label,on,fn)=>{
    const b=document.createElement("button");
    b.type="button";b.className="chip";b.textContent=label;
    b.setAttribute("aria-pressed",String(on));
    b.onclick=fn;
    box.appendChild(b);
  };
  const all=chosen.size===REGIONS.length;
  add(t("all_regions"),all,()=>setChosen(RIDS));
  REGIONS.forEach(r=>add(r.name,chosen.has(r.id),()=>{
    const s=new Set(chosen);
    if(s.has(r.id)){if(s.size>1)s.delete(r.id)}else s.add(r.id);
    setChosen([...s]);
  }));
  $("#autoStart").href="auto/"+(all?"":"#r="+[...chosen].join(","));
}

const SEARCH_MAX=8;
const fold=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const SIDX=CAMS.map(c=>({c,n:fold(c.name),h:fold(c.name+" "+c.detail+" "+regName(c.region))}));
const sq=$("#sq"),sres=$("#sres");
let items=[],act=-1,hovBySearch=false;
function search(q){
  const tk=fold(q).split(/\s+/).filter(Boolean);
  if(!tk.length)return null;
  const regs=REGIONS.filter(r=>tk.every(k=>fold(r.name).includes(k)));
  const hits=[];
  SIDX.forEach((x,i)=>{
    if(!tk.every(k=>x.h.includes(k)))return;
    hits.push([x.n.startsWith(tk[0])?0:tk.every(k=>x.n.includes(k))?1:2,i,x.c]);
  });
  hits.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
  return{regs,cams:hits.map(h=>h[2])};
}
function closeSearch(){
  sres.hidden=true;sq.setAttribute("aria-expanded","false");sq.removeAttribute("aria-activedescendant");
  act=-1;
  if(hovBySearch){hovBySearch=false;hov=null;paint()}
}
function setAct(i){
  act=i;
  items.forEach((it,k)=>it.li.setAttribute("aria-selected",String(k===i)));
  const it=items[i];
  if(!it){sq.removeAttribute("aria-activedescendant");return}
  sq.setAttribute("aria-activedescendant",it.li.id);
  it.li.scrollIntoView({block:"nearest"});
  hovBySearch=true;hov=it.rid;paint();
}
function drawSearch(keep){
  const q=sq.value,res=search(q),prev=keep?act:-1;
  sres.innerHTML="";items=[];act=-1;
  if(!res){closeSearch();return}
  if(prev<0&&hovBySearch){hovBySearch=false;hov=null;paint()}
  const add=(href,title,sub,rid)=>{
    const li=document.createElement("li"),a=document.createElement("a"),w=document.createElement("span"),b=document.createElement("b"),s=document.createElement("small");
    li.id="sr"+items.length;li.setAttribute("role","option");li.setAttribute("aria-selected","false");
    a.href=href;a.tabIndex=-1;b.textContent=title;s.textContent=sub;
    w.append(b,s);a.appendChild(w);li.appendChild(a);
    li.addEventListener("pointermove",e=>{if(e.pointerType!=="mouse")return;const k=items.findIndex(x=>x.li===li);if(k!==act)setAct(k)});
    sres.appendChild(li);items.push({li,href,rid});
  };
  res.regs.forEach(r=>add(r.id+"/",r.name,t("s_region",{k:t(r.kota?"kota":"kab"),n:r.cams.length}),r.id));
  const shown=res.cams.slice(0,SEARCH_MAX);
  shown.forEach(c=>add(c.region+"/#cam="+encodeURIComponent(c.id),c.name,regName(c.region)+(c.detail?" · "+c.detail:""),c.region));
  if(!items.length){
    const li=document.createElement("li");li.className="s-msg";li.setAttribute("role","presentation");
    li.textContent=t("s_none",{q:q.trim()});sres.appendChild(li);
  }else if(res.cams.length>shown.length){
    const li=document.createElement("li");li.className="s-msg";li.setAttribute("role","presentation");
    li.textContent=t("s_more",{n:res.cams.length-shown.length});sres.appendChild(li);
  }
  sres.hidden=false;sq.setAttribute("aria-expanded","true");
  if(prev>=0&&prev<items.length)setAct(prev);
}
sq.addEventListener("input",drawSearch);
sq.addEventListener("focus",()=>{if(sq.value.trim())drawSearch()});
sq.addEventListener("keydown",e=>{
  if(e.key==="Escape"){if(!sres.hidden){closeSearch();e.preventDefault()}return}
  if(sres.hidden||!items.length)return;
  if(e.key==="ArrowDown"){e.preventDefault();setAct((act+1)%items.length)}
  else if(e.key==="ArrowUp"){e.preventDefault();setAct((act-1+items.length)%items.length)}
  else if(e.key==="Enter"){e.preventDefault();location.href=items[Math.max(act,0)].href}
});
addEventListener("pointerdown",e=>{if(!e.target.closest(".sbox"))closeSearch()});

const HOME_FAV_MAX=6,HOME_RECENT_MAX=6;
const CMAP=new Map(CAMS.map(c=>[c.id,c]));
function allFavs(){
  const at=FavAt.get(),out=[];
  REGIONS.forEach(r=>{
    const a=LS.get("favs",[],r.id);
    if(Array.isArray(a))a.forEach((id,i)=>{const c=CMAP.get(id);if(c&&c.region===r.id)out.push({c,at:at[id]||0,i})});
  });
  return out.sort((a,b)=>b.at-a.at||b.i-a.i).map(x=>x.c);
}
function ago(ts){
  const s=Math.max(0,(Date.now()-ts)/1000),f=new Intl.RelativeTimeFormat(getLang()==="en"?"en":"id",{numeric:"auto"});
  if(s<45)return f.format(0,"second");
  if(s<3600)return f.format(-Math.max(1,Math.round(s/60)),"minute");
  if(s<86400)return f.format(-Math.round(s/3600),"hour");
  return f.format(-Math.round(s/86400),"day");
}
function qcard(c,time,onX){
  const d=document.createElement("div"),a=document.createElement("a"),b=document.createElement("b"),s=document.createElement("small");
  d.className="qc";a.className="qc-main";a.href=c.region+"/#cam="+encodeURIComponent(c.id);
  b.textContent=c.name;
  s.textContent=regName(c.region)+(c.detail?" · "+c.detail:"");
  a.append(b,s);
  if(time){const m=document.createElement("small");m.className="qc-t";m.textContent=ago(time);a.appendChild(m)}
  d.appendChild(a);
  if(onX){
    const x=document.createElement("button");
    x.type="button";x.className="qc-x";x.textContent="★";
    x.setAttribute("aria-label",t("fav_del",{n:c.name}));x.title=t("fav_del",{n:c.name});
    x.onclick=onX;d.appendChild(x);
  }
  return d;
}
function drawQuick(){
  const favs=allFavs(),fl=$("#favList"),fn=$("#favNote");
  fl.innerHTML="";
  favs.slice(0,HOME_FAV_MAX).forEach(c=>fl.appendChild(qcard(c,0,()=>{
    const a=LS.get("favs",[],c.region);
    LS.set("favs",(Array.isArray(a)?a:[]).filter(i=>i!==c.id),c.region);
    FavAt.touch(c.id,false);drawQuick();
  })));
  $("#favPlay").hidden=!favs.length;
  fn.textContent=!favs.length?t("fav_empty"):favs.length>HOME_FAV_MAX?t("fav_limit",{n:HOME_FAV_MAX,m:favs.length}):"";
  const rec=Recent.list().filter(x=>CMAP.has(x.id)).slice(0,HOME_RECENT_MAX),rl=$("#recList");
  rl.innerHTML="";
  rec.forEach(x=>rl.appendChild(qcard(CMAP.get(x.id),x.t)));
  if(!rec.length){const p=document.createElement("p");p.className="q-note";p.textContent=t("rec_empty");rl.appendChild(p)}
  $("#recClear").hidden=!rec.length;
}
$("#recClear").onclick=()=>{Recent.clear();drawQuick()};
const refreshData=()=>drawQuick();
addEventListener("pageshow",e=>{if(e.persisted)refreshData()});
addEventListener("storage",refreshData);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)refreshData()});
setInterval(()=>{if(!document.hidden)drawQuick()},60000);

Weather.on(()=>{const w=card.querySelector(".mc-w");if(w)fillWx(w)});
Weather.load(MAPIDS);
setInterval(()=>Weather.load(MAPIDS),10*60*1000);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)Weather.load(MAPIDS)});

let tick;
$("#lang").onclick=()=>{setLang(getLang()==="id"?"en":"id");applyI18n();labelMap();drawAuto();if(tick)tick()};

tick=startClock();
applyI18n();
buildMap();
labelMap();
drawAuto();
