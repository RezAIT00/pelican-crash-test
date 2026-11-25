/* ============================================================ the bicycle */
const NSP = 28;
const BCOL = { frame: C('#d8262c'), frame2: C('#8f1418'), steel: C('#aab2bd'), dark: C('#23262b'), tyre: C('#1b1c1f'), rim: C('#c3c9d1'), leather: C('#4a2c1c'), amber: C('#ff9a1f'), brass: C('#e2b04a') };
/* painterly tube: contour, body, under-shadow, two highlights */
function tube(cam, pts, r, base, o = {}) {
  const P = pts.map(dP), m = P[floor(P.length / 2)], q = P.map(cam.p); let sc = 0; for (const p of q) { if (p[2] < .1 && !cam.ortho) return ''; sc += p[3]; } sc /= q.length;
  let d = ''; if (o.smooth && q.length > 2) { const N = (q.length - 1) * 5; for (let i = 0; i <= N; i++) d += (i ? 'L' : 'M') + xy(crv(q, i / 5)); } else d = 'M' + q.map(xy).join('L');
  const w = mx(.5, r * 2 * sc); const a = q[0], b = q[q.length - 1]; let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const L = hypot(nx, ny) || 1; nx /= L; ny /= L; if (ny > 0) { nx = -nx; ny = -ny; }
  const vd = cam.vd(m), Nup = norm(add(mul(cam.u, .8), mul(vd, .6))), c = shade(base, Nup, vd, m, .1, 20), cs = shade(base, norm(add(mul(cam.u, -.8), mul(vd, .5))), vd, m);
  const st = (col, ww, off, op = 1) => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${n2(ww)}" stroke-linecap="${o.cap || 'round'}" stroke-linejoin="round"${off ? ` transform="translate(${n1(nx * off)} ${n1(ny * off)})"` : ''}${op < 1 ? ` stroke-opacity="${op}"` : ''}/>`;
  let s = st(hex(mul(cs, .38)), w + mx(.8, w * .12), 0) + st(hex(mul(cs, .72)), w, 0) + st(hex(c), w * .74, w * .1);
  if (w > 2.4) s += st(hex(mix3(c, [1, 1, 1], .35)), w * .24, w * .22, .8); if (w > 5) s += st('#ffffff', w * .09, w * .27, .75);
  return s;
}
function ringPath(q, closed, ok) { /* smooth screen-space ring with optional gaps */
  const n = q.length; let d = '', pen = false;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n; if ((!closed && i === n - 1) || (ok && !ok[i])) { pen = false; continue; }
    const a = q[(i - 1 + n) % n], b = q[i], c = q[j], e = q[(j + 1) % n], okA = !ok || ok[(i - 1 + n) % n], okE = !ok || ok[j];
    const c1 = okA ? [b[0] + (c[0] - a[0]) / 6, b[1] + (c[1] - a[1]) / 6] : b, c2 = okE ? [c[0] - (e[0] - b[0]) / 6, c[1] - (e[1] - b[1]) / 6] : c;
    if (!pen) { d += 'M' + xy(b); pen = true; } d += `C${xy(c1)} ${xy(c2)} ${xy(c)}`;
  }
  return d;
}
/* wheel: {hub, axis, tyre:[pts]|null, rim:[pts], rimOk, spoke:[bool], ang} */
function makeWheel(c, R, ang, axis = [0, 0, 1], e1 = [1, 0, 0], e2 = [0, 1, 0]) {
  const tyre = [], rim = []; for (let i = 0; i < NSP; i++) { const a = ang + i / NSP * TAU, d = add(mul(e1, cos(a)), mul(e2, sin(a))); tyre.push(mad(c, d, R - .019)); rim.push(mad(c, d, R - .045)); }
  return { hub: c, axis, tyre, rim, rimOk: null, tyreOk: null, spoke: null, ang, e1, e2 };
}
function wheelSVG(cam, w, o = {}) {
  let s = ''; const vd = cam.vd(w.hub), P = w.tyre && w.tyre.map(dP).map(cam.p), Rm = w.rim.map(dP).map(cam.p), hc = cam.p(dP(w.hub)), sc = hc[3]; if (hc[2] < .15 && !cam.ortho) return '';
  const lit = k => hex(shade(mul(BCOL.tyre, k), norm(add(mul(cam.u, .6), mul(vd, .7))), vd, w.hub, .05));
  /* spokes: 3-cross tangent lacing */
  const e1 = w.e1, e2 = w.e2; let far = '', near = '', fs = '', ns = '';
  for (let i = 0; i < NSP; i++) {
    if (w.spoke && !w.spoke[i]) continue; const sd = i % 2 ? 1 : -1, tw = (floor(i / 2) % 2 ? 1 : -1) * 1.15, a = w.ang + i / NSP * TAU + tw, hP = add(add(w.hub, mul(w.axis, sd * .03)), add(mul(e1, cos(a) * .024), mul(e2, sin(a) * .024)));
    const q = cam.p(dP(hP)), r = Rm[i], d = `M${xy(q)}L${xy(r)}`; if (sd > 0) near += d; else far += d; ns += `M${xy(r)}l${n1((q[0] - r[0]) * .06)},${n1((q[1] - r[1]) * .06)}`;
  }
  const sw = mx(.45, .0034 * sc); s += `<path d="${far}" stroke="${hex(shade(mul(BCOL.steel, .6), cam.u, vd, w.hub))}" stroke-width="${n2(sw)}" fill="none"/>`;
  const dR = ringPath(Rm, 1, w.rimOk);
  if (P) { const dT = ringPath(P, 1, w.tyreOk), tw = .038 * sc; s += `<path d="${dT}" fill="none" stroke="${lit(.35)}" stroke-width="${n2(tw + mx(.8, tw * .1))}" stroke-linejoin="round"/><path d="${dT}" fill="none" stroke="${lit(1.15)}" stroke-width="${n2(tw)}" stroke-linejoin="round"/><path d="${dT}" fill="none" stroke="${lit(.7)}" stroke-width="${n2(tw * .86)}" stroke-dasharray="${n1(tw * .22)} ${n1(tw * .2)}" stroke-opacity=".6"/><path d="${dT}" fill="none" stroke="${lit(1.1)}" stroke-width="${n2(tw * .6)}"/><path d="${dT}" fill="none" stroke="${lit(4.2)}" stroke-width="${n2(tw * .2)}" stroke-opacity=".7"/>`; }
  const rl = k => hex(shade(mul(BCOL.rim, k), norm(add(mul(cam.u, .5), mul(vd, .8))), vd, w.hub, .2, 12));
  s += `<path d="${dR}" fill="none" stroke="${rl(.3)}" stroke-width="${n2(mx(1, .021 * sc))}"/><path d="${dR}" fill="none" stroke="${rl(.95)}" stroke-width="${n2(mx(.8, .016 * sc))}"/><path d="${dR}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="${n2(mx(.4, .004 * sc))}"/>`;
  s += `<path d="${ns}" stroke="#e9c46a" stroke-width="${n2(sw * 2)}" fill="none"/>`;
  /* hub */
  const ax = w.axis; s += tube(cam, [mad(w.hub, ax, -.045), mad(w.hub, ax, .045)], .019, BCOL.steel);
  s += `<path d="${near}" stroke="${hex(shade(BCOL.steel, cam.u, vd, w.hub, .2))}" stroke-width="${n2(sw)}" fill="none"/>`;
  /* spoke reflectors + valve */
  if (!o.noRef) for (const k of [3, 17]) { if (w.spoke && !w.spoke[k]) continue; const a = cam.p(dP(mix3(w.hub, w.rim[k], .62))), b = cam.p(dP(mix3(w.hub, w.rim[k], .82))); s += `<path d="M${xy(a)}L${xy(b)}" stroke="#5a2a00" stroke-width="${n2(.034 * sc)}" stroke-linecap="round"/><path d="M${xy(a)}L${xy(b)}" stroke="${hex(shade(BCOL.amber, vd, vd, w.hub, .3))}" stroke-width="${n2(.026 * sc)}" stroke-linecap="round"/>`; }
  s += fiducial(cam, mad(w.hub, ax, .047 * (dot(ax, vd) > 0 ? 1 : -1)), mul(ax, dot(ax, vd) > 0 ? 1 : -1), .03, w.ang * .0 + .78);
  return s;
}
function chainringSVG(cam, b) {
  const c = add(b.BB, [0, 0, .062]), th = b.th, N = 32, e = (r, a, z = 0) => cam.p(dP(add(c, [cos(a) * r, sin(a) * r, z]))); let d = '';
  for (let i = 0; i < N; i++) { const a = th + i / N * TAU; d += (i ? 'L' : 'M') + xy(e(.083, a)) + 'L' + xy(e(.09, a + .06)) + 'L' + xy(e(.09, a + .12)) + 'L' + xy(e(.083, a + .17)); }
  let hole = ''; for (let k = 0; k < 5; k++) { const a0 = th + k / 5 * TAU + .16, a1 = th + (k + 1) / 5 * TAU - .16; hole += 'M'; for (let i = 0; i <= 5; i++) hole += (i ? 'L' : '') + xy(e(.07, lerp(a0, a1, i / 5))); for (let i = 5; i >= 0; i--) hole += 'L' + xy(e(.032, lerp(a0 + .12, a1 - .12, i / 5))); hole += 'Z'; }
  const st = hex(shade(BCOL.steel, [0, .3, .95], cam.vd(c), c, .3)), dk = hex(mul(shade(BCOL.steel, [0, 0, 1], cam.vd(c), c), .3));
  return `<path d="${d}Z${hole}" fill="${st}" fill-rule="evenodd" stroke="${dk}" stroke-width=".9"/>`;
}
function chainSVG(cam, b) {
  const R1 = .086, R2 = .034, c1 = add(b.BB, [0, 0, .062]), c2 = add(b.RA, [0, 0, .062]), pts = []; const ang = atan2(c1[1] - c2[1], c1[0] - c2[0]);
  for (let i = 0; i <= 8; i++) { const a = ang - PI / 2 + i / 8 * PI; pts.push(add(c1, [cos(a) * R1, sin(a) * R1, 0])); }
  const slack = b.chainSlack || 0; for (let i = 1; i < 6; i++) { const k = i / 6; pts.push(add(mix3(add(c1, [cos(ang + PI / 2) * R1, sin(ang + PI / 2) * R1, 0]), add(c2, [cos(ang + PI / 2) * R2, sin(ang + PI / 2) * R2, 0]), k), [0, slack * .012 * sin(k * PI * 3 + (b.time || 0) * 60) * sin(k * PI), 0])); }
  for (let i = 0; i <= 6; i++) { const a = ang + PI / 2 + i / 6 * PI; pts.push(add(c2, [cos(a) * R2, sin(a) * R2, 0])); }
  for (let i = 1; i < 6; i++) { const k = i / 6; pts.push(add(mix3(add(c2, [cos(ang - PI / 2) * R2, sin(ang - PI / 2) * R2, 0]), add(c1, [cos(ang - PI / 2) * R1, sin(ang - PI / 2) * R1, 0]), k), [0, -.012 * sin(k * PI), 0])); }
  const q = pts.map(dP).map(cam.p), sc = q[0][3], d = 'M' + q.map(xy).join('L') + 'Z', off = n1(-b.th * R1 * sc);
  const l = .0127 * sc; return `<path d="${d}" fill="none" stroke="#15161a" stroke-width="${n2(.0125 * sc)}"/><path d="${d}" fill="none" stroke="#8f979f" stroke-width="${n2(.0105 * sc)}" stroke-dasharray="${n2(l * .62)} ${n2(l * .38)}" stroke-dashoffset="${off}"/><path d="${d}" fill="none" stroke="#e6ebf0" stroke-width="${n2(.0032 * sc)}" stroke-dasharray="${n2(l * .3)} ${n2(l * .7)}" stroke-dashoffset="${n1(off - l * .15)}"/>`;
}
function crankSVG(cam, b, sd) {
  const a = sd > 0 ? b.th : b.th + PI, c = add(b.BB, [0, 0, sd * .075]), e = add(c, [cos(a) * G.CR, sin(a) * G.CR, sd * .015]), pd = add(b.BB, [cos(a) * G.CR, sin(a) * G.CR, sd * .125]);
  let s = tube(cam, [c, e], .0125, BCOL.steel) + tube(cam, [e, add(pd, [0, 0, sd * .04])], .006, BCOL.steel);
  const L = .05, hs = []; for (const x of [-1, 1]) for (const z of [-1, 1]) hs.push(add(pd, [x * L, 0, z * .038]));
  s += tube(cam, [hs[0], hs[1]], .011, BCOL.dark) + tube(cam, [hs[2], hs[3]], .011, BCOL.dark) + tube(cam, [hs[0], hs[2]], .009, BCOL.dark) + tube(cam, [hs[1], hs[3]], .009, BCOL.dark);
  s += tube(cam, [add(hs[sd > 0 ? 1 : 0], [.02, 0, 0]), add(hs[sd > 0 ? 3 : 2], [-.02, 0, 0])], .007, BCOL.amber);
  return s;
}
function saddleSVG(cam, p, tilt = 0) {
  const c = cos(tilt), s = sin(tilt), q = (x, y, z) => add(p, [x * c - y * s, x * s + y * c, z]); const grid = [];
  for (const [x, w, y, h] of [[-.125, .03, .0, .012], [-.11, .075, .006, .03], [-.06, .085, .004, .036], [0, .06, .0, .032], [.07, .03, -.002, .028], [.13, .018, -.004, .022], [.145, .006, -.008, .01]]) { const r = []; for (let j = 0; j < 12; j++) { const a = j / 12 * TAU; r.push({ P: dP(q(x, y + cos(a) * h * (cos(a) > 0 ? .55 : .9), sin(a) * w)), N: norm([0, cos(a) / h, sin(a) / w]), col: BCOL.leather }); } grid.push(r); }
  return emitQuads(meshQuads(cam, grid, { closed: 1, spec: .4, gloss: 22 }), .8) + tube(cam, [q(-.08, -.03, .025), q(.07, -.028, .015)], .005, BCOL.steel);
}
function barSVG(cam, b, sd) {
  const B = b.BAR, e = b.barBend || 0, pts = [[0, 0, 0], [.02, .008, .07], [.03, .012, .15], [.026, .012, .2], [.01, .008, .255]].map(p => add(B, [p[0] + e * p[2] * 1.5 * (1 + sd * .4), p[1] + abs(e) * p[2] * .6 * sd, p[2] * sd]));
  let s = tube(cam, pts, .0115, BCOL.steel, { smooth: 1 }) + tube(cam, pts.slice(2), .0165, BCOL.dark, { smooth: 1 });
  s += tube(cam, [mad(pts[2], [0, 0, sd], -.01), add(pts[3], [.05, -.02, sd * .02])], .005, BCOL.steel);
  if (sd > 0 && !b.noBell) { const c = add(pts[1], [.005, .026, .01]); s += domeSVG(cam, c); }
  return s;
}
function domeSVG(cam, c, r = .027, axis = [0, 1, 0]) {
  const grid = []; let a1 = norm(cross(axis, abs(axis[0]) > .9 ? [0, 1, 0] : [1, 0, 0])); const a2 = cross(axis, a1);
  for (let i = 0; i <= 6; i++) { const p = i / 6 * PI / 2, ring = []; for (let j = 0; j < 14; j++) { const a = j / 14 * TAU, N = add(mul(axis, cos(p)), mul(add(mul(a1, cos(a)), mul(a2, sin(a))), sin(p))); ring.push({ P: mad(c, N, r), N, col: BCOL.brass }); } grid.push(ring); }
  const q = cam.p(mad(c, axis, r * .6)); return emitQuads(meshQuads(cam, grid, { closed: 1, spec: 1.2, gloss: 30, both: 1 }), .7) + `<circle cx="${n1(q[0] - r * q[3] * .25)}" cy="${n1(q[1] - r * q[3] * .3)}" r="${n1(r * q[3] * .18)}" fill="#fff" opacity=".85"/>`;
}
function bikeParts(cam, b, o = {}) {
  const parts = [], z = zctr(cam, o.zc || b.zc || mix3(b.BB, b.HT, .4)), add_ = (P, s, bias = 0, k = '') => parts.push({ z: z(P) - bias, s, k });
  if (b.wR) add_(b.wR.hub, wheelSVG(cam, b.wR), -.02, 'wR'); if (b.wF) add_(b.wF.hub, wheelSVG(cam, b.wF), -.02, 'wF');
  for (const p of b.loose || []) add_(p.P, p.s(cam), 0);
  if (b.gone) return parts;
  const M = b.m || {}, F = BCOL.frame, t = (a, m, c, r, col = F, dz = 0) => tube(cam, [add(a, [0, 0, dz]), ...(m ? [add(m, [0, 0, dz])] : []), add(c, [0, 0, dz])], r, col, { smooth: !!m });
  const ax = b.axz || 1;
  /* far-side stays, frame, near-side stays */
  add_(mix3(b.BB, b.RA, .5), t(b.BB, M.CS, b.RA, .0105, F, -.035) + t(b.ST, M.SS, b.RA, .009, F, -.035), .0);
  let fr = t(b.ST, M.TT, b.HT, .0165) + t(b.BB, M.DT, b.HB, .0195) + t(b.BB, M.SM, b.ST, .0165) + tube(cam, [b.ST, b.SAD], .0125, BCOL.steel) + tube(cam, [b.HT, b.HB], .022, F) + tube(cam, [b.HT, b.STEM, b.BAR], .0125, BCOL.steel);
  fr += tube(cam, [mix3(b.HT, b.HB, .0), mix3(b.HT, b.HB, .12)], .025, BCOL.steel) + tube(cam, [mix3(b.HT, b.HB, .9), b.HB], .025, BCOL.steel);
  if (!o.noText) { const a = M.DT ? mix3(b.BB, M.DT, .35) : mix3(b.BB, b.HB, .3), c = M.DT || b.HB, d = norm(sub(c, a)), n = [-d[1], d[0], 0]; if (cam.f[2] < -.5) fr += text3(cam, add(a, add(mul(n, -.009), [0, 0, .02])), mul(d, .03), mul(n, .03), 'PKZ-047 PELIKAN', '#fff', 'font-family="Bahnschrift,DIN Alternate,Arial" font-weight="700" letter-spacing="6" opacity=".92"'); }
  add_(mix3(b.BB, b.HT, .5), fr, .012, 'frame');
  for (const sd of [-1, 1]) add_(add(mix3(b.HB, b.FA, .5), [0, 0, sd * .03]), t(b.HB, M.FK, b.FA, .0115, F, sd * .045), .0, 'fork');
  add_(add(mix3(b.BB, b.RA, .5), [0, 0, .03]), t(b.BB, M.CS, b.RA, .0105, F, .035) + t(b.ST, M.SS, b.RA, .009, F, .035), .0);
  if (!b.noSaddle) add_(b.SAD, saddleSVG(cam, b.SAD, b.sadTilt || 0), .01, 'saddle');
  for (const sd of [-1, 1]) if (!b.noBar) add_(add(b.BAR, [0, 0, sd * .15]), barSVG(cam, b, sd), .0, 'bar' + sd);
  /* drivetrain */
  if (!b.noChain) add_(add(b.BB, [0, 0, .062]), chainSVG(cam, b), .0);
  const cog = add(b.RA, [0, 0, .062]); let cd = ''; for (let i = 0; i < 28; i++) { const a = -(b.wa || 0) + i / 28 * TAU, r = i % 2 ? .034 : .028, q = cam.p(dP(add(cog, [cos(a) * r, sin(a) * r, 0]))); cd += (i ? 'L' : 'M') + xy(q); }
  add_(cog, `<path d="${cd}Z" fill="${hex(shade(BCOL.steel, [0, .3, .9], cam.vd(cog), cog, .2))}" stroke="#222" stroke-width=".8"/>`, 0);
  add_(add(b.BB, [0, 0, .07]), chainringSVG(cam, b), .0, 'ring');
  add_(add(b.BB, [0, 0, .09]), crankSVG(cam, b, 1), .0, 'crank1'); add_(add(b.BB, [0, 0, -.09]), crankSVG(cam, b, -1), .0, 'crank-1');
  /* mudguard, rack with data recorder, lamps */
  if (!b.noRack) {
    const rk = add(mix3(b.ST, b.SAD, .1), [0, 0, 0]), back = norm(sub(b.RA, b.BB)), bk = [back[0], 0, 0], e = add(rk, add(mul(bk, .34), [0, -.01, 0]));
    let s = tube(cam, [rk, e], .007, BCOL.dark) + tube(cam, [mix3(rk, e, .8), b.RA], .006, BCOL.dark);
    const c = mix3(rk, e, .62); s += box(cam, add(c, [-.085, .008, -.06]), add(c, [.085, .085, .06]), '#f08a1c', { stroke: '#4a2204', sw: .7 });
    if (cam.f[2] < 0) { s += text3(cam, add(c, [-.072, .048, .061]), [.02, 0, 0], [0, .02, 0], 'DATENREKORDER', '#231', 'font-family="Bahnschrift,Arial" font-weight="700"') + text3(cam, add(c, [-.072, .024, .061]), [.015, 0, 0], [0, .015, 0], 'NICHT ÖFFNEN · 10 kHz', '#231', 'font-family="Bahnschrift,Arial"'); const l = cam.p(add(c, [.066, .066, .061])); s += `<circle cx="${n1(l[0])}" cy="${n1(l[1])}" r="${n1(.006 * l[3])}" fill="${((b.time || 0) * 4 % 1) < .5 ? '#2bff6a' : '#0a4a1e'}"/>`; }
    const rf = cam.p(add(e, [-.01, -.01, 0])); s += `<rect x="${n1(rf[0] - .012 * rf[3])}" y="${n1(rf[1] - .02 * rf[3])}" width="${n1(.024 * rf[3])}" height="${n1(.04 * rf[3])}" rx="${n1(.006 * rf[3])}" fill="#ff2a2a" stroke="#5a0000" stroke-width=".7"/>` + glow(rf[0], rf[1], .12 * rf[3], '#ff2a2a', .5);
    add_(mix3(rk, e, .5), s, .0, 'rack');
  }
  if (!b.noLamp) { const l = add(mix3(b.HT, b.HB, .35), [.065, 0, 0]), q = cam.p(dP(l)); parts.push({ z: z(l) - .01, s: tube(cam, [mix3(b.HT, b.HB, .35), l], .009, BCOL.dark) + tube(cam, [l, add(l, [.04, 0, 0])], .03, BCOL.dark, { cap: 'butt' }) + `<circle cx="${n1(q[0] + .04 * q[3] * cam.r[0])}" cy="${n1(q[1])}" r="${n1(.022 * q[3])}" fill="#fffbe0"/>` + glow(q[0] + .045 * q[3] * cam.r[0], q[1], .2 * q[3], '#fff2c0', .8) }); }
  return parts;
}
function rideBike(t, o = {}) {
  const bx = o.bx ?? bikeX(t), T_ = P => [P[0] + bx, P[1], P[2]], wa = o.wa ?? wheelAng(t), th = o.th ?? crankAng(t), b = { time: t, th, wa, chainSlack: (o.v ?? vel(t)) / VMAX };
  for (const k of ['RA', 'FA', 'BB', 'ST', 'HT', 'HB', 'SAD', 'STEM', 'BAR']) b[k] = T_(G[k]);
  b.wF = makeWheel(b.FA, G.R, wa); b.wR = makeWheel(b.RA, G.R, wa + .4); return b;
}
function emitParts(parts) { parts.sort((a, b) => b.z - a.z); return parts.map(p => p.s).join(''); }
