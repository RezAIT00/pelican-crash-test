/* ============================================================ Pelecanus onocrotalus: procedural anatomy */
let DEF = null;                                    // optional world-space vertex deformer (wall squash)
const dP = P => (DEF ? DEF(P) : P);

const PAL = {
  white: C('#f6f2ea'), cream: C('#f5e2c8'), under: C('#d8d3cd'), grey: C('#c9c8ca'), flight: C('#24242c'), flight2: C('#3a3940'),
  skin: C('#f3b183'), skinD: C('#df8a63'), beakTop: C('#a9b4c4'), beakEdge: C('#f0a63c'), beakBase: C('#f3c072'), nail: C('#e2452a'),
  pouch: C('#f7b22c'), pouchD: C('#e38a1e'), leg: C('#f0913a'), legD: C('#cf6f2a'), web: C('#f2a24c'), mouth: C('#a5382f'),
};
/* ---------- feather primitives (unit local space: x 0..1 along the rachis, y -.5...5 across the vane) */
const FP = {
  body: 'M0,0C.02,-.28 .28,-.53 .62,-.5C.86,-.46 1,-.2 1,0C1,.2 .86,.46 .62,.5C.28,.53 .02,.28 0,0Z',
  fine: 'M0,0C.1,-.34 .4,-.52 .7,-.42C.9,-.32 1,-.1 1,0C1,.1 .9,.32 .7,.42C.4,.52 .1,.34 0,0Z',
  flight: 'M0,-.05C.06,-.2 .3,-.36 .62,-.37C.86,-.37 .985,-.2 1,.02C.97,.3 .9,.44 .78,.48C.5,.56 .14,.42 0,.05Z',
  plume: 'M0,-.1C.3,-.5 .7,-.4 1,0C.7,.3 .3,.4 0,.1Z',
};
const BARBS = (() => { let d = ''; for (let i = 0; i < 9; i++) { const x = .14 + i * .088; d += `M${n2(x)},0L${n2(x + .1)},-${n2(.34 - abs(i - 4) * .018)}M${n2(x)},0L${n2(x + .12)},${n2(.46 - abs(i - 4) * .022)}`; } return d; })();
let LOD = 1;                                       // 2 = hero close-up, 1 = normal, 0 = cheap
let NOFEATH = false;
function feather(cam, P, D, W, N, base, kind, o = {}) {
  if (NOFEATH) return '';
  const p = cam.p(P); if (p[2] < .12 && !cam.ortho) return '';
  const q = cam.p(add(P, D)), w = cam.p(add(P, W)); const ax = q[0] - p[0], ay = q[1] - p[1], cx = w[0] - p[0], cy = w[1] - p[1];
  const Lp = hypot(ax, ay), Wp = hypot(cx, cy); if (Lp + Wp < 1.6) return '';
  const mx0 = p[0] + ax * .5, my0 = p[1] + ay * .5; if (mx0 < -220 || mx0 > 2140 || my0 < -220 || my0 > 1300) return '';
  const vd = cam.vd(P); let Nn = N; if (!o.nf && dot(Nn, vd) < 0) Nn = mul(Nn, -1);
  const c = shade(base, Nn, vd, P, o.spec || .05, 14, .35, o.ao ?? 1);
  const k1 = hexQ8(mul(c, o.root ?? .6)), k2 = hexQ8(c), k3 = hexQ8(mul(c, o.tip ?? 1.13)), ke = hexQ8(mul(c, o.edge ?? .62));
  const g = linG(0, -.22, 1, .18, [[0, k1], [.42, k2], [1, k3]], 1), tr = `matrix(${n2(ax)} ${n2(ay)} ${n2(cx)} ${n2(cy)} ${n1(p[0])} ${n1(p[1])})`;
  let s = `<path transform="${tr}" d="${FP[kind]}" fill="${g}" stroke="${ke}" stroke-width="${n2(clamp(Lp * .012, .35, 1.3))}" vector-effect="non-scaling-stroke"/>`;
  if (Lp > 15 && LOD > 0) {
    s += `<path transform="${tr}" d="M.0,0Q.5,${o.cv ?? -.04} .93,0" fill="none" stroke="${o.rach || ke}" stroke-opacity=".6" stroke-width="${n2(clamp(Lp * .012, .5, 2.4))}" vector-effect="non-scaling-stroke"/>`;
    if (Lp > 46) s += `<path transform="${tr}" d="${BARBS}" fill="none" stroke="${ke}" stroke-opacity=".28" stroke-width="${n2(clamp(Lp * .006, .4, 1.2))}" vector-effect="non-scaling-stroke"/>`;
  }
  return s;
}
/* ---------- spine (tail -> head base) */
const SR = [[.045, .055], [.135, .14], [.188, .168], [.166, .152], [.104, .096], [.066, .062], [.056, .052], [.06, .056]];
const SPINE0 = [[-.44, .95, 0], [-.285, .965, 0], [-.10, 1.03, 0], [.07, 1.125, 0], [.185, 1.215, 0], [.262, 1.29, 0], [.318, 1.375, 0], [.375, 1.452, 0]];
const HEAD0 = [.432, 1.492, 0];
function spineAt(pose, u) {
  const P = crv(pose.spine, u), e = .06, A = crv(pose.spine, mx(0, u - e)), B = crv(pose.spine, mn(7, u + e));
  const T_ = norm(sub(B, A)); let sd = norm(mix3(pose.bs, pose.hsd || pose.bs, ss(3, 7, u)));
  let up = norm(cross(sd, T_)); sd = norm(cross(T_, up));
  const R = crv(pose.rad || SR, u); return { P, T: T_, up, sd, rv: mx(.012, R[0]), rl: mx(.012, R[1]) };
}
function ringPt(f, phi, k = 1) {
  const cv = cos(phi), sv = sin(phi), P = add(f.P, add(mul(f.up, cv * f.rv * k), mul(f.sd, sv * f.rl * k)));
  return { P, N: norm(add(mul(f.up, cv / f.rv), mul(f.sd, sv / f.rl))) };
}
/* ---------- plumage layout, imbricated rows tail -> head */
const PLUM = (() => {
  const rows = []; let u = .12; let r = 0; const pose = { spine: SPINE0, bs: [0, 0, 1] };
  while (u < 7) {
    const f = spineAt(pose, u), body = 1 - ss(3.2, 5, u), L = lerp(.034, .088, body) * lerp(.8, 1, ss(0, 1.2, u)), W = lerp(.019, .052, body);
    const circ = PI * (f.rv + f.rl), n = mx(10, round(circ / (W * .74))), fs = [];
    for (let j = 0; j < n; j++) { const id = r * 97 + j; fs.push({ phi: ((j + (r % 2) * .5) / n) * TAU + (hash(id, 1) - .5) * .05, L: L * lerp(.86, 1.16, hash(id, 2)), W: W * lerp(.88, 1.12, hash(id, 3)), yaw: (hash(id, 4) - .5) * .24, lift: lerp(.05, .16, hash(id, 5)), s: hash(id, 6), b: hash(id, 7) }); }
    rows.push({ u, f: fs, body });
    const du = .02, B = spineAt(pose, u + du), step = L * .43; u += du * step / mx(.004, dist(f.P, B.P)); r++;
  }
  return rows;
})();
function bodySVG(cam, pose, u0, u1) {
  const grid = [], nr = ceil((u1 - u0) * 5) + 1, np = 22;
  for (let i = 0; i < nr; i++) {
    const u = lerp(u0, u1, i / (nr - 1)), f = spineAt(pose, u), ring = [];
    for (let j = 0; j < np; j++) { const q = ringPt(f, j / np * TAU, .965); ring.push({ P: dP(q.P), N: q.N, col: pose.skinBody || PAL.under, ao: lerp(.72, 1, ss(-1, .4, cos(j / np * TAU))) }); }
    grid.push(ring);
  }
  const A = spineAt(pose, u0), cap = [], CP = dP(mad(A.P, A.T, -.02)); for (let j = 0; j < np; j++) cap.push({ P: CP, N: mul(A.T, -1), col: PAL.under }); grid.unshift(cap);
  let s = emitQuads(meshQuads(cam, grid, { closed: 1 }), .9);
  const wind = pose.wind || 0, tm = pose.time || 0, ruf = pose.ruffle || 0;
  for (const row of PLUM) {
    if (row.u < u0 - .01 || row.u >= u1) continue; if (LOD === 0 && row.body < .5 && (round(row.u * 50) & 1)) continue;
    const f = spineAt(pose, row.u);
    for (const q of row.f) {
      if (pose.bald && q.b < pose.bald * lerp(.5, 1, row.body)) continue;
      const g = ringPt(f, q.phi, 1), vd = cam.vd(g.P), fc = dot(g.N, vd); if (fc < -.16) continue;
      const flut = wind * .16 * sin(tm * 41 + q.s * 37 + row.u * 5) + ruf * (.25 + .9 * q.s) + (pose.puff || 0) * .35;
      let dir = norm(add(mul(f.T, -1), mul(g.N, q.lift + flut)));
      const tang = norm(cross(g.N, f.T)); dir = norm(mad(dir, tang, q.yaw + (ruf ? (q.s - .5) * ruf * 1.4 : 0)));
      const P = dP(mad(g.P, f.T, q.L * .4)), P2 = dP(mad(mad(g.P, f.T, q.L * .4), dir, q.L)), D = sub(P2, P);
      const Wv = mul(norm(cross(g.N, dir)), q.W * (pose.wScale || 1));
      const N = norm(add(g.N, mul(dir, .25)));
      const breast = ss(2.6, 3.6, row.u) * (1 - ss(4, 5, row.u)) * ss(.2, -.8, cos(q.phi)), base = mix3(PAL.white, PAL.cream, breast * .85 + (row.body > .5 ? q.s * .06 : 0));
      const ao = lerp(.7, 1.03, ss(-1, .25, cos(q.phi))) * lerp(.94, 1.05, q.s);
      s += feather(cam, P, D, Wv, N, base, row.body > .4 ? 'body' : 'fine', { ao, nf: 1, root: .74, tip: 1.08, edge: row.body > .4 ? .7 : .78 });
    }
  }
  return s;
}
function tailSVG(cam, pose) {
  const f = spineAt(pose, .05), n = 13; let s = ''; const ord = [...Array(n).keys()].sort((a, b) => abs(b - 6) - abs(a - 6));
  for (const i of ord) {
    const a = (i / (n - 1) - .5) * 1.25 * (pose.tailSpread || 1), fl = (pose.wind || 0) * .05 * sin((pose.time || 0) * 33 + i * 1.7);
    const dir = norm(add(add(mul(f.T, -cos(a)), mul(f.sd, sin(a) * .8)), mul(f.up, .22 - a * a * .95 + fl + (pose.ruffle || 0) * (hash(i, 9) - .2) * .9)));
    const P = dP(mad(f.P, f.up, .012)), L = .205 - abs(a) * .03, D = sub(dP(mad(mad(f.P, f.up, .012), dir, L)), P);
    const N = norm(add(mul(f.up, 1), mul(f.sd, sin(a) * 2.2)));
    s += feather(cam, P, D, mul(norm(cross(N, dir)), .056), N, mix3(PAL.white, PAL.grey, .35 + .3 * hash(i, 3)), 'flight', { root: .7, tip: 1.05 });
  }
  return s;
}
/* ---------- wing: 10 primaries, 13 secondaries, tertials, 3 covert tracts, alula */
function wingSVG(cam, pose, w) {
  const { S, E: El, W, F, side } = w; const tm = pose.time || 0, wind = pose.wind || 0, ruf = pose.ruffle || 0;
  const a2 = norm(sub(W, El)), hand = norm(sub(F, W)), trail = norm(w.trail); let n = norm(cross(a2, trail)); if (n[2] * side < 0 && !w.nFix) n = mul(n, -1); if (w.nFix) n = w.nFix;
  let s = '';
  const fl = (P, dir, L, wd, base, kind, id, o = {}) => {
    const fA = wind * (.07 * sin(tm * 47 + id * 2.3) + .05 * sin(tm * 91 + id * 5.1)) + ruf * (hash(id, 41) - .5) * .9; dir = norm(add(dir, mul(n, fA + (o.lift || 0)))); if (ruf) dir = norm(mad(dir, a2, (hash(id, 43) - .5) * ruf * .7));
    const P0 = dP(P), D = sub(dP(mad(P, dir, L)), P0);
    return feather(cam, P0, D, mul(norm(cross(n, dir)), wd * (o.mir ? -1 : 1)), norm(add(n, mul(dir, .2))), base, kind, o);
  };
  const arm = [S, mix3(S, El, .5), El, mix3(El, W, .5), W, F], rr = [.05, .042, .036, .03, .026, .012], grid = [];
  for (let i = 0; i < arm.length; i++) { const t = norm(sub(arm[mn(i + 1, 5)], arm[mx(i - 1, 0)])), b1 = norm(cross(t, n)), ring = []; for (let j = 0; j < 8; j++) { const a = j / 8 * TAU, N = add(mul(n, cos(a)), mul(b1, sin(a))); ring.push({ P: dP(mad(arm[i], N, rr[i])), N, col: PAL.white, ao: 1 }); } grid.push(ring); }
  let armS = emitQuads(meshQuads(cam, grid, { closed: 1 }), .8);
  { const nK = 22; for (let i = nK; i >= 0; i--) { const k = i / nK * (arm.length - 1), P = crv(arm, k), t = norm(sub(crv(arm, mn(5, k + .15)), crv(arm, mx(0, k - .15)))), r = lerp(.052, .02, k / 5), b1 = norm(cross(t, n)); for (let j = 0; j < 9; j++) { const a = (j + (i & 1) * .5) / 9 * TAU, N = norm(add(mul(n, cos(a)), mul(b1, sin(a)))); if (dot(N, cam.vd(P)) < -.15) continue; const P0 = mad(P, N, r), d = norm(add(add(mul(trail, .9), mul(N, .18)), mul(t, .12 * (hash(i * 9 + j, 3) - .5)))), p0 = dP(P0); armS += feather(cam, p0, sub(dP(mad(P0, d, .05)), p0), mul(norm(cross(N, d)), .026), N, PAL.white, 'body', { root: .8, tip: 1.06, edge: .74, nf: 1 }); } } }
  const outer = dot(n, cam.vd(mix3(El, W, .5))) > 0;
  const prim = () => { let o = ''; for (let i = 0; i < 10; i++) { const k = i / 9, dir = norm(mix3(trail, hand, pow(k, 1.15) * (w.spread ?? .72))); o += fl(mix3(W, F, k * .92), dir, lerp(.26, .37, sin(k * 1.9)) * (w.scale || 1), .052, mix3(PAL.flight, PAL.flight2, hash(i, 5) * .6), 'flight', i + side * 40, { root: 1.25, tip: .9, edge: 1.9, rach: '#8f8a86', spec: .22, mir: side < 0 }); } return o; };
  const sec = () => { let o = ''; for (let i = 12; i >= 0; i--) { const k = (i + .4) / 13; o += fl(mix3(El, W, k), norm(mix3(w.trailE || trail, trail, k)), lerp(.25, .27, k) * (w.scale || 1), .058, mix3(PAL.flight, PAL.flight2, .2 + hash(i, 6) * .7), 'flight', i + 20 + side * 40, { root: 1.2, tip: .95, edge: 1.8, rach: '#7d7976', spec: .2, mir: side < 0 }); } return o; };
  const along = k => (k < .3 ? mix3(S, El, k / .3) : k < .76 ? mix3(El, W, (k - .3) / .46) : mix3(W, F, (k - .76) / .24));
  const dirAt = k => (k < .3 ? norm(mix3(w.trailE || trail, trail, k / .3 * .5)) : k < .76 ? norm(mix3(w.trailE || trail, trail, .5 + (k - .3) / .92)) : norm(mix3(trail, hand, (k - .76) / .24 * (w.spread ?? .72) * .75)));
  const tert = () => { let o = ''; for (let i = 8; i >= 0; i--) { const k = (i + .3) / 9; o += fl(mix3(S, El, k), norm(add(w.trailE || trail, mul(n, .05))), .2, .062, mix3(PAL.white, PAL.grey, .25 + .4 * hash(i, 8)), 'flight', i + 60 + side * 40, { root: .74, mir: side < 0 }); } return o; };
  const cov = (nF, L, wd, off, mixg, sd, k0 = 0, k1 = 1) => { let o = ''; for (let i = nF - 1; i >= 0; i--) { const k = lerp(k0, k1, (i + .5) / nF), d = dirAt(k), B = mad(mad(along(k), d, off), n, (outer ? 1 : -1) * (.03 - off * .12)), lj = lerp(.9, 1.1, hash(i, sd + 60)); o += fl(B, d, L * lj, wd, mix3(PAL.white, PAL.grey, mixg * hash(i, sd)), 'body', i + sd * 10 + side * 40, { root: .76, tip: 1.06, edge: .72 }); } return o; };
  const coverts = () => cov(24, .135, .05, .06, .6, 11, .04, .97) + cov(25, .105, .046, .035, .35, 12) + cov(27, .08, .042, .012, .2, 13) + cov(29, .064, .036, -.008, .1, 14) + cov(31, .052, .032, -.024, .04, 15) + cov(33, .042, .027, -.038, .02, 16);
  s += outer ? prim() + sec() + tert() + armS + coverts() : armS + coverts() + prim() + sec() + tert();
  /* alula: three stiff feathers doing the job of a hand */
  const al = w.alula || add(mul(trail, -.4), [0, -.9, 0]);
  for (let i = 0; i < 4; i++) s += fl(mad(W, hand, .006 * i - .01), norm(add(al, mul(a2, (i - 1.5) * .26))), .082, .024, i % 2 ? PAL.grey : PAL.white, 'flight', i + 90, { root: .8 });
  return s;
}
/* ---------- legs: femur hidden, feathered tibiotarsus, bare tarsometatarsus, totipalmate foot */
function limbTube(cam, pts, rad, cols, np = 9) {
  const grid = []; for (let i = 0; i < pts.length; i++) { const t = norm(sub(pts[mn(i + 1, pts.length - 1)], pts[mx(i - 1, 0)])); let b1 = norm(cross(t, [0, 0, 1])); if (len(b1) < .1) b1 = [1, 0, 0]; const b2 = cross(t, b1), ring = []; for (let j = 0; j < np; j++) { const a = j / np * TAU, N = add(mul(b1, cos(a)), mul(b2, sin(a))); ring.push({ P: dP(mad(pts[i], N, rad[i])), N, col: cols[i] }); } grid.push(ring); }
  return emitQuads(meshQuads(cam, grid, { closed: 1, spec: .25, gloss: 18 }), .8);
}
function footSVG(cam, F, fd, fu, o = {}) {
  const fs = norm(cross(fd, fu)), spread = o.spread ?? 1, curl = o.curl ?? 0; let s = '';
  const toe = (a, L) => { const d = norm(add(mul(fd, cos(a)), mul(fs, sin(a)))); return [0, .33, .66, 1].map(k => dP(add(mad(F, d, L * k), mul(fu, .012 * sin(k * PI) - curl * k * k * L + .004)))); };
  const toes = [toe(-.62 * spread, .105), toe(-.12 * spread, .13), toe(.36 * spread, .12), toe(1.35 * spread, .07)];
  const col = shade(PAL.web, fu, cam.vd(F), F, .2, 10, .5), webA = hex(col), webB = hex(mul(col, .72));
  for (let i = 0; i < 3; i++) { const A = toes[i].map(cam.p), B = toes[i + 1].map(cam.p), o0 = cam.p(dP(F)), mid = [(A[3][0] + B[3][0]) / 2 * .72 + o0[0] * .28, (A[3][1] + B[3][1]) / 2 * .72 + o0[1] * .28]; s += `<path d="M${xy(o0)}L${xy(A[3])}Q${xy(mid)} ${xy(B[3])}Z" fill="${i % 2 ? webA : webB}" stroke="${hex(mul(col, .5))}" stroke-width=".8"/>`; }
  for (const t of toes) { s += pline(cam, t, hex(mul(shade(PAL.legD, fu, cam.vd(F), F), .8)), .02) + pline(cam, t, hex(shade(PAL.leg, fu, cam.vd(F), F)), .014); const e = cam.p(t[3]); s += `<circle cx="${n1(e[0])}" cy="${n1(e[1])}" r="${n1(mx(.5, .006 * e[3]))}" fill="#3a2a22"/>`; }
  return s;
}
function legSVG(cam, pose, g) {
  const { H, K, A, F } = g; let s = '';
  s += limbTube(cam, [K, mix3(K, A, .35), mix3(K, A, .62), mix3(K, A, .86), A, mix3(A, F, .12), mix3(A, F, .5), mix3(A, F, .9), F], [.05, .046, .03, .02, .023, .019, .0145, .015, .019], [PAL.white, PAL.white, PAL.skin, PAL.leg, PAL.legD, PAL.leg, PAL.leg, PAL.leg, PAL.legD]);
  const a = norm(sub(F, A)); for (let i = 1; i < 12; i++) { const P = mix3(A, F, i / 12), b = cross(a, cam.vd(P)); s += pline(cam, [dP(mad(P, b, .012)), dP(add(P, mul(a, .006))), dP(mad(P, b, -.012))], '#8c4415', .0022, 'stroke-opacity=".55"', .3); }
  s += footSVG(cam, F, g.fd, g.fu, g);
  /* feathered thigh + "trousers" */
  const t = norm(sub(A, K)), hk = norm(sub(K, H));
  const pts = [H, mix3(H, K, .5), K, mix3(K, A, .22), mix3(K, A, .42)], rad = [.08, .07, .054, .044, .032];
  s += limbTube(cam, pts, rad, [PAL.under, PAL.under, PAL.under, PAL.under, PAL.under], 10);
  const rows = 9; for (let r = rows - 1; r >= 0; r--) {
    const k = r / (rows - 1) * 4, P = crv(pts, k), ax = norm(sub(crv(pts, mn(4, k + .2)), crv(pts, mx(0, k - .2)))), R = crv(rad.map(x => [x]), k)[0]; let b1 = norm(cross(ax, [0, 0, 1])); const b2 = cross(ax, b1);
    for (let j = 0; j < 13; j++) { const q = (j + (r & 1) * .5) / 13 * TAU, N = add(mul(b1, cos(q)), mul(b2, sin(q))); if (dot(N, cam.vd(P)) < -.2) continue; const P0 = mad(P, N, R), dir = norm(add(ax, mul(N, .16 + (pose.ruffle || 0) * .6 * hash(r * 13 + j, 2) + .05 * sin((pose.time || 0) * 30 + j) * (pose.wind || 0)))); const pp = dP(P0); s += feather(cam, pp, sub(dP(mad(P0, dir, .062)), pp), mul(norm(cross(N, dir)), .036), N, PAL.white, 'body', { ao: lerp(.8, 1, N[1] * .5 + .5), root: .68 }); }
  }
  return s;
}
/* ---------- head, eyes, bill, gular pouch */
const BL = .48;
const HEADP = [[-.094, .004], [-.084, .03], [-.06, .054], [-.025, .067], [.012, .0675], [.045, .06], [.072, .049], [.096, .039], [.112, .032]];
function headFrame(h) { const f = norm(h.f); let s = norm(cross(f, h.u)); const u = cross(s, f); return { c: h.c, f, u, s }; }
const hp = (H, x, y, z) => add(add(add(H.c, mul(H.f, x)), mul(H.u, y)), mul(H.s, z));
const EYE = { x: .034, y: .026, z: .047, r: .0265 };
function headSVG(cam, pose) {
  const H = headFrame(pose.head), grid = [];
  const hx = LOD > 1 ? [...Array(33).keys()].map(i => { const x = lerp(-.094, .112, i / 32); return [x, tabS(HEADP, x)]; }) : HEADP, HN = LOD > 1 ? 40 : 22;
  for (const [x, r] of hx) {
    const ring = []; for (let j = 0; j < HN; j++) {
      const a = j / HN * TAU, cy = cos(a), sz = sin(a), P = hp(H, x, cy * r * (cy > 0 ? 1.02 : .98) + (x < 0 ? .004 : -.1 * x * x * 10 * .5), sz * r * .86), N = norm(add(add(mul(H.u, cy), mul(H.s, sz)), mul(H.f, x < -.05 ? -.9 : x > .05 ? .35 : x * 6)));
      const ed = hypot((x - EYE.x) / .046, (cy * r - EYE.y) / .038, (abs(sz * r * .86) - EYE.z) / .05), sk = mx(ss(1.25, .8, ed), ss(.066, .092, x));
      ring.push({ P: dP(P), N, col: mix3(PAL.white, mix3(PAL.skin, PAL.beakBase, ss(.07, .1, x)), sk), ao: lerp(.8, 1, ss(-1, .2, cy)) });
    }
    grid.push(ring);
  }
  let s = '';
  /* nuchal crest behind */
  for (let i = 0; i < 11; i++) { const k = i / 10, P = hp(H, -.07 - .012 * sin(k * PI), .045 - k * .075, (hash(i, 3) - .5) * .03), sw = (pose.wind || 0) * .25 * sin((pose.time || 0) * 26 + i) + (pose.crest || 0), d = norm(add(add(mul(H.f, -1), mul(H.u, lerp(.55, -.75, k) + sw)), mul(H.s, (hash(i, 4) - .5) * .5))), L = lerp(.06, .1, hash(i, 5)); const p0 = dP(P); s += feather(cam, p0, sub(dP(mad(P, d, L)), p0), mul(norm(cross(H.s, d)), .016), H.s, PAL.white, 'plume', { tip: 1.1 }); }
  s += emitQuads(meshQuads(cam, grid, { closed: 1, spec: .08, sss: .3 }), .9);
  /* short crown / cheek feathering */
  for (let i = 0; i < 260; i++) {
    const x = lerp(-.09, .05, pow(hash(i, 51), .9)), a = hash(i, 52) * TAU, r = tab(HEADP, x), cy = cos(a), sz = sin(a); if (hypot((x - EYE.x) / .05, (cy * r - EYE.y) / .04, (abs(sz * r * .86) - EYE.z) / .05) < 1.18) continue;
    const P = hp(H, x, cy * r, sz * r * .86), N = norm(add(add(mul(H.u, cy), mul(H.s, sz)), mul(H.f, x < -.05 ? -.9 : x * 6))); if (dot(N, cam.vd(P)) < -.1) continue;
    const d = norm(add(mul(H.f, -1), mul(N, .22))), p0 = dP(P); s += feather(cam, p0, sub(dP(mad(P, d, .024)), p0), mul(norm(cross(N, d)), .0095), N, PAL.white, 'fine', { ao: lerp(.82, 1.04, ss(-1, .3, cy)), root: .84, tip: 1.06, edge: .8 });
  }
  return s;
}
function eyeSVG(cam, pose, sd) {
  const H = headFrame(pose.head), e = pose.eye || {}, R = EYE.r * (e.size || 1), ef = norm(add(add(mul(H.s, sd * .86), mul(H.f, .42)), mul(H.u, .12))), c0 = hp(H, EYE.x, EYE.y, EYE.z * sd), c = dP(c0), vd = cam.vd(c), vis = dot(ef, vd); if (vis < -.22) return '';
  const p = cam.p(c), r = R * p[3]; if (r < 1) return ''; const up = cam.p(dP(mad(c0, H.u, .03))), ang = atan2(up[1] - p[1], up[0] - p[0]) * 180 / PI + 90, sq = clamp(.3 + vis * .9, .25, 1), fx = cam.p(dP(mad(c0, H.f, .03))), fdir = sign(fx[0] - p[0]) || 1;
  const id = 'e' + (FR.id++), skin = hex(shade(PAL.skin, ef, vd, c, .1, 12, .4)), skinD = hex(mul(shade(PAL.skinD, ef, vd, c), .8)), lidC = hex(shade(mix3(PAL.skin, PAL.skinD, .35), norm(add(ef, mul(H.u, .5))), vd, c, .25, 14, .3));
  const g = e.gazeCam ? 0 : 1, gz = e.gaze || [.3, 0]; let ix, iy, fore = 1;
  if (!g) { const dirW = norm(sub(cam.pos, c)), gl = norm(mix3(ef, dirW, e.gazeCam)); const q = cam.p(mad(c, gl, R * .62)); ix = (q[0] - p[0]); iy = (q[1] - p[1]); fore = clamp(dot(gl, vd), .45, 1); const a = -ang * PI / 180; const tx = ix * cos(a) - iy * sin(a), ty = ix * sin(a) + iy * cos(a); ix = tx; iy = ty; }
  else { ix = gz[0] * r * .42 * fdir; iy = -gz[1] * r * .42; }
  const ir = r * .66 * (e.iris || 1), pr = ir * .52 * (e.pupil || 1);
  let s = `<g transform="translate(${n1(p[0])} ${n1(p[1])}) rotate(${n1(ang)}) scale(${n2(sq)} 1)">`;
  s += `<ellipse rx="${n1(r * 1.42)}" ry="${n1(r * 1.36)}" fill="${skin}" stroke="${skinD}" stroke-width="${n1(r * .05)}"/><ellipse rx="${n1(r * 1.14)}" ry="${n1(r * 1.12)}" fill="${skinD}"/>`;
  for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; s += `<circle cx="${n1(cos(a) * r * 1.28)}" cy="${n1(sin(a) * r * 1.23)}" r="${n1(r * .035)}" fill="${skinD}" opacity=".55"/>`; }
  const sc = clamp(LIGHT.exp * (LIGHT.keyC[1] * .55 + LIGHT.sky[1] * .8), .12, 1);
  s += `<clipPath id="${id}"><circle r="${n1(r * 1.02)}"/></clipPath><g clip-path="url(#${id})"><circle r="${n1(r)}" fill="${radG([[0, hex([sc, sc, sc * .98])], [.7, hex([sc * .86, sc * .85, sc * .86])], [1, hex([sc * .42, sc * .38, sc * .4])]])}"/>`;
  s += `<g transform="translate(${n1(ix)} ${n1(iy)}) scale(${n2(fore)} 1)"><circle r="${n1(ir)}" fill="${radG([[0, mixC('#000000', '#8a4a1c', sc)], [.55, mixC('#000000', '#b5651f', sc)], [.86, mixC('#000000', '#7b3512', sc)], [1, '#1d0d07']])}"/>`;
  for (let i = 0; i < 22; i++) { const a = i / 22 * TAU; s += `<path d="M${n1(cos(a) * pr)},${n1(sin(a) * pr)}L${n1(cos(a) * ir * .92)},${n1(sin(a) * ir * .92)}" stroke="#ffcf7a" stroke-opacity="${n2(.1 + .22 * hash(i, 7))}" stroke-width="${n1(r * .03)}"/>`; }
  s += `<circle r="${n1(pr)}" fill="#070405"/></g><circle cx="${n1(ix * .6 - r * .26)}" cy="${n1(iy * .6 - r * .3)}" r="${n1(r * .17)}" fill="#fff" opacity="${n2(.35 + .6 * sc)}"/><circle cx="${n1(ix * .6 + r * .24)}" cy="${n1(iy * .6 + r * .26)}" r="${n1(r * .08)}" fill="#cfe6ff" opacity="${n2(.5 * sc + .1)}"/>`;
  /* eyelids */
  const lu = e.lidU ?? .18, ll = e.lidL ?? .05, tl = (e.tilt || 0) * fdir, yl = lerp(-1.15, 1.02, lu) * r, yb = lerp(1.15, -.6, ll) * r;
  s += `<path d="M${n1(-r * 1.3)},${n1(-r * 1.4)}L${n1(r * 1.3)},${n1(-r * 1.4)}L${n1(r * 1.3)},${n1(yl + tl * r * .5)}Q0,${n1(yl + r * .16)} ${n1(-r * 1.3)},${n1(yl - tl * r * .5)}Z" fill="${lidC}" stroke="${skinD}" stroke-width="${n1(r * .07)}"/>`;
  s += `<path d="M${n1(-r * 1.1)},${n1(yl - tl * r * .5 - r * .16)}Q0,${n1(yl - r * .04)} ${n1(r * 1.1)},${n1(yl + tl * r * .5 - r * .16)}" fill="none" stroke="${skinD}" stroke-opacity=".5" stroke-width="${n1(r * .05)}"/>`;
  s += `<path d="M${n1(-r * 1.3)},${n1(r * 1.5)}L${n1(r * 1.3)},${n1(r * 1.5)}L${n1(r * 1.3)},${n1(yb)}Q0,${n1(yb + r * .22)} ${n1(-r * 1.3)},${n1(yb)}Z" fill="${lidC}" stroke="${skinD}" stroke-width="${n1(r * .05)}"/>`;
  s += `<path d="M${n1(-r)},${n1(yl - tl * r * .5)}Q0,${n1(yl + r * .17)} ${n1(r)},${n1(yl + tl * r * .5)}L${n1(r)},${n1(yl + r * .3)}L${n1(-r)},${n1(yl + r * .3)}Z" fill="#1b0c08" opacity=".22"/></g>`;
  if (e.bags) s += `<path d="M${n1(-r * .95)},${n1(r * 1.12)}Q0,${n1(r * 1.55)} ${n1(r * .95)},${n1(r * 1.12)}M${n1(-r * .75)},${n1(r * 1.34)}Q0,${n1(r * 1.72)} ${n1(r * .75)},${n1(r * 1.34)}" fill="none" stroke="${skinD}" stroke-width="${n1(r * .07)}" stroke-linecap="round" opacity="${n2(e.bags)}"/>`;
  /* brow: a tuft of crown feathers */
  const by = -r * (1.42 - (e.brow || 0) * .5), bt = (e.browTilt ?? .1) * fdir; const wh = hex(shade(PAL.white, norm(add(ef, mul(H.u, .6))), vd, c)), whd = hex(mul(shade(PAL.white, ef, vd, c), .62));
  for (let i = 0; i < 11; i++) { const k = (fdir > 0 ? i / 10 : 1 - i / 10) * 2 - 1, x = k * r * 1.16, y = by + bt * k * r * .75 + k * k * r * .26, L = r * lerp(.62, .4, abs(k)), g = -fdir; s += `<path d="M${n1(x - g * r * .12)},${n1(y + r * .16)}C${n1(x - g * r * .14)},${n1(y - r * .16)} ${n1(x + g * L * .5)},${n1(y - r * .34)} ${n1(x + g * L)},${n1(y - r * .2 + abs(k) * r * .12)}C${n1(x + g * L * .8)},${n1(y + r * .06)} ${n1(x + g * r * .2)},${n1(y + r * .2)} ${n1(x - g * r * .12)},${n1(y + r * .16)}Z" fill="${wh}" stroke="${whd}" stroke-opacity=".55" stroke-width="${n1(mx(.4, r * .028))}"/>`; }
  return s + '</g>';
}
function beakFrames(pose, n = LOD > 1 ? 44 : 30) {
  const H = headFrame(pose.head), b = pose.beak || {}, c = b.crumple || 0, dr = b.dir || 0, f0 = norm(add(mul(H.f, cos(dr)), mul(H.u, sin(dr)))), u0 = cross(H.s, f0); let P = hp(H, .088, -.006, 0); const out = [];
  let adv = 0; const base = P; const bend = b.bend || 0;
  for (let i = 0; i <= n; i++) {
    const u = i / n, cl = clamp(c * 1.75 - (1 - u) * .75) * ss(0, .12, u), zig = (1 - 4 * abs(((u * 5.5 + .25) % 1) - .5)) * .062 * cl, sg = sin(u * 23) * .016 * cl;
    if (i) adv += BL / n * (1 - .84 * cl);
    const q = add(add(mad(base, f0, adv), mul(u0, zig - .012 * ss(.9, 1, u) + bend * u * u * .2)), mul(H.s, sg));
    out.push({ u, P: q, up: u0, s: H.s, f: f0, cl });
  }
  return out;
}
const wU = [[0, .033], [.1, .029], [.3, .0235], [.7, .0195], [.92, .023], [.98, .016], [1, .004]], hU = [[0, .038], [.12, .03], [.3, .021], [.7, .0135], [.94, .015], [1, .005]];
function beakSVG(cam, pose) {
  const b = pose.beak || {}, fr = beakFrames(pose), qs = [], H = headFrame(pose.head), tm = pose.time || 0, UJ = LOD > 1 ? 20 : 12, LJ = LOD > 1 ? 30 : 14, UN = fr.length - 1;
  /* upper mandible */
  const up = fr.map(f => { const w = tab(wU, f.u) * (1 + f.cl * .7), h = tab(hU, f.u) * (1 + f.cl * .4), ring = []; for (let j = 0; j <= UJ; j++) { const a = (j / UJ - .5) * PI, sn = sin(a), cs = cos(a); const P = dP(add(add(f.P, mul(f.s, sn * w)), mul(f.up, cs * h))), N = norm(add(mul(f.s, sn / w), mul(f.up, cs / h))); const ridge = ss(.55, .95, cs), nail = ss(.925, .955, f.u); let col = mix3(mix3(PAL.beakEdge, PAL.beakTop, ss(.1, .75, cs) * ss(.06, .3, f.u)), PAL.beakBase, ss(.16, .02, f.u)); col = mix3(col, PAL.nail, nail); col = mix3(col, PAL.skin, ridge * .18); ring.push({ P, N, col, ao: 1 }); } return ring; });
  qs.push(...meshQuads(cam, up, { spec: .4, gloss: 34, sss: .15, both: 1 }));
  /* lower mandible & gular pouch */
  const op = b.open || 0, pv = b.pouch ?? 1, infl = b.inflate || 0, hinge = fr[0].P, rot = P => { const d = sub(P, hinge); return add(hinge, rotAxis(d, H.s, -op)); };
  const lower = [], ramL = [], ramR = []; const nn = fr.length;
  const thr = [-.14, -.07].map(u => ({ u, P: add(mad(hinge, fr[0].f, u * BL), mul(fr[0].up, -.018 + u * .16)), up: fr[0].up, s: H.s, f: fr[0].f, cl: 0 }));
  for (const f of [...thr, ...fr.slice(0, nn - 1)]) {
    const u = f.u, w = (u < 0 ? lerp(.028, .031, (u + .14) / .14) : tab(wU, u) * .94) * (1 + f.cl * .5), P0 = rot(mad(f.P, f.up, -.004)), dn = rotAxis(mul(f.up, -1), H.s, -op), k = clamp((u + .16) / 1.12), shape = pow(sin(pow(k, .62) * PI), .85);
    const wob = (pose.wind || 0) * (.03 * sin(u * 11 - tm * 46) + .014 * sin(u * 23 - tm * 83)) * shape, d = mx(.006, shape * (.105 * pv + infl * .17) + wob + .006), bul = 1 + shape * (.55 * pv + infl * 3.6), ring = [];
    for (let j = 0; j <= LJ; j++) { const a = (j / LJ - .5) * PI, sn = sin(a), cs = cos(a), sg = sn * w * (1 + (bul - 1) * cs * cs * 2.1), P = dP(add(add(P0, mul(f.s, sg)), mul(dn, pow(cs, .8) * d))), N = norm(add(mul(f.s, sn * 1.05), mul(dn, cs))); ring.push({ P, N, col: mix3(mix3(PAL.pouch, PAL.pouchD, ss(.25, 1, cs) * .55), PAL.skin, ss(.02, -.12, u) * .6), ao: lerp(1, .82, cs) }); }
    lower.push(ring); ramL.push(ring[0].P); ramR.push(ring[LJ].P);
  }
  qs.push(...meshQuads(cam, lower, { spec: .22, gloss: 14, sss: .55, both: 1 }));
  if (op > .04) { const inn = fr.slice(0, nn - 2).map(f => [-1, 0, 1].map(k => ({ P: dP(add(f.P, add(mul(f.s, k * tab(wU, f.u) * .8), mul(f.up, -.002)))), N: mul(f.up, -1), col: PAL.mouth }))); qs.push(...meshQuads(cam, inn, { both: 1 })); }
  let s = emitQuads(qs, .9);
  /* veins on the pouch, on whichever flank faces us */
  const vis = dot(H.s, cam.vd(H.c)) > 0 ? 1 : -1;
  if (LOD > 0) for (let v = 0; v < 6; v++) { const pts = []; for (let i = 3; i < lower.length - 4; i += 1) { const row = lower[i], k = (i - 3) / (lower.length - 7), j = (7 + vis * clamp(5.4 - v * .9 + sin(k * 5 + v * 2) * .9, .3, 6.6)) * LJ / 14, j0 = floor(j); pts.push(mix3(row[j0].P, row[mn(LJ, j0 + 1)].P, j - j0)); } s += pline(cam, pts.slice(0, pts.length - v * 3), '#b4471b', .0022, 'stroke-opacity=".32"', .35); }
  const edge = hex(mul(shade(PAL.beakEdge, mul(H.s, vis), cam.vd(H.c), H.c, .3), .85)), dk = hex(mul(shade(PAL.pouchD, mul(H.s, vis), cam.vd(H.c), H.c), .5));
  s += pline(cam, (vis > 0 ? ramR : ramL).slice(1), dk, .012) + pline(cam, (vis > 0 ? ramR : ramL).slice(1), edge, .008);
  const lip = up.map(r => r[vis > 0 ? UJ : 0].P), uq = k => round((vis > 0 ? k : 12 - k) / 12 * UJ), ur = k => round(k / 30 * UN); s += pline(cam, lip, hex(mul(shade(PAL.skinD, mul(H.s, vis), cam.vd(H.c), H.c), .55)), .004, 'stroke-opacity=".8"');
  s += pline(cam, up.slice(ur(1), ur(27)).map(r => r[uq(8)].P), '#ffffff', .0035, 'stroke-opacity=".28"') + pline(cam, up.slice(ur(2), ur(8)).map(r => r[uq(10)].P), '#6a4a35', .003, 'stroke-opacity=".7"');
  return s;
}
/* ---------- crash-test fiducial: quartered disc on a surface */
function fiducial(cam, P, N, r, a0 = 0, o = {}) {
  const vd = cam.vd(P); if (dot(N, vd) < .02) return ''; let t = norm(cross(N, abs(N[1]) > .9 ? [1, 0, 0] : [0, 1, 0])), b = cross(N, t); const pt = (a, k = 1) => cam.p(dP(add(P, add(mul(t, cos(a) * r * k), mul(b, sin(a) * r * k))))); const c = cam.p(dP(P)); let s = '';
  const Y = hex(shade(C(o.a || '#ffd400'), N, vd, P, .1)), K = hex(shade(C('#16161a'), N, vd, P, .2));
  let ring = ''; for (let i = 0; i <= 24; i++) ring += (i ? 'L' : 'M') + xy(pt(i / 24 * TAU, 1.14)); s += `<path d="${ring}Z" fill="${K}"/>`;
  for (let q = 0; q < 4; q++) { let d = 'M' + xy(c); for (let i = 0; i <= 6; i++) d += 'L' + xy(pt(a0 + (q + i / 6) * PI / 2)); s += `<path d="${d}Z" fill="${q % 2 ? K : Y}"/>`; }
  return s;
}
/* in side views only the lateral layer matters; in end views true depth does */
function zctr(cam, c) { const k = ss(.45, .8, abs(cam.f[2])); return P => cam.depth([lerp(P[0], c[0], k), lerp(P[1], c[1], k), P[2]]); }
/* ---------- assemble: returns depth-keyed parts */
function pelicanParts(cam, pose, o = {}) {
  const parts = [], H = headFrame(pose.head), zc = zctr(cam, pose.zc || pose.spine[2]), dz = zc, vh = cam.vd(H.c);
  for (const g of pose.legs || []) parts.push({ z: dz(mix3(g.K, g.F, .4)) - .0, s: legSVG(cam, pose, g), k: 'leg' + g.side });
  for (const w of pose.wings || []) parts.push({ z: dz(mix3(w.E, w.W, .4)) - .01, s: wingSVG(cam, pose, w), k: 'wing' + w.side });
  const tailNear = cam.depth(pose.spine[0]) < cam.depth(pose.spine[2]);
  const cut = pose.cut ?? 3.9;
  let body = bodySVG(cam, pose, .05, cut); const tl = tailSVG(cam, pose); body = tailNear ? body + tl : tl + body;
  for (const m of pose.marks || []) body += fiducial(cam, m.P(pose), m.N(pose), m.r, m.a || .4, m);
  parts.push({ z: dz(mix3(pose.spine[1], pose.spine[2], .6)) - .02 - (pose.bodyBias || 0), s: body, k: 'body' });
  const nk = bodySVG(cam, pose, cut - .25, 6.99);
  const beakFwd = dot(H.f, vh); const es = [1, -1].map(sd => ({ sd, v: dot(H.s, vh) * sd }));
  const far = es.filter(e => e.v <= 0), near = es.filter(e => e.v > 0); let hd = headSVG(cam, pose); const bk = beakSVG(cam, pose);
  let cheek = ''; if (pose.cheek) cheek = fiducial(cam, hp(H, -.034, -.008, .057 * pose.cheek), norm(add(mul(H.s, pose.cheek), mul(H.u, .05))), .0185, .3);
  const farE = far.map(e => eyeSVG(cam, pose, e.sd)).join(''), nearE = near.map(e => eyeSVG(cam, pose, e.sd)).join('');
  const front = beakFwd > .22;
  const headS = front ? hd + cheek + farE + nearE + bk : farE + bk + hd + cheek + nearE;
  const headNear = cam.depth(H.c) <= cam.depth(pose.spine[5]) + .02;
  parts.push({ z: dz(mix3(pose.spine[5], H.c, .6)) - .035 - (pose.headBias || 0), s: headNear ? nk + headS : headS + nk, k: 'head' });
  return parts;
}
/* ---------- riding pose: pedalling kinematics, head stabilisation, wind */
const MARKS = [
  { P: p => { const f = spineAt(p, 2.15); return ringPt(f, 1.25, 1.03).P; }, N: p => ringPt(spineAt(p, 2.15), 1.25).N, r: .05 },
  { P: p => { const f = spineAt(p, .95); return ringPt(f, 1.45, 1.05).P; }, N: p => ringPt(spineAt(p, .95), 1.45).N, r: .034 },
  { P: p => { const f = spineAt(p, 2.15); return ringPt(f, -1.25, 1.03).P; }, N: p => ringPt(spineAt(p, 2.15), -1.25).N, r: .05 },
];
function ridePose(t, o = {}) {
  const bx = o.bx ?? bikeX(t), v = o.v ?? vel(t), sp = v / VMAX, th = o.th ?? crankAng(t), B = (x, y, z) => [bx + x, y, z];
  const bob = .010 * sin(2 * th) * sp + .004 * sin(t * 2.4) * (1 - sp), sway = .016 * sin(th) * sp, lean = .02 * sp, crouch = o.crouch ?? sp;
  const sc = SPINE0.map((p, i) => { const k = clamp(1 - i / 6.5); return B(p[0] + lean * (i / 7) + crouch * .012 * i / 7 - .0, p[1] + bob * k - crouch * .012 * ss(2, 6, i), sway * (1 - i / 7.5)); });
  const hx = o.headDx || 0, hy = o.headDy || 0, hy2 = -crouch * .016; const hc = B(HEAD0[0] + lean + crouch * .014 + hx, HEAD0[1] + hy2 + hy, 0);
  sc[7] = [sc[7][0] + hx * .8, sc[7][1] + hy * .8, sc[7][2]]; sc[6] = [sc[6][0] + hx * .4, sc[6][1] + hy * .4, sc[6][2]];
  const pitch = o.headPitch ?? lerp(-.12, -.05, sp), yaw = o.headYaw || 0, hf = norm([cos(pitch) * cos(yaw), sin(pitch), sin(yaw) * cos(pitch)]);
  const pose = {
    time: t, wind: o.wind ?? sp, spine: sc, rad: SR, bs: norm([0, -sway * 2, 1]), head: { c: hc, f: hf, u: rotAxis([0, 1, 0], hf, o.headRoll || 0) },
    eye: Object.assign({ gaze: [.75, .05], lidU: lerp(.2, .3, sp), lidL: .1, tilt: .3 * sp, brow: .25, browTilt: .28 }, o.eye || {}),
    beak: Object.assign({ open: .03 + .05 * sp + .03 * sp * noise1(t * 9, 3), pouch: lerp(.7, 1, sp), crumple: 0 }, o.beak || {}), wings: [], legs: [], marks: MARKS, cheek: 1,
  };
  pose.hsd = headFrame(pose.head).s;
  for (const sd of [1, -1]) {
    const S = add(sc[3], [-.005, .012, sd * .13]), grip = B(G.BAR[0] + .022, G.BAR[1] + .028, sd * .215), W = grip, El = ik2(S, W, .25, .40, [-.95, -.12, sd * .5]), F = add(W, mul(norm([-.86, -.1, sd * .34]), .19));
    const fl = .06 * sp * sin(t * 37 + sd);
    pose.wings.push({ side: sd, S, E: El, W, F, trail: norm([-.8, -.62 + fl + .3 * sp, sd * (.16 + .12 * sp)]), trailE: norm([-.92, -.42 + fl + .22 * sp, sd * .1]), spread: .62 + .05 * sin(t * 23 + sd) * sp, alula: norm([.35, -1, -sd * .1]) });
    const a = sd > 0 ? th : th + PI, pd = B(G.BB[0] + G.CR * cos(a), G.BB[1] + G.CR * sin(a), sd * .125), F2 = add(pd, [-.012, .026, 0]), h = (sin(a) + 1) / 2, al = lerp(-1.08, .04, h) + .1 * cos(a), Hp = add(mix3(sc[1], sc[2], .62), [0, -.06, sd * .085]), K = add(Hp, [.2 * cos(al), .2 * sin(al), sd * .03]), A = ik2(K, F2, .345, .315, [-1, .1, sd * .12]);
    const pit = -.22 + .34 * cos(a + .6); pose.legs.push({ side: sd, H: Hp, K, A, F: F2, fd: norm([cos(pit), sin(pit), sd * .05]), fu: norm([-sin(pit), cos(pit), 0]), spread: 1 });
  }
  return pose;
}
