// Stream "fb" (Bali Satu Data) dinyalakan server saat diminta, sehingga permintaan pertama bisa menggantung lama
// padahal permintaan ulang (tombol refresh) langsung berhasil. Perbaikannya:
// 1) CONNECT_MS: bila belum ada segmen video setelah sekian detik, permintaan dibatalkan dan diulang otomatis (sama seperti refresh).
// 2) connAcquire: paling banyak CONN_MAX kamera yang sedang "menyambung" sekaligus, supaya permintaan menggantung tidak
//    menghabiskan batas koneksi per host di browser (sekitar 6) dan memblokir kamera lain.
const CONNECT_MS=[7e3,8e3,10e3,12e3,15e3],CONN_MAX=4,connQ=[];let connN=0;
function connPump(){while(connN<CONN_MAX&&connQ.length){const k=connQ.shift();k.held=!0,connN++,k.safe=setTimeout(k.release,CONNECT_MS[CONNECT_MS.length-1]+3e3),k.go()}}
function connAcquire(go){const k={go,held:!1,done:!1,safe:null,release(){if(k.done)return;k.done=!0,clearTimeout(k.safe);if(k.held)connN--,connPump();else{const i=connQ.indexOf(k);i>=0&&connQ.splice(i,1)}}};return connQ.push(k),connPump(),k}
const warm=[];function attach(a,t,e){const s=a._h;if(s&&!s.dead){if(s.cam===t)return s.onState=e,s.resume(),s.soft;s.hard()}if(!isMp4(t)&&(!window.Hls||!Hls.isSupported()))return attachOld(a,t,e);const n={cam:t,dead:!1,paused:!1,onState:e,stop:null};return n.stop=(isMp4(t)?attachMp4:t.fb?attachSmart:attachV2)(a,t,a=>n.onState&&n.onState(a)),n.resume=()=>{n.paused=!1;const a=warm.indexOf(n);a>=0&&warm.splice(a,1),n.stop.resume()},n.pause=()=>{if(!n.paused)for(n.paused=!0,n.stop.pause(),warm.push(n);warm.length>24;)warm.shift().hard()},n.hard=()=>{n.dead=!0;const t=warm.indexOf(n);t>=0&&warm.splice(t,1),n.stop(),a._h=null},n.soft=()=>n.pause(),n.soft.hard=n.hard,a._h=n,n.soft}function attachV2(a,t,e){if(!window.Hls||!Hls.isSupported())return attachOld(a,t,e);const s=(a,x)=>e&&e(a,x);let FC=0;const RT=()=>t.fb?Math.min(1500*++FC,8e3):3e4;let tk=null,wt=null,wn=0,PA=0;const rel=()=>{tk&&(tk.release(),tk=null)},clrW=()=>{clearTimeout(wt),wt=null};let n=null,r=!1,A=!1,m=!1,o=0,i=Date.now(),d=!1,u=!1,p=0,c=4;const g=[],l=(a,t)=>g.push(setTimeout(a,t)),T=new AbortController;function S(){if(r)return;if(!t.fb)return S0();n&&(n.destroy(),n=null),rel(),clrW(),s(m?"buf":"cari"),tk=connAcquire(()=>{if(r)return;S0(),wt=setTimeout(()=>{if(r||m)return;wn++,n&&(n.destroy(),n=null),rel(),wn>=3&&s("off",{details:"connectTimeout"}),l(S,wn>=3?RT():300)},CONNECT_MS[Math.min(wn,CONNECT_MS.length-1)])})}function S0(){if(r)return;n&&(n.destroy(),n=null),s(m?"buf":"cari");const e=n=new Hls({lowLatencyMode:!1,liveSyncDurationCount:4,liveMaxLatencyDurationCount:10,startLevel:0,capLevelToPlayerSize:!0,startFragPrefetch:!0,fragLoadingTimeOut:15e3,maxLiveSyncPlaybackRate:1.15,backBufferLength:30,maxBufferLength:20,maxMaxBufferLength:30,maxBufferHole:1.5,nudgeMaxRetry:10,manifestLoadingMaxRetry:t.fb?2:1,manifestLoadingRetryDelay:t.fb?1e3:500,manifestLoadingTimeOut:t.fb?2e4:1e4,levelLoadingMaxRetry:4,fragLoadingMaxRetry:6,fragLoadingRetryDelay:700});e.loadSource(t.url),e.attachMedia(a),e.on(Hls.Events.MANIFEST_PARSED,()=>a.play().catch(()=>{})),e.on(Hls.Events.LEVEL_LOADED,(a,t)=>{t&&t.details&&t.details.targetduration&&(c=t.details.targetduration)}),e.on(Hls.Events.FRAG_LOADED,()=>{i=Date.now(),d=!1,m=!0,o=0,wn=0,rel(),clrW(),u||s("on")}),e.on(Hls.Events.ERROR,(a,t)=>{if(t.fatal&&e===n)if(m&&t.type===Hls.ErrorTypes.MEDIA_ERROR)e.recoverMediaError();else{if(m)return o++,void(t.type===Hls.ErrorTypes.NETWORK_ERROR&&o<5?l(()=>{try{e.startLoad(-1)}catch(a){}},Math.min(1500*o,8e3)):l(S,Math.min(2e3*o,15e3)));clrW(),rel(),s("off",t),l(S,RT())}})}const N=setInterval(()=>{if(r||A||!m||!n||document.hidden||a.seeking||a.paused)return;const t=a.buffered,e=a.currentTime;let o=-1,i=-1;for(let a=0;a<t.length;a++)if(e>=t.start(a)-.3&&e<=t.end(a)+.3){o=t.start(a),i=t.end(a);break}if(i<0)return;const d=i-e;u?i>p+1?(u=!1,s("on")):d<.35&&i-o>1&&(a.currentTime=Math.max(o,i-3)):d<.35&&i-o>1?(u=!0,p=i,s("ulang"),a.currentTime=Math.max(o,i-3)):n.liveSyncPosition&&n.liveSyncPosition-e>40&&(a.currentTime=n.liveSyncPosition)},200),U=setInterval(()=>{if(r||A||!m||!n)return;if(document.hidden)return void(i=Date.now());const a=Date.now()-i;if(a>Math.max(3e4,8e3*c))i=Date.now(),d=!1,s(u?"ulang":"buf"),S();else if(a>Math.max(12e3,3e3*c)&&!d){d=!0;try{n.startLoad(-1)}catch(a){}}},2e3),P=()=>{},h=()=>{m&&!u&&s("on")};a.addEventListener("waiting",P),a.addEventListener("playing",h),S();const R=()=>{r=!0,clrW(),rel(),T.abort(),clearInterval(U),clearInterval(N),g.forEach(clearTimeout),a.removeEventListener("waiting",P),a.removeEventListener("playing",h),n&&(n.destroy(),n=null)};return R.pause=()=>{PA=Date.now(),A=!0,n&&n.stopLoad(),a.pause()},R.resume=()=>{const st=PA&&Date.now()-PA>4e3;if(PA=0,A=!1,i=Date.now(),d=!1,u=!1,n&&!st){n.startLoad(-1);const t=n.liveSyncPosition;t&&(a.currentTime=t)}else if(st)S();a.play().catch(()=>{})},R}function attachOld(a,t,e){const s=a=>e&&e(a);if(window.Hls&&Hls.isSupported()){const e=new Hls({lowLatencyMode:!0,liveSyncDurationCount:2,maxBufferLength:8,manifestLoadingMaxRetry:2});return e.loadSource(t.url),e.attachMedia(a),e.on(Hls.Events.MANIFEST_PARSED,()=>a.play().catch(()=>{})),e.on(Hls.Events.FRAG_LOADED,()=>s("on")),e.on(Hls.Events.ERROR,(a,t)=>{t.fatal&&(s("off"),t.type===Hls.ErrorTypes.NETWORK_ERROR?setTimeout(()=>{try{e.startLoad()}catch(a){}},8e3):e.destroy())}),()=>e.destroy()}return a.canPlayType("application/vnd.apple.mpegurl")?(a.src=t.url,a.addEventListener("playing",()=>s("on")),a.addEventListener("error",()=>s("off")),a.play().catch(()=>{}),()=>{a.removeAttribute("src"),a.load()}):(s("off"),()=>{})}

function isMp4(t){return/\.mp4(?:$|[?#])/i.test(t.url)}
function attachMp4(a,t,e){
  const s=x=>e&&e(x);
  let dead=false,hold=false,ok=false,tm=null,last=-1,lastAt=Date.now();
  const clr=()=>{clearTimeout(tm);tm=null};
  const drop=()=>{try{a.pause()}catch(x){}a.removeAttribute("src");a.load()};
  const retry=ms=>{clr();tm=setTimeout(go,ms)};
  function go(){
    if(dead||hold)return;
    clr();ok=false;last=-1;lastAt=Date.now();
    s("cari");
    a.src=t.url;
    a.play().catch(()=>{});
    tm=setTimeout(()=>{if(!dead&&!hold&&!ok){s("off");drop();retry(3e4)}},25e3);
  }
  const onPlaying=()=>{if(dead||hold)return;ok=true;clr();s("on")};
  const onError=()=>{if(dead||hold||!a.getAttribute("src"))return;ok=false;s("off");drop();retry(3e4)};
  const onEnded=()=>{if(dead||hold)return;ok=false;s("buf");drop();retry(2e3)};
  a.addEventListener("playing",onPlaying);
  a.addEventListener("error",onError);
  a.addEventListener("ended",onEnded);
  const wd=setInterval(()=>{
    if(dead||hold||!ok||document.hidden)return;
    if(a.currentTime!==last){last=a.currentTime;lastAt=Date.now()}
    else if(Date.now()-lastAt>2e4){ok=false;s("buf");drop();go()}
  },5e3);
  const R=()=>{dead=true;clr();clearInterval(wd);a.removeEventListener("playing",onPlaying);a.removeEventListener("error",onError);a.removeEventListener("ended",onEnded);drop()};
  R.pause=()=>{hold=true;clr();drop()};
  R.resume=()=>{hold=false;go()};
  go();
  return R;
}

// Rantai cadangan untuk kamera bertanda fb (server tanpa CORS / stream yang baru dinyalakan saat diminta).
// Langkah: 1) hls.js  2) pemutar HLS bawaan browser (Safari/iOS)  3) proxy (PROXY di cameras.js, opsional).
// - Pindah langkah hanya bila gagalnya tampak seperti CORS/jaringan (kode respons 0). Galat HTTP (404/5xx)
//   atau timeout dianggap stream belum siap: coba lagi di langkah yang sama.
// - Dua kegagalan pertama tidak ditampilkan sebagai OFFLINE (tetap "MENCARI"); pada kegagalan ketiga baru OFFLINE.
// - Langkah yang berhasil diingat per server (juga di localStorage) agar pembukaan berikutnya langsung memakainya.
const stepMem={};
function attachSmart(a,t,e){
  let host="";try{host=new URL(t.url).host}catch(x){}
  const mk="step."+host;
  const steps=[["hls",attachV2]];
  if(a.canPlayType&&a.canPlayType("application/vnd.apple.mpegurl"))steps.push(["native",attachMp4]);
  if(typeof PROXY!=="undefined"&&PROXY)steps.push(["proxy",(el,c,cb)=>attachV2(el,Object.assign({},c,{url:PROXY.replace(/\/$/,"")+"/"+c.url.replace(/^https?:\/\//,"")}),cb)]);
  const saved=stepMem[host]||LS.get(mk,null);
  let i=Math.max(0,steps.findIndex(s=>s[0]===saved)),tok=0,dead=false,ok=false,cur=null,held=false,fails=0;
  function start(){
    const my=++tok,name=steps[i][0];
    cur=steps[i][1](a,t,(st,x)=>{
      if(my!==tok||dead)return;
      if(st==="on"){
        ok=true;fails=0;
        if(stepMem[host]!==name){stepMem[host]=name;LS.set(mk,name)}
      }else if(st==="off"&&!ok){
        const net=!x||(x.details==="manifestLoadError"&&!(x.response&&x.response.code));
        if(net&&i<steps.length-1){
          tok++;i++;
          setTimeout(()=>{if(dead)return;const old=cur;if(old)old();start();if(held&&cur.pause)cur.pause()},0);
          return;
        }
        if(++fails<3)return;
      }
      e&&e(st);
    });
  }
  start();
  const R=()=>{dead=true;tok++;if(cur)cur()};
  R.pause=()=>{held=true;cur&&cur.pause&&cur.pause()};
  R.resume=()=>{held=false;cur&&cur.resume&&cur.resume()};
  return R;
}
