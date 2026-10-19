const VERSION="v15";
const CACHE="cctv-bali-"+VERSION;
const SHELL=["./","manifest.json","icons/icon-192.png","icons/icon-512.png","assets/style.css","assets/home.css","assets/auto.css","assets/multi.css"];

self.addEventListener("install",e=>{
  e.waitUntil(caches.open(CACHE).then(c=>Promise.allSettled(SHELL.map(u=>c.add(u)))).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith("cctv-bali-")&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=="GET"||u.origin!==location.origin||r.headers.has("range"))return;
  if(/\.(m3u8|ts|m4s|mp4)$/i.test(u.pathname))return;
  if(r.mode==="navigate"){
    e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp));return res}).catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||caches.match("./"))));
    return;
  }
  e.respondWith(caches.open(CACHE).then(c=>c.match(r).then(hit=>{
    const net=fetch(r).then(res=>{if(res.ok)c.put(r,res.clone());return res}).catch(()=>hit);
    return hit||net;
  })));
});
