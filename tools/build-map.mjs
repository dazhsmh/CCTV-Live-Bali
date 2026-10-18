// Pakai:  node tools/build-map.mjs bali.geojson [toleransi=0.25] [lebar=900] [luasMin=1.5]
// Toleransi kecil = bentuk lebih detail (file lebih besar). Coba 0.15 - 0.4.
import fs from "node:fs";
const [,, file, tolArg, wArg, minArg] = process.argv;
if (!file) { console.error("Pakai: node tools/build-map.mjs bali.geojson [toleransi] [lebar]"); process.exit(1); }
const TOL = tolArg === undefined ? 0.25 : +tolArg, W = +wArg || 900, PAD = 20, MIN_AREA = minArg === undefined ? 1.5 : +minArg;
const gj = JSON.parse(fs.readFileSync(file, "utf8"));
const IDS = ["badung","bangli","buleleng","denpasar","gianyar","jembrana","karangasem","klungkung","tabanan"];
const idOf = p => {
  const txt = Object.values(p || {}).filter(v => typeof v === "string").join(" ").toLowerCase();
  return IDS.find(i => txt.includes(i));
};
const feats = gj.features.map(f => ({ id: idOf(f.properties), g: f.geometry })).filter(f => f.id);
const polys = f => f.g.type === "Polygon" ? [f.g.coordinates] : f.g.coordinates;
let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
feats.forEach(f => polys(f).forEach(p => p[0].forEach(([x, y]) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); })));
const k = Math.cos(((y0 + y1) / 2) * Math.PI / 180), S = (W - 2 * PAD) / ((x1 - x0) * k);
const proj = ([x, y]) => [PAD + (x - x0) * k * S, PAD + (y1 - y) * S];
const area = r => Math.abs(r.reduce((s, p, i) => { const q = r[(i + 1) % r.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;
function dp(pts, e) {
  if (pts.length < 3) return pts;
  const [a, b] = [pts[0], pts.at(-1)]; let m = 0, idx = 0;
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1e-9;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + b[0] * a[1] - b[1] * a[0]) / L;
    if (d > m) { m = d; idx = i; }
  }
  if (m <= e) return [a, b];
  return [...dp(pts.slice(0, idx + 1), e).slice(0, -1), ...dp(pts.slice(idx), e)];
}
// Ring tertutup (awal = akhir) dipecah di titik terjauh dulu, kalau tidak Douglas-Peucker runtuh jadi satu titik
function simplifyRing(r, e) {
  let pts = r.slice();
  if (pts.length > 1 && pts[0][0] === pts.at(-1)[0] && pts[0][1] === pts.at(-1)[1]) pts.pop();
  if (!TOL || pts.length < 8) return pts;
  let far = 0, m = -1;
  pts.forEach((p, i) => { const d = Math.hypot(p[0] - pts[0][0], p[1] - pts[0][1]); if (d > m) { m = d; far = i; } });
  const A = dp(pts.slice(0, far + 1), e), B = dp([...pts.slice(far), pts[0]], e);
  return [...A.slice(0, -1), ...B.slice(0, -1)];
}
const regions = {}; let maxY = 0;
for (const f of feats) {
  let d = "", best = null;
  for (const poly of polys(f)) {
    const ring = poly[0].map(proj);
    if (area(ring) < MIN_AREA) continue;
    if (!best || area(ring) > area(best)) best = ring;
    const s = simplifyRing(ring, TOL);
    d += "M" + s.map(p => p[0].toFixed(1) + " " + p[1].toFixed(1)).join("L") + "Z";
    s.forEach(p => maxY = Math.max(maxY, p[1]));
  }
  let A = 0, cx = 0, cy = 0;
  best.forEach((p, i) => { const q = best[(i + 1) % best.length], c = p[0] * q[1] - q[0] * p[1]; A += c; cx += (p[0] + q[0]) * c; cy += (p[1] + q[1]) * c; });
  regions[f.id] = { d, cx: +(cx / (3 * A)).toFixed(1), cy: +(cy / (3 * A)).toFixed(1) };
}
const vb = [0, 0, W, Math.ceil(maxY + PAD)];
const out = "// Dibuat oleh tools/build-map.mjs dari GeoJSON batas kabupaten/kota.\nconst BALI_MAP=" + JSON.stringify({ regions, vb }) + ";\n";
fs.writeFileSync("assets/bali-map.js", out);
console.log(Object.keys(regions).join(", "), "|", (out.length / 1024).toFixed(1) + " KB");
