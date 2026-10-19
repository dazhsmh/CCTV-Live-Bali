const ALLOW=["transcode.baliprov.go.id","mitradarat-vidstream.kemenhub.go.id","stream.punggul.desa.id"];
const HOSTH={"stream.punggul.desa.id":{Origin:"https://cctv.punggul.desa.id",Referer:"https://cctv.punggul.desa.id/"}};
const ck=r=>(r.headers.getSetCookie?r.headers.getSetCookie():[r.headers.get("set-cookie")||""]).map(c=>c.split(";")[0]).filter(Boolean).join("; ");
const cors=()=>({"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"Range","Access-Control-Expose-Headers":"Content-Length,Content-Range"});

export default{
  async fetch(req){
    if(req.method==="OPTIONS")return new Response(null,{headers:cors()});
    const u=new URL(req.url),m=u.pathname.match(/^\/([^/]+)(\/.*)$/);
    if(!m||!ALLOW.includes(m[1]))return new Response("forbidden",{status:403,headers:cors()});
    const [,host,path]=m,self=u.origin;
    const q=x=>u.search&&!x.includes("?")?x+u.search:x;
    const hd=Object.assign({},HOSTH[host]);
    if(req.headers.get("Range"))hd.Range=req.headers.get("Range");
    const target="https://"+host+path;
    let up;
    if(HOSTH[host]&&/\/index\.m3u8$/i.test(path)&&!u.search){
      const r1=await fetch(target,{headers:hd,redirect:"manual"});
      const t1=r1.status<300?await r1.text():"";
      if(/^#EXTM3U/.test(t1))up=new Response(t1,{status:200,headers:{"Content-Type":"application/vnd.apple.mpegurl"}});
      else{const c=ck(r1);up=await fetch(target+"?cookieCheck=1",{headers:Object.assign({},hd,c?{Cookie:c}:{})})}
    }else up=await fetch(target+u.search,{headers:hd});
    const h=new Headers(cors());
    const ct=up.headers.get("Content-Type");if(ct)h.set("Content-Type",ct);
    if(/\.m3u8$/i.test(path)||/mpegurl/i.test(ct||"")){
      const fix=p=>{
        if(/^https?:\/\//i.test(p)){const x=new URL(p);return ALLOW.includes(x.host)?self+"/"+x.host+x.pathname+x.search:p}
        return p.startsWith("/")?self+"/"+host+q(p):q(p);
      };
      const txt=(await up.text()).split("\n").map(l=>{
        const s=l.trim();
        if(!s)return l;
        return s.startsWith("#")?l.replace(/URI="([^"]+)"/g,(_,p)=>'URI="'+fix(p)+'"'):fix(s);
      }).join("\n");
      h.set("Cache-Control","no-store");
      return new Response(txt,{status:up.status,headers:h});
    }
    h.set("Cache-Control","public, max-age=30");
    return new Response(up.body,{status:up.status,headers:h});
  }
};