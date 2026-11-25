/* ============================================================ core: math, colour, camera, svg builder */
const PI = Math.PI, TAU = PI * 2;
const { sin, cos, abs, sqrt, floor, pow, exp, atan2, hypot, round, sign, tan, ceil } = Math;
const mn = Math.min, mx = Math.max;
const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, t) => a + (b - a) * t;
const inv = (a, b, x) => clamp((x - a) / (b - a));
const ss = (a, b, x) => { const t = inv(a, b, x); return t * t * (3 - 2 * t); };
const E = {
  outCubic: x => 1 - pow(1 - clamp(x), 3),
  inCubic: x => pow(clamp(x), 3),
  inOut: x => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - pow(-2 * x + 2, 3) / 2; },
  outExpo: x => (x >= 1 ? 1 : 1 - pow(2, -10 * clamp(x))),
  outBack: x => { x = clamp(x); const c = 1.9; return 1 + (c + 1) * pow(x - 1, 3) + c * pow(x - 1, 2); },
  outElastic: x => { x = clamp(x); return x === 0 ? 0 : x === 1 ? 1 : pow(2, -9 * x) * sin((x * 8 - .75) * (TAU / 3)) + 1; },
  outBounce: x => { x = clamp(x); const n = 7.5625, d = 2.75; if (x < 1 / d) return n * x * x; if (x < 2 / d) return n * (x -= 1.5 / d) * x + .75; if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + .9375; return n * (x -= 2.625 / d) * x + .984375; },
};
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function hash(i, s = 0) { let h = Math.imul(i | 0, 374761393) + Math.imul(s | 0, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function noise1(x, s = 0) { const i = floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i, s), hash(i + 1, s), u) * 2 - 1; }
/* vec3 */
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const mad = (a, b, s) => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = a => sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
const norm = a => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const dist = (a, b) => len(sub(a, b));
function rotAxis(v, k, a) { const c = cos(a), s = sin(a), d = dot(k, v) * (1 - c), x = cross(k, v); return [v[0] * c + x[0] * s + k[0] * d, v[1] * c + x[1] * s + k[1] * d, v[2] * c + x[2] * s + k[2] * d]; }
/* Catmull-Rom on arrays of n-vectors */
function crv(arr, u) {
  const n = arr.length - 1; u = clamp(u, 0, n); const i = mn(floor(u), n - 1); const f = u - i;
  const a = arr[mx(i - 1, 0)], b = arr[i], c = arr[i + 1], d = arr[mn(i + 2, n)], o = [];
  const f2 = f * f, f3 = f2 * f;
  for (let k = 0; k < b.length; k++) o.push(.5 * (2 * b[k] + (c[k] - a[k]) * f + (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * f2 + (3 * b[k] - a[k] - 3 * c[k] + d[k]) * f3));
  return o;
}
/* piecewise tables: [[x,y],...] linear / smooth */
function tab(t, x) { if (x <= t[0][0]) return t[0][1]; for (let i = 1; i < t.length; i++) if (x <= t[i][0]) return lerp(t[i - 1][1], t[i][1], (x - t[i - 1][0]) / (t[i][0] - t[i - 1][0])); return t[t.length - 1][1]; }
function tabS(t, x) { if (x <= t[0][0]) return t[0][1]; for (let i = 1; i < t.length; i++) if (x <= t[i][0]) { const f = (x - t[i - 1][0]) / (t[i][0] - t[i - 1][0]); return lerp(t[i - 1][1], t[i][1], f * f * (3 - 2 * f)); } return t[t.length - 1][1]; }
/* two-bone IK */
function ik2(A, B, l1, l2, pole) {
  const d = sub(B, A); let L = len(d); L = clamp(L, abs(l1 - l2) + 1e-4, l1 + l2 - 1e-4); const n = norm(d);
  const x = (l1 * l1 - l2 * l2 + L * L) / (2 * L), h = sqrt(mx(0, l1 * l1 - x * x));
  let p = sub(pole, mul(n, dot(pole, n))); p = norm(p);
  return add(add(A, mul(n, x)), mul(p, h));
}
/* ---------- colour: linear light maths, soft shoulder, sRGB out */
const S2L = new Float32Array(256); for (let i = 0; i < 256; i++) { const c = i / 255; S2L[i] = c <= .04045 ? c / 12.92 : pow((c + .055) / 1.055, 2.4); }
const L2S = new Uint8Array(4097); for (let i = 0; i <= 4096; i++) { const c = i / 4096; L2S[i] = round(255 * (c <= .0031308 ? c * 12.92 : 1.055 * pow(c, 1 / 2.4) - .055)); }
const HX = []; for (let i = 0; i < 256; i++) HX.push((i < 16 ? '0' : '') + i.toString(16));
const CCACHE = new Map();
const C = h => { let c = CCACHE.get(h); if (!c) { const n = parseInt(h.slice(1), 16); c = [S2L[n >> 16], S2L[(n >> 8) & 255], S2L[n & 255]]; CCACHE.set(h, c); } return c; };
const shoulder = x => (x < .62 ? (x < 0 ? 0 : x) : .62 + .38 * (1 - exp(-(x - .62) / .38)));
const enc = x => L2S[(shoulder(x) * 4096) | 0];
const hex = c => '#' + HX[enc(c[0])] + HX[enc(c[1])] + HX[enc(c[2])];
const hexQ = c => '#' + HX[enc(c[0]) & 0xfc] + HX[enc(c[1]) & 0xfc] + HX[enc(c[2]) & 0xfc];
const hexQ8 = c => '#' + HX[enc(c[0]) & 0xf8] + HX[enc(c[1]) & 0xf8] + HX[enc(c[2]) & 0xf8];
const cmul = (a, b) => [a[0] * b[0], a[1] * b[1], a[2] * b[2]];
const mixC = (a, b, t) => hex(mix3(typeof a === 'string' ? C(a) : a, typeof b === 'string' ? C(b) : b, clamp(t)));
/* ---------- light rig (global, set per shot) */
const LIGHT = { key: [0, 1, 0], keyC: [1, 1, 1], sky: [.2, .22, .26], gnd: [.1, .1, .11], rim: [0, 0, -1], rimC: [.3, .4, .5], pts: [], exp: 1 };
function setLight(o) { Object.assign(LIGHT, { key: [-.3, .9, .75], keyC: [.98, .94, .87], sky: [.3, .33, .39], gnd: [.2, .19, .21], rim: [.35, .25, -1], rimC: [.42, .55, .7], pts: [], exp: 1 }, o); LIGHT.key = norm(LIGHT.key); LIGHT.rim = norm(LIGHT.rim); }
/* base: linear rgb; N: unit normal; Vd: unit vector towards the eye */
let SMODE = null;                                  // optional replacement shader (x-ray, finite elements)
function shade(base, N, Vd, P, spec = 0, gloss = 24, sss = 0, ao = 1) {
  if (SMODE) return SMODE(base, N, Vd, P);
  const kd = dot(N, LIGHT.key), wrap = clamp((kd + .35 + sss) / (1.35 + sss)), hemi = N[1] * .5 + .5;
  const nv = Vd ? clamp(dot(N, Vd)) : .7, fres = pow(1 - nv, 3), rl = clamp(dot(N, LIGHT.rim) + .25) * (fres * 1.5 + .08);
  let sp = 0; if (spec && Vd) { const h = norm(add(LIGHT.key, Vd)); sp = spec * pow(clamp(dot(N, h)), gloss); }
  const o = [0, 0, 0];
  for (let i = 0; i < 3; i++) o[i] = base[i] * (LIGHT.keyC[i] * wrap * sqrt(wrap) * ao + lerp(LIGHT.gnd[i], LIGHT.sky[i], hemi) * ao) + LIGHT.rimC[i] * rl * (.25 + base[i] * .75) + sp * LIGHT.keyC[i];
  for (const L of LIGHT.pts) { const d = sub(L.p, P || [0, 0, 0]), l2 = dot(d, d) + .02, w = clamp(dot(N, d) / sqrt(l2) * .75 + .25) * L.i / l2; for (let i = 0; i < 3; i++) o[i] += base[i] * L.c[i] * w; }
  const e = LIGHT.exp; o[0] *= e; o[1] *= e; o[2] *= e; return o;
}
/* ---------- camera */
const NEAR = .06;
function Cam(o) {
  const pos = o.pos, fov = o.fov || 35, w = o.w || 1920, h = o.h || 1080, cx = o.cx ?? w / 2, cy = o.cy ?? h / 2;
  const f = norm(sub(o.target, pos)); let r = norm(cross(f, o.up || [0, 1, 0])); let u = cross(r, f);
  if (o.roll) { const c = cos(o.roll), s = sin(o.roll), r2 = add(mul(r, c), mul(u, s)), u2 = sub(mul(u, c), mul(r, s)); r = r2; u = u2; }
  const k = (h / 2) / tan(fov * PI / 360), ortho = o.ortho || 0;
  const cam = { pos, f, r, u, k, w, h, cx, cy, ortho };
  if (ortho) { const s = h / ortho; cam.p = P => { const x = P[0] - pos[0], y = P[1] - pos[1], z = P[2] - pos[2]; return [cx + (x * r[0] + y * r[1] + z * r[2]) * s, cy - (x * u[0] + y * u[1] + z * u[2]) * s, x * f[0] + y * f[1] + z * f[2], s]; }; cam.vd = () => mul(f, -1); }
  else { cam.p = P => { const x = P[0] - pos[0], y = P[1] - pos[1], z = P[2] - pos[2]; const d = x * f[0] + y * f[1] + z * f[2]; const dd = d < NEAR ? NEAR : d, s = k / dd; return [cx + (x * r[0] + y * r[1] + z * r[2]) * s, cy - (x * u[0] + y * u[1] + z * u[2]) * s, d, s]; }; cam.vd = P => norm(sub(pos, P)); }
  cam.depth = P => (P[0] - pos[0]) * f[0] + (P[1] - pos[1]) * f[1] + (P[2] - pos[2]) * f[2];
  return cam;
}
/* ---------- svg helpers */
const n1 = x => round(x * 10) / 10, n2 = x => round(x * 100) / 100, n3 = x => round(x * 1000) / 1000;
const xy = p => n1(p[0]) + ',' + n1(p[1]);
const FR = { defs: [], seen: new Map(), id: 0 };
function frReset() { FR.defs = []; FR.seen = new Map(); FR.id = 0; }
const stopsS = stops => stops.map(s => `<stop offset="${s[0]}" stop-color="${s[1]}"${s[2] != null ? ` stop-opacity="${s[2]}"` : ''}/>`).join('');
function linG(x1, y1, x2, y2, stops, units) {
  const key = 'L' + x1 + '_' + y1 + '_' + x2 + '_' + y2 + '_' + stops.join('|') + (units || ''); let id = FR.seen.get(key);
  if (!id) { id = 'g' + FR.id++; FR.seen.set(key, id); FR.defs.push(`<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"${units ? ' gradientUnits="userSpaceOnUse"' : ''}>${stopsS(stops)}</linearGradient>`); }
  return `url(#${id})`;
}
function radG(stops, extra = '') {
  const key = 'R' + extra + stops.join('|'); let id = FR.seen.get(key);
  if (!id) { id = 'g' + FR.id++; FR.seen.set(key, id); FR.defs.push(`<radialGradient id="${id}" ${extra}>${stopsS(stops)}</radialGradient>`); }
  return `url(#${id})`;
}
function defOnce(key, make) { let id = FR.seen.get(key); if (!id) { id = 'g' + FR.id++; FR.seen.set(key, id); FR.defs.push(make(id)); } return id; }
function clipRect(x, y, w, h, r = 0) { const id = defOnce(`cr${x},${y},${w},${h},${r}`, i => `<clipPath id="${i}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/></clipPath>`); return `clip-path="url(#${id})"`; }
let LIVE = false;                                  // interactive preview: skip the expensive filters
function blurF(sx, sy = sx) { if (LIVE) return ''; sx = n2(sx); sy = n2(sy); const id = defOnce(`bl${sx},${sy}`, i => `<filter id="${i}" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="${sx} ${sy}"/></filter>`); return `filter="url(#${id})"`; }
function blurFull(sx, sy = sx) { if (LIVE) return ''; sx = n2(sx); sy = n2(sy); const id = defOnce(`bf${sx},${sy}`, i => `<filter id="${i}" filterUnits="userSpaceOnUse" x="-60" y="-60" width="2040" height="1200" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="${sx} ${sy}"/></filter>`); return `filter="url(#${id})"`; }
/* near-plane clipped polygon */
function clipPoly(cam, pts) {
  if (cam.ortho) return pts.map(cam.p);
  const o = [], n = pts.length, N = NEAR * 1.5;
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n], da = cam.depth(a), db = cam.depth(b);
    if (da >= N) o.push(cam.p(a));
    if ((da >= N) !== (db >= N)) o.push(cam.p(mix3(a, b, (N - da) / (db - da))));
  }
  return o.length > 2 ? o : null;
}
function clip2(q) { /* Sutherland-Hodgman against a generous screen rect */
  for (const [ax, sg, lim] of [[0, 1, -2400], [0, -1, 4400], [1, 1, -2400], [1, -1, 3500]]) {
    const o = [], n = q.length, f = p => (p[ax] - lim) * sg; for (let i = 0; i < n; i++) { const a = q[i], b = q[(i + 1) % n], fa = f(a), fb = f(b); if (fa >= 0) o.push(a); if ((fa >= 0) !== (fb >= 0)) { const t = fa / (fa - fb); o.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t)]); } } q = o; if (!q.length) break;
  } return q;
}
function polyD(cam, pts) {
  const q = clipPoly(cam, pts); if (!q) return '';
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const p of q) { if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; }
  if (x1 < cam.cx - cam.w * .6 || x0 > cam.cx + cam.w * .6 || y1 < cam.cy - cam.h * .62 || y0 > cam.cy + cam.h * .62) return '';
  const c = (x0 < -2500 || x1 > 4500 || y0 < -2500 || y1 > 3600) ? clip2(q) : q; return c.length > 2 ? 'M' + c.map(xy).join('L') + 'Z' : '';
}
function poly(cam, pts, fill, extra = '') { const d = polyD(cam, pts); return d ? `<path d="${d}" fill="${fill}" ${extra}/>` : ''; }
function line3(cam, a, b, col, wM, extra = '', wMin = .4) {
  const N = NEAR * 1.5; const da = cam.depth(a), db = cam.depth(b);
  if (!cam.ortho) { if (da < N && db < N) return ''; if (da < N) { a = mix3(a, b, (N - da) / (db - da)); } else if (db < N) { b = mix3(b, a, (N - db) / (da - db)); } }
  const p = cam.p(a), q = cam.p(b); if ((p[0] < -300 && q[0] < -300) || (p[0] > 2300 && q[0] > 2300)) return '';
  const w = mx(wMin, wM * mn(p[3], q[3] * 3, 4000)) * .5 + mx(wMin, wM * mn(q[3], p[3] * 3, 4000)) * .5;
  return `<path d="M${n1(p[0])},${n1(p[1])}L${n1(q[0])},${n1(q[1])}" stroke="${col}" stroke-width="${n2(w)}" fill="none" ${extra}/>`;
}
function pline(cam, pts, col, wM, extra = '', wMin = .4) {
  let d = '', s = 0, c = 0; for (const P of pts) { const q = cam.p(P); if (q[2] < NEAR * 2 && !cam.ortho) { if (d) break; continue; } d += (d ? 'L' : 'M') + xy(q); s += q[3]; c++; }
  return c > 1 ? `<path d="${d}" fill="none" stroke="${col}" stroke-width="${n2(mx(wMin, wM * s / c))}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>` : '';
}
/* text painted on an arbitrary 3D plane (affine approx): origin, right & up vectors in metres per em */
function text3(cam, O, R, U, str, fill, extra = '') {
  const o = cam.p(O); if (o[2] < .3 && !cam.ortho) return ''; const a = cam.p(add(O, R)), b = cam.p(add(O, U)); if (a[2] < .2 && !cam.ortho) return '';
  if (o[0] < -2500 || o[0] > 4500) return '';
  return `<text transform="matrix(${n3((a[0] - o[0]) / 100)} ${n3((a[1] - o[1]) / 100)} ${n3((o[0] - b[0]) / 100)} ${n3((o[1] - b[1]) / 100)} ${n1(o[0])} ${n1(o[1])})" font-size="100" fill="${fill}" ${extra}>${str}</text>`;
}
/* axis aligned box with shaded faces */
function box(cam, a, b, col, o = {}) {
  const x0 = a[0], y0 = a[1], z0 = a[2], x1 = b[0], y1 = b[1], z1 = b[2], c = cam.pos, base = C(col); let s = '';
  const face = (pts, N, vis) => { if (!vis) return; const m = mul(add(pts[0], pts[2]), .5), h = hex(mul(shade(base, N, cam.vd(m), m), o.dim ?? 1)); s += poly(cam, pts, h, o.stroke ? `stroke="${o.stroke}" stroke-width="${o.sw || .8}" stroke-linejoin="round"` : `stroke="${h}" stroke-width=".6"`); };
  face([[x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1]], [-1, 0, 0], c[0] < x0);
  face([[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], [1, 0, 0], c[0] > x1);
  face([[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], [0, 0, -1], c[2] < z0);
  face([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [0, 0, 1], c[2] > z1);
  face([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], [0, 1, 0], c[1] > y1);
  face([[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], [0, -1, 0], c[1] < y0);
  return s;
}
/* quads -> painter-sorted, same-colour merged paths */
let WIRE = null;
function emitQuads(qs, sw = .7) {
  if (WIRE) { qs.sort((a, b) => b.z - a.z); return qs.map(q => `<path d="${q.d}" fill="${q.c}" stroke="${WIRE}" stroke-width=".55" stroke-linejoin="round"/>`).join(''); }
  qs.sort((a, b) => b.z - a.z); let s = '', cur = null, d = '';
  for (const q of qs) { if (q.c !== cur) { if (d) s += `<path d="${d}" fill="${cur}" stroke="${cur}" stroke-width="${sw}" stroke-linejoin="round"/>`; cur = q.c; d = ''; } d += q.d; }
  if (d) s += `<path d="${d}" fill="${cur}" stroke="${cur}" stroke-width="${sw}" stroke-linejoin="round"/>`;
  return s;
}
/* surface patch: grid[i][j] = {P,N,col(linear)}; wraps in j when closed */
function meshQuads(cam, grid, o = {}) {
  const qs = [], ni = grid.length, nj = grid[0].length, pj = grid.map(r => r.map(v => cam.p(v.P)));
  const mj = o.closed ? nj : nj - 1;
  for (let i = 0; i < ni - 1; i++) for (let j = 0; j < mj; j++) {
    const k = (j + 1) % nj, a = pj[i][j], b = pj[i + 1][j], c = pj[i + 1][k], d = pj[i][k];
    if (a[2] < NEAR * 2 && !cam.ortho) continue;
    const A = grid[i][j], Cc = grid[i + 1][k]; let N = norm(add(A.N, Cc.N)); const m = mul(add(A.P, Cc.P), .5), vd = cam.vd(m), fc = dot(N, vd);
    if (o.both) { if (fc < 0) N = mul(N, -1); } else if (fc < -.12) continue;
    const col = shade(mix3(A.col, Cc.col, .5), N, vd, m, o.spec || 0, o.gloss || 24, o.sss || 0, ((A.ao ?? 1) + (Cc.ao ?? 1)) / 2);
    qs.push({ z: (a[2] + b[2] + c[2] + d[2]) / 4, c: o.q ? hexQ(col) : hex(col), d: `M${xy(a)}L${xy(b)}L${xy(c)}L${xy(d)}Z` });
  }
  return qs;
}
/* soft glow disc */
function glow(x, y, r, col, op = 1, core = 0) { return `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(r)}" fill="${radG([[0, col, 1], [.18 + core, col, .55], [.5, col, .14], [1, col, 0]])}" opacity="${n3(op)}" style="mix-blend-mode:screen"/>`; }
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
