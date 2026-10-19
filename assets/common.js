const CONFIG={timezone:"Asia/Makassar",maxLive:12};
const $=s=>document.querySelector(s);

const REGION_ID=(typeof REGION!=="undefined"&&REGION)?REGION.id:"";
const SCOPED=["favs","sel","area","favOnly","onlyOnline","sortOnline"];
const lk=(k,r)=>{r=r===undefined?REGION_ID:r;return"cctv."+k+(r&&r!=="denpasar"&&SCOPED.includes(k)?"."+r:"")};
const LS={
  get(k,d,r){try{const v=localStorage.getItem(lk(k,r));return v===null?d:JSON.parse(v)}catch(e){return d}},
  set(k,v,r){try{localStorage.setItem(lk(k,r),JSON.stringify(v))}catch(e){}}
};

const FavAt={
  get(){const o=LS.get("favAt",{});return o&&typeof o==="object"?o:{}},
  touch(id,on){const o=this.get();if(on)o[id]=Date.now();else delete o[id];LS.set("favAt",o)}
};
const RECENT_KEEP=20;
const Recent={
  list(){const a=LS.get("recent",[]);return Array.isArray(a)?a.filter(x=>x&&typeof x.id==="string"&&typeof x.t==="number"):[]},
  add(id){LS.set("recent",[{id,t:Date.now()}].concat(this.list().filter(x=>x.id!==id)).slice(0,RECENT_KEEP))},
  clear(){LS.set("recent",[])}
};

const T={
  id:{
    title:"CCTV Live Denpasar",
    subtitle:"Pantauan lalu lintas ATCS Kota Denpasar",
    search_ph:"Cari nama jalan atau simpang",search_aria:"Cari lokasi",
    pick:"Pilih beberapa kamera",theme:"Ganti tema",theme_dark:"Mode gelap",theme_light:"Mode terang",theme_to_dark:"Beralih ke mode gelap",theme_to_light:"Beralih ke mode terang",reload:"Muat ulang semua",
    kiosk:"Auto mode",langbtn:"EN",
    area_aria:"Filter berdasarkan jalan",area_all:"Semua area",
    fav:"★ Favorit",only_online:"Hanya online",sort_online:"Online duluan",
    sort_hint:"Urutkan kamera yang sudah terbukti online ke atas",
    stat:"{n} kamera, {a} aktif",
    empty:"Lokasi tidak ditemukan. Coba kata kunci lain.",
    empty_fav:"Belum ada kamera favorit. Tekan ikon bintang di pojok kamera untuk menambahkan.",
    picker_aria:"Pilih kamera yang ditampilkan",
    picker_title:"Pilih kamera yang ingin ditampilkan",
    picker_count:"{n} kamera dipilih",
    pick_all:"Pilih semua hasil",clear:"Hapus pilihan",apply:"Tampilkan pilihan",
    copy_link:"Salin link",copied:"Link disalin!",copy_none:"Pilih kamera dulu",
    copy_prompt:"Salin link ini:",
    picker_help:"Centang lebih dari satu kamera. Jika tidak ada pilihan khusus, semua kamera akan ditampilkan.",
    footer1:"Sumber video: ",footer2:". Situs ini tidak berafiliasi dengan Pemerintah Kota Denpasar.",
    tag_on:"LIVE",tag_off:"OFFLINE",tag_buf:"BUFFERING",tag_cari:"MENCARI",tag_ulang:"REPLAY",
    tag_dijeda:"DIJEDA",tag_load:"MEMUAT",
    zoom:"Perbesar {n}",play:"Putar kamera",retry:"Coba lagi",retry_aria:"Muat ulang kamera {n}",
    fav_add:"Tambah {n} ke favorit",fav_del:"Hapus {n} dari favorit",
    close:"Tutup",
    wx_label:"Cuaca {n}",
    wx0:"Cerah",wx1:"Cerah berawan",wx3:"Berawan",wx45:"Berkabut",wx51:"Gerimis",
    wx61:"Hujan",wx80:"Hujan sesaat",wx95:"Badai petir",
    k_title:"Auto mode",k_back:"← Kembali",k_prev:"Sebelumnya",k_next:"Berikutnya",
    k_pause:"Jeda",k_play:"Lanjut",k_full:"Layar penuh",k_every:"Ganti tiap",
    k_sec:"{n} dtk",k_source:"Sumber",k_src_all:"Semua kamera",k_src_fav:"Favorit",
    k_src_sel:"Pilihan terakhir",k_src_link:"Dari link",k_count:"{i} / {n}",
    k_none:"Tidak ada kamera pada sumber ini.",
    home_title:"CCTV Live Bali",
    home_sub:"Pantau CCTV publik di seluruh kabupaten dan kota di Bali",
    back_home:"← Semua kabupaten",kota:"Kota",kab:"Kabupaten",
    n_cams:"{n} kamera",home_total:"{n} kamera di {m} kabupaten/kota",
    auto_title:"Auto mode",
    auto_desc:"Putar kamera otomatis dari kabupaten atau kota yang dipilih. Ketuk untuk memilih atau melepas.",
    auto_start:"Mulai auto mode",all_regions:"Semua kabupaten",
    footer2_all:". Situs ini tidak berafiliasi dengan Pemerintah Provinsi Bali maupun pemerintah kabupaten/kota.",
    k_regions:"Kabupaten",k_all_regions:"Semua",k_shuffle:"Acak",k_on_first:"Online duluan",k_only_on:"Hanya online",k_none_online:"Tidak ada kamera online pada sumber ini.",k_hide_ui:"Sembunyikan UI",k_settings:"Pengaturan",k_show_ui:"Tampilkan UI",k_region_aria:"Pilih kabupaten yang diputar",
    map_title:"Peta CCTV Bali per kabupaten",map_aria:"Peta Bali per kabupaten",
    map_hint:"Arahkan kursor ke peta, lalu klik kabupaten untuk membuka CCTV-nya.",
    map_hint_touch:"Ketuk sebuah kabupaten pada peta untuk melihat detailnya.",map_hint_small:"Ketuk atau klik sebuah kabupaten pada peta untuk melihat detailnya.",
    open_region:"Buka CCTV {n}",open_short:"Buka",no_cctv:"Belum ada CCTV publik yang ditemukan di sini.",
    mk_aria:"{n}, {c} kamera",mk_aria_none:"{n}, belum ada CCTV",
    hero_title:"Seluruh CCTV Bali, di dalam satu layar.",
    hero_sub:"Pilih kabupaten di peta untuk melihat kamera yang sedang menyala.",
    hero_cams:"kamera tersebar di",hero_regions:"kabupaten/kota",
    search_home_ph:"Cari lokasi, kamera",search_home_aria:"Cari lokasi atau kamera",
    s_region:"{k} · {n} kamera",s_none:"Tidak ada hasil untuk “{q}”. Coba kata kunci lain.",s_more:"{n} hasil lain tidak ditampilkan. Persempit kata kunci.",
    fav_title:"Kamera favorit",fav_empty:"Belum ada favorit. Buka halaman kabupaten lalu tekan ☆ pada kamera.",
    fav_limit:"Menampilkan {n} dari {m} favorit terbaru. Kelola semuanya lewat tombol ★ Favorit di halaman kabupaten.",
    rec_title:"Terakhir dilihat",rec_empty:"Belum ada kamera yang dibuka layar penuh.",rec_clear:"Hapus riwayat",
    fav_play:"Putar semua favorit",
    multi_title:"Multi-kamera favorit",multi_back:"← Beranda",multi_grid:"Grid",multi_page:"Halaman {i} / {n}",
    multi_prev:"Sebelumnya",multi_next:"Berikutnya",multi_pause:"Jeda",multi_resume:"Lanjut",multi_every:"Ganti halaman tiap",multi_off:"Tidak",
    multi_empty:"Belum ada kamera favorit. Tekan ☆ pada kamera di halaman kabupaten, lalu kembali ke sini.",
    multi_count:"{n} favorit",multi_big:"Perbesar {n}",multi_small:"Kembali ke grid",
    kb_player:"← → pindah kamera · F layar penuh · Esc tutup",
    kb_auto:"← → pindah · Spasi jeda · F layar penuh · H sembunyikan UI",
    kb_multi:"← → halaman · 2 / 3 ukuran grid · Spasi jeda · F layar penuh · Esc kembali ke grid",
    cam_prev:"Kamera sebelumnya",cam_next:"Kamera berikutnya",
    wx_now:"Cuaca sekarang"
  },
  en:{
    title:"Denpasar Live CCTV",
    subtitle:"Denpasar City ATCS live traffic view",
    search_ph:"Search street or intersection",search_aria:"Search location",
    pick:"Select cameras",theme:"Toggle theme",theme_dark:"Dark mode",theme_light:"Light mode",theme_to_dark:"Switch to dark mode",theme_to_light:"Switch to light mode",reload:"Reload all",
    kiosk:"Auto mode",langbtn:"ID",
    area_aria:"Filter by street",area_all:"All areas",
    fav:"★ Favorites",only_online:"Online only",sort_online:"Online first",
    sort_hint:"Move cameras already confirmed online to the top",
    stat:"{n} cameras, {a} live",
    empty:"No locations found. Try another keyword.",
    empty_fav:"No favorite cameras yet. Tap the star on a camera to add one.",
    picker_aria:"Choose which cameras to show",
    picker_title:"Choose the cameras you want to show",
    picker_count:"{n} cameras selected",
    pick_all:"Select all results",clear:"Clear selection",apply:"Show selection",
    copy_link:"Copy link",copied:"Link copied!",copy_none:"Select cameras first",
    copy_prompt:"Copy this link:",
    picker_help:"Tick more than one camera. With no specific selection, all cameras are shown.",
    footer1:"Video source: ",footer2:". This site is not affiliated with the Denpasar City Government.",
    tag_on:"LIVE",tag_off:"OFFLINE",tag_buf:"BUFFERING",tag_cari:"CONNECTING",tag_ulang:"REPLAY",
    tag_dijeda:"PAUSED",tag_load:"LOADING",
    zoom:"Enlarge {n}",play:"Play camera",retry:"Retry",retry_aria:"Reload camera {n}",
    fav_add:"Add {n} to favorites",fav_del:"Remove {n} from favorites",
    close:"Close",
    wx_label:"{n} weather",
    wx0:"Clear",wx1:"Partly cloudy",wx3:"Overcast",wx45:"Foggy",wx51:"Drizzle",
    wx61:"Rain",wx80:"Showers",wx95:"Thunderstorm",
    k_title:"Auto mode",k_back:"← Back",k_prev:"Previous",k_next:"Next",
    k_pause:"Pause",k_play:"Resume",k_full:"Fullscreen",k_every:"Switch every",
    k_sec:"{n} s",k_source:"Source",k_src_all:"All cameras",k_src_fav:"Favorites",
    k_src_sel:"Last selection",k_src_link:"From link",k_count:"{i} / {n}",
    k_none:"No cameras in this source.",
    home_title:"Bali Live CCTV",
    home_sub:"Watch public CCTV across all regencies and cities in Bali",
    back_home:"← All regencies",kota:"City",kab:"Regency",
    n_cams:"{n} cameras",home_total:"{n} cameras in {m} regencies/cities",
    auto_title:"Auto mode",
    auto_desc:"Cycle through cameras automatically from the regencies or cities you pick. Tap to select or clear.",
    auto_start:"Start auto mode",all_regions:"All regencies",
    footer2_all:". This site is not affiliated with the Bali Provincial Government or any city/regency government.",
    k_regions:"Regencies",k_all_regions:"All",k_shuffle:"Shuffle",k_on_first:"Online first",k_only_on:"Online only",k_none_online:"No online cameras in this source.",k_hide_ui:"Hide UI",k_settings:"Settings",k_show_ui:"Show UI",k_region_aria:"Choose which regencies to cycle",
    map_title:"Bali CCTV map by regency",map_aria:"Map of Bali by regency",
    map_hint:"Move the cursor over the map, then click a regency to open its CCTV.",
    map_hint_touch:"Tap a regency on the map to see its details.",map_hint_small:"Tap or click a regency on the map to see its details.",
    open_region:"Open {n} CCTV",open_short:"Open",no_cctv:"No public CCTV has been found here yet.",
    mk_aria:"{n}, {c} cameras",mk_aria_none:"{n}, no CCTV yet",
    hero_title:"All of Bali's CCTV, on one screen.",
    hero_sub:"Pick a regency on the map to see which cameras are live.",
    hero_cams:"cameras spread across",hero_regions:"regencies/cities",
    search_home_ph:"Search location, camera",search_home_aria:"Search location or camera",
    s_region:"{k} · {n} cameras",s_none:"No results for “{q}”. Try another keyword.",s_more:"{n} more results not shown. Narrow your search.",
    fav_title:"Favorite cameras",fav_empty:"No favorites yet. Open a regency page and tap ☆ on a camera.",
    fav_limit:"Showing {n} of {m} latest favorites. Manage them all with the ★ Favorites button on a regency page.",
    rec_title:"Recently viewed",rec_empty:"No camera has been opened fullscreen yet.",rec_clear:"Clear history",
    fav_play:"Play all favorites",
    multi_title:"Favorites multi-view",multi_back:"← Home",multi_grid:"Grid",multi_page:"Page {i} / {n}",
    multi_prev:"Previous",multi_next:"Next",multi_pause:"Pause",multi_resume:"Resume",multi_every:"Switch page every",multi_off:"Off",
    multi_empty:"No favorite cameras yet. Tap ☆ on a camera on a regency page, then come back here.",
    multi_count:"{n} favorites",multi_big:"Enlarge {n}",multi_small:"Back to grid",
    kb_player:"← → switch camera · F fullscreen · Esc close",
    kb_auto:"← → switch · Space pause · F fullscreen · H hide UI",
    kb_multi:"← → page · 2 / 3 grid size · Space pause · F fullscreen · Esc back to grid",
    cam_prev:"Previous camera",cam_next:"Next camera",
    wx_now:"Current weather"
  }
};
if(typeof REGION!=="undefined"&&REGION){
  if(REGION.t)for(const l in REGION.t)Object.assign(T[l],REGION.t[l]);
  if(REGION.gf)for(const l in T)T[l].footer2=T[l].footer2_all;
}
let LANG=(()=>{
  const s=LS.get("lang",null);
  if(s==="id"||s==="en")return s;
  return String(navigator.language||"id").toLowerCase().startsWith("id")?"id":"en";
})();
const getLang=()=>LANG;
function setLang(l){LANG=l==="en"?"en":"id";LS.set("lang",LANG)}
function t(key,vars){
  let s=(T[LANG]&&T[LANG][key])??T.id[key]??key;
  if(vars)for(const k in vars)s=s.split("{"+k+"}").join(vars[k]);
  return s;
}
function applyI18n(root){
  root=root||document;
  document.documentElement.lang=LANG;
  root.querySelectorAll("[data-i18n]").forEach(e=>{e.textContent=t(e.dataset.i18n)});
  root.querySelectorAll("[data-i18n-ph]").forEach(e=>{e.placeholder=t(e.dataset.i18nPh)});
  root.querySelectorAll("[data-i18n-aria]").forEach(e=>{e.setAttribute("aria-label",t(e.dataset.i18nAria))});
  root.querySelectorAll("[data-i18n-title]").forEach(e=>{e.title=t(e.dataset.i18nTitle)});
  if(typeof Theme!=="undefined")Theme.paint();
}

function startClock(){
  const cache={};
  const fm=()=>{
    if(!cache[LANG]){
      const loc=LANG==="en"?"en-GB":"id-ID";
      cache[LANG]={
        t:new Intl.DateTimeFormat(loc,{timeZone:CONFIG.timezone,hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false}),
        d:new Intl.DateTimeFormat(loc,{timeZone:CONFIG.timezone,weekday:"long",day:"numeric",month:"long",year:"numeric"})
      };
    }
    return cache[LANG];
  };
  const tick=()=>{
    const f=fm(),n=new Date(),j=$("#jam"),g=$("#tgl");
    if(j)j.textContent=f.t.format(n).replace(/\./g,":")+" WITA";
    if(g)g.textContent=f.d.format(n);
  };
  tick();setInterval(tick,1000);
  return tick;
}

const WX_EXTRA={};
const Weather=(()=>{
  const TTL=9*60*1000,cache={},bad={},busy={},subs=[];
  const pts={};
  if(typeof REGIONS!=="undefined")REGIONS.forEach(r=>{pts[r.id]=r});
  for(const id in WX_EXTRA)pts[id]=Object.assign({id},WX_EXTRA[id]);
  const group=c=>{
    if(c===0)return["0","☀️"];
    if(c===1||c===2)return["1","⛅"];
    if(c===3)return["3","☁️"];
    if(c===45||c===48)return["45","🌫️"];
    if(c>=51&&c<=57)return["51","🌦️"];
    if(c>=61&&c<=67)return["61","🌧️"];
    if(c>=80&&c<=82)return["80","🌧️"];
    if(c>=95)return["95","⛈️"];
    return["3","☁️"];
  };
  const stale=id=>!cache[id]||Date.now()-cache[id].at>TTL;
  async function load(ids){
    const now=Date.now();
    ids=ids.filter(id=>pts[id]&&!busy[id]&&now-(bad[id]||0)>=60000&&stale(id));
    if(!ids.length)return;
    ids.forEach(id=>{busy[id]=1});
    const ctl=new AbortController(),to=setTimeout(()=>ctl.abort(),8000);
    try{
      const url="https://api.open-meteo.com/v1/forecast?latitude="+ids.map(id=>pts[id].lat).join(",")+"&longitude="+ids.map(id=>pts[id].lon).join(",")+"&current=temperature_2m,weather_code,precipitation&timezone=Asia%2FMakassar";
      const res=await fetch(url,{signal:ctl.signal});
      if(!res.ok)throw new Error(res.status);
      const j=await res.json(),arr=Array.isArray(j)?j:[j];
      ids.forEach((id,i)=>{
        const c=arr[i]&&arr[i].current;
        if(c&&typeof c.temperature_2m==="number"){
          cache[id]={temp:Math.round(c.temperature_2m),code:c.weather_code,rain:c.precipitation||0,at:Date.now()};
          delete bad[id];
        }else bad[id]=Date.now();
      });
      subs.forEach(f=>f());
    }catch(e){ids.forEach(id=>{bad[id]=Date.now()})}
    finally{clearTimeout(to);ids.forEach(id=>{busy[id]=0})}
  }
  return{group,load,get:id=>cache[id],stale,on:f=>subs.push(f)};
})();

function startWeather(el,getReg){
  if(!el)return()=>{};
  const cur=()=>(getReg&&getReg())||(typeof REGION!=="undefined"&&REGION)||REGIONS[0];
  const draw=()=>{
    const r=cur(),data=Weather.get(r.id);
    if(!data){el.hidden=true;Weather.load([r.id]);return}
    if(Weather.stale(r.id))Weather.load([r.id]);
    const [k,ic]=Weather.group(data.code);
    el.hidden=false;
    el.title=t("wx_label",{n:r.name});
    el.querySelector(".wx-ic").textContent=ic;
    el.querySelector("b").textContent=data.temp+"°C";
    el.querySelector("small").textContent=t("wx"+k)+(data.rain>0?" · "+data.rain+" mm":"");
  };
  Weather.on(draw);
  Weather.load([cur().id]);
  setInterval(()=>Weather.load([cur().id]),10*60*1000);
  return draw;
}

if("serviceWorker" in navigator&&location.protocol!=="file:"){
  const base=document.currentScript&&document.currentScript.src;
  if(base)addEventListener("load",()=>navigator.serviceWorker.register(new URL("../sw.js",base).href).catch(()=>{}));
}

const Theme=(()=>{
  const root=document.documentElement,mq=matchMedia("(prefers-color-scheme:dark)"),rm=matchMedia("(prefers-reduced-motion:reduce)");
  const saved=()=>{const v=LS.get("theme",null);return v==="dark"||v==="light"?v:null};
  const cur=()=>root.dataset.theme||(mq.matches?"dark":"light");
  const ICON='<span class="ti" aria-hidden="true"><svg viewBox="0 0 24 24"><mask id="tm-m"><rect width="24" height="24" fill="#fff"/><circle class="tm-cut" cx="18" cy="7" r="7" fill="#000"/></mask><circle class="tm-core" cx="12" cy="12" r="5" fill="currentColor" mask="url(#tm-m)"/><g class="tm-rays" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 1.8v2.4M12 19.8v2.4M1.8 12h2.4M19.8 12h2.4M4.8 4.8l1.7 1.7M17.5 17.5l1.7 1.7M4.8 19.2l1.7-1.7M17.5 6.5l1.7-1.7"/></g></svg></span><span class="tl"></span>';
  let btn;
  function paint(){
    if(!btn)return;
    const m=cur();
    btn.dataset.mode=m;
    btn.querySelector(".tl").textContent=t(m==="dark"?"theme_dark":"theme_light");
    const a=t(m==="dark"?"theme_to_light":"theme_to_dark");
    btn.setAttribute("aria-label",a);btn.title=a;
  }
  function set(next){
    const apply=()=>{root.dataset.theme=next;LS.set("theme",next);paint()};
    if(rm.matches){apply();return}
    if(!document.startViewTransition){
      root.classList.add("tm-fade");apply();setTimeout(()=>root.classList.remove("tm-fade"),500);return;
    }
    const r=btn.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
    const R=Math.hypot(Math.max(x,innerWidth-x),Math.max(y,innerHeight-y));
    const vt=document.startViewTransition(apply);
    vt.ready.then(()=>root.animate({clipPath:[`circle(0px at ${x}px ${y}px)`,`circle(${R}px at ${x}px ${y}px)`]},{duration:600,easing:"cubic-bezier(.4,0,.2,1)",pseudoElement:"::view-transition-new(root)"})).catch(()=>{});
  }
  function init(){
    btn=document.getElementById("tema");
    if(!btn)return;
    btn.removeAttribute("data-i18n");
    btn.innerHTML=ICON;
    btn.onclick=()=>set(cur()==="dark"?"light":"dark");
    mq.addEventListener("change",()=>{if(!saved())paint()});
    paint();
  }
  return{init,paint};
})();
Theme.init();
