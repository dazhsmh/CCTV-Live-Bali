const CONFIG={timezone:"Asia/Makassar",maxLive:9};
const $=s=>document.querySelector(s);

const LS={
  get(k,d){try{const v=localStorage.getItem("cctv."+k);return v===null?d:JSON.parse(v)}catch(e){return d}},
  set(k,v){try{localStorage.setItem("cctv."+k,JSON.stringify(v))}catch(e){}}
};

const T={
  id:{
    title:"CCTV Live Denpasar",
    subtitle:"Pantauan lalu lintas ATCS Kota Denpasar",
    search_ph:"Cari nama jalan atau simpang",search_aria:"Cari lokasi",
    pick:"Pilih beberapa kamera",theme:"Ganti tema",reload:"Muat ulang semua",
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
    wx_label:"Cuaca Denpasar",
    wx0:"Cerah",wx1:"Cerah berawan",wx3:"Berawan",wx45:"Berkabut",wx51:"Gerimis",
    wx61:"Hujan",wx80:"Hujan sesaat",wx95:"Badai petir",
    k_title:"Auto mode",k_back:"← Kembali",k_prev:"Sebelumnya",k_next:"Berikutnya",
    k_pause:"Jeda",k_play:"Lanjut",k_full:"Layar penuh",k_every:"Ganti tiap",
    k_sec:"{n} dtk",k_source:"Sumber",k_src_all:"Semua kamera",k_src_fav:"Favorit",
    k_src_sel:"Pilihan terakhir",k_src_link:"Dari link",k_count:"{i} / {n}",
    k_none:"Tidak ada kamera pada sumber ini."
  },
  en:{
    title:"Denpasar Live CCTV",
    subtitle:"Denpasar City ATCS live traffic view",
    search_ph:"Search street or intersection",search_aria:"Search location",
    pick:"Select cameras",theme:"Toggle theme",reload:"Reload all",
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
    wx_label:"Denpasar weather",
    wx0:"Clear",wx1:"Partly cloudy",wx3:"Overcast",wx45:"Foggy",wx51:"Drizzle",
    wx61:"Rain",wx80:"Showers",wx95:"Thunderstorm",
    k_title:"Auto mode",k_back:"← Back",k_prev:"Previous",k_next:"Next",
    k_pause:"Pause",k_play:"Resume",k_full:"Fullscreen",k_every:"Switch every",
    k_sec:"{n} s",k_source:"Source",k_src_all:"All cameras",k_src_fav:"Favorites",
    k_src_sel:"Last selection",k_src_link:"From link",k_count:"{i} / {n}",
    k_none:"No cameras in this source."
  }
};
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

function startWeather(el){
  if(!el)return()=>{};
  let data=null;
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
  const draw=()=>{
    if(!data)return;
    const [k,ic]=group(data.code);
    el.hidden=false;
    el.title=t("wx_label");
    el.querySelector(".wx-ic").textContent=ic;
    el.querySelector("b").textContent=data.temp+"°C";
    el.querySelector("small").textContent=t("wx"+k)+(data.rain>0?" · "+data.rain+" mm":"");
  };
  const load=async()=>{
    const ctl=new AbortController(),to=setTimeout(()=>ctl.abort(),8000);
    try{
      const r=await fetch("https://api.open-meteo.com/v1/forecast?latitude=-8.65&longitude=115.2167&current=temperature_2m,weather_code,precipitation&timezone=Asia%2FMakassar",{signal:ctl.signal});
      if(!r.ok)throw new Error(r.status);
      const c=(await r.json()).current;
      if(!c||typeof c.temperature_2m!=="number")throw new Error("data");
      data={temp:Math.round(c.temperature_2m),code:c.weather_code,rain:c.precipitation||0};
      draw();
    }catch(e){}
    finally{clearTimeout(to)}
  };
  load();setInterval(load,10*60*1000);
  return draw;
}
