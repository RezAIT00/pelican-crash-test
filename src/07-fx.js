/* ============================================================ particles: closed-form, so any frame can be rendered in isolation */
function drag(p, v, k, s) { const e = (1 - exp(-k * s)) / k; return [p[0] + v[0] * e, p[1] + v[1] * e, p[2] + v[2] * e]; }
/* ---- loose feathers */
const FEATH = (() => {
  const R = rng(1234), out = [];
  for (let i = 0; i < 470; i++) {
    const k = R(), t0 = k < .12 ? lerp(.008, .022, R()) : lerp(.024, .085, pow(R(), 1.15)), a = SIM.at(t0), u = lerp(.4, 6.8, pow(R(), .8)), j = floor(u), p = mix3(a('s' + j), a('s' + mn(7, j + 1)), u - j);
    const ph = R() * TAU, rad = lerp(.16, .06, ss(3, 6, u)), off = [(R() - .7) * .14, cos(ph) * rad, sin(ph) * rad]; const sp = lerp(2.5, 17, pow(R(), 1.5)), d = norm([-.25 - 1.1 * R(), (R() - .36) * 1.5, (R() - .5) * 2.6]);
    const ty = R(), kind = ty < .58 ? 0 : ty < .8 ? 1 : ty < .93 ? 2 : 3; /* contour, down, remex, covert */
    out.push({ t0, p: add(p, off), v: mul(d, sp), k: lerp(9, 22, R()), kind, L: [lerp(.05, .085, R()), lerp(.03, .05, R()), lerp(.2, .3, R()), lerp(.08, .12, R())][kind], ax: norm([R() - .5, R() - .5, R() - .5]), w: lerp(25, 120, R()) * (R() < .5 ? -1 : 1), a0: R() * TAU, s: R(), fall: lerp(.35, .8, R()), sw: lerp(.04, .16, R()), f: lerp(3.5, 8, R()) });
  }
  return out;
})();
function featherAt(f, tau) {
  const s = tau - f.t0; if (s <= 0) return null; let P = drag(f.p, f.v, f.k, s); const late = 1 - exp(-3 * s); P = add(P, [late * f.sw * sin(s * f.f + f.a0), -f.fall * mx(0, s - (1 - exp(-5 * s)) / 5) + .03 * late * sin(s * f.f * 2), late * f.sw * cos(s * f.f * .8 + f.s * 9)]);
  if (P[0] > -.015) P[0] = -.015 - .01 * f.s; const gr = P[1] < .012; if (gr) P[1] = .012 + .01 * f.s;
  const ang = f.a0 + f.w * (1 - exp(-6 * s)) / 6 + (gr ? 0 : .6 * sin(s * f.f)); let d = rotAxis(norm(cross(f.ax, [.3, .5, .8])), f.ax, ang), n = f.ax; if (gr) { d = norm([d[0], 0, d[2]]); n = [0, 1, 0]; } else if (s > .25) { n = norm(mix3(n, [0.2, 1, .2], ss(.25, .6, s) * .7)); d = norm(sub(d, mul(n, dot(d, n)))); }
  return { P, d, n, gr };
}
function plumule(cam, P, d, n, L, base) { /* down feather: a spray of barbules */
  const w = cross(n, d), o = cam.p(P), sc = o[3]; if (L * sc < 2) return ''; const col = hex(shade(base, norm(add(cam.u, mul(cam.vd(P), .6))), cam.vd(P), P, 0, 1, .4)); let p = '';
  for (let i = 0; i < 13; i++) { const a = (i / 12 - .5) * 2.5, l = L * (1 - abs(a) * .16), e = cam.p(add(P, add(mul(d, cos(a) * l), mul(w, sin(a) * l)))), m = cam.p(add(P, add(mul(d, cos(a * .6) * l * .6), mul(w, sin(a * .6) * l * .6 + (i % 2 ? .1 : -.1) * l)))); p += `M${xy(o)}Q${xy(m)} ${xy(e)}`; }
  return `<path d="${p}" fill="none" stroke="${col}" stroke-width="${n2(mx(.5, L * sc * .055))}" stroke-linecap="round" opacity=".92"/>`;
}
function looseFeathers(cam, tau, o = {}) { /* -> depth keyed items */
  const it = [], tint = [PAL.white, PAL.white, PAL.flight, mix3(PAL.white, PAL.grey, .5)];
  for (let i = 0; i < FEATH.length; i++) { const f = FEATH[i]; if (o.every && i % o.every) continue; const q = featherAt(f, tau); if (!q) continue; const z = cam.depth(q.P); if (z < .18) continue; const N = q.n; let s; const grow = clamp((tau - f.t0) * 260);
    if (f.kind === 1) s = plumule(cam, q.P, q.d, N, f.L * grow, PAL.white); else { const w = cross(N, q.d); s = feather(cam, q.P, mul(q.d, f.L * grow), mul(w, f.L * grow * (f.kind === 2 ? .2 : .52)), N, tint[f.kind], f.kind === 2 ? 'flight' : 'body', f.kind === 2 ? { root: 1.2, tip: .9, edge: 1.8, rach: '#8f8a86', spec: .2 } : { root: .7, tip: 1.1 }); if (s && f.kind !== 2) { const p0 = cam.p(mad(q.P, q.d, -f.L * .16 * grow)), p1 = cam.p(q.P); s += `<path d="M${xy(p0)}L${xy(p1)}" stroke="#d8cdb8" stroke-width="${n2(mx(.5, .0025 * p1[3]))}"/>`; } }
    if (s) it.push({ z, s }); }
  return it;
}
/* ---- concrete chunks */
const CHUNKS = (() => { const R = rng(77), out = []; for (let i = 0; i < 110; i++) { const big = i < 9, t0 = big ? lerp(.03, .06, R()) : lerp(.004, .06, pow(R(), .7)), a = R() * TAU, r = sqrt(R()) * .42; const v = []; for (let k = 0; k < 6; k++) v.push(lerp(.6, 1.15, R())); out.push({ t0, p: [-.01, CRACK0[1] + sin(a) * r, cos(a) * r], v: [-lerp(1.5, 13, pow(R(), 1.6)), sin(a) * lerp(.5, 6, R()) + 1.2, cos(a) * lerp(.5, 6.5, R())], r: big ? lerp(.035, .065, R()) : lerp(.008, .036, pow(R(), 1.6)), v6: v, ax: norm([R() - .5, R() - .5, R() - .5]), w: lerp(10, 60, R()), c: R() }); } return out; })();
function bounce(p, v, s, g, e, r) { let P = p.slice(), V = v.slice(), left = s; for (let k = 0; k < 4; k++) { const disc = V[1] * V[1] + 2 * g * mx(0, P[1] - r), tf = (V[1] + sqrt(disc)) / g; if (left <= tf) return [P[0] + V[0] * left, mx(r, P[1] + V[1] * left - g * left * left / 2), P[2] + V[2] * left, k]; P = [P[0] + V[0] * tf, r, P[2] + V[2] * tf]; V = [V[0] * .55, -(V[1] - g * tf) * e, V[2] * .55]; left -= tf; if (V[1] < .25) break; } const c = (1 - exp(-4 * left)) / 4; return [P[0] + V[0] * c, r, P[2] + V[2] * c, 5]; }
function chunkSVG(cam, P, r, v6, ax, ang, col) {
  const V = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].map((d, i) => add(P, mul(rotAxis(d, ax, ang), r * v6[i]))); let s = '';
  for (const [a, b, c] of [[0, 2, 4], [2, 1, 4], [1, 3, 4], [3, 0, 4], [2, 0, 5], [1, 2, 5], [3, 1, 5], [0, 3, 5]]) { const N = norm(cross(sub(V[b], V[a]), sub(V[c], V[a]))), vd = cam.vd(V[a]); if (dot(N, vd) <= 0) continue; const h = hex(shade(col, N, vd, P)); s += `<path d="M${xy(cam.p(V[a]))}L${xy(cam.p(V[b]))}L${xy(cam.p(V[c]))}Z" fill="${h}" stroke="${h}" stroke-width=".5"/>`; }
  return s;
}
function chunks(cam, tau) { const it = [], A = C('#b9b5ab'), B = C('#8c8880'); for (const c of CHUNKS) { const s = tau - c.t0; if (s <= 0) continue; const P = bounce(c.p, c.v, s, 9.81, .32, c.r * .7), z = cam.depth(P); if (z < .15) continue; const q = cam.p(P); if (q[0] < -150 || q[0] > 2070) continue; it.push({ z, s: chunkSVG(cam, P, c.r, c.v6, c.ax, c.w * (P[3] >= 5 ? .4 : mn(s, .45)), mix3(A, B, c.c)) }); } return it; }
/* ---- broken spokes */
const SPK = SIM.ev.filter(e => e.type === 'spoke').map((e, i) => ({ t0: e.tau, a: e.p, b: e.hub, v: add(mul(e.v, .25), [-2.5 - 5 * hash(i, 1), 1 + 5 * (hash(i, 2) - .3), (hash(i, 3) - .5) * 12]), ax: norm([hash(i, 4) - .5, hash(i, 5) - .5, hash(i, 6) - .5]), w: (hash(i, 7) - .5) * 160, bend: (hash(i, 8) - .5) * .12 }));
function spokes(cam, tau) { const it = []; for (const k of SPK) { const s = tau - k.t0; if (s <= 0) continue; const c0 = mix3(k.a, k.b, .5), c = bounce(c0, k.v, s, 9.81, .3, .006), sp = (1 - exp(-3 * s)) / 3, d = rotAxis(mul(sub(k.b, k.a), .5), k.ax, k.w * (c[3] >= 5 ? .2 : sp)); if (c[3] >= 1) d[1] *= .1; const n = mul(k.ax, k.bend), P = c.slice(0, 3), z = cam.depth(P); if (z < .15) continue; it.push({ z, s: pline(cam, [sub(P, d), add(P, n), add(P, d)], hex(shade(BCOL.steel, norm(add(cam.u, cam.vd(P))), cam.vd(P), P, .3)), .0034, '', .7) }); } return it; }
/* ---- sparks */
const SPARK = (() => { const R = rng(31), o = []; for (let i = 0; i < 130; i++) { const src = R() < .55 ? { t: lerp(.012, .046, R()), p: [-.03, .32 + (R() - .5) * .3, (R() - .5) * .1] } : { t: lerp(.036, .075, R()), p: [-.04, .75 + (R() - .5) * .5, (R() - .5) * .2] }; o.push({ t0: src.t, p: src.p, v: [-lerp(2, 16, R()), (R() - .35) * 14, (R() - .5) * 15], life: lerp(.01, .05, R()) }); } return o; })();
function sparks(cam, tau) { let s = ''; for (const k of SPARK) { const a = tau - k.t0; if (a <= 0 || a > k.life) continue; const f = t => { const P = drag(k.p, k.v, 6, t); P[1] = mx(.01, P[1] - 4.9 * t * t); P[0] = mn(P[0], -.005); return P; }; const P = f(a), Q = f(mx(0, a - .0035)), p = cam.p(P), q = cam.p(Q), o = 1 - a / k.life; s += `<path d="M${xy(q)}L${xy(p)}" stroke="${o > .6 ? '#fff7d8' : '#ffb13a'}" stroke-width="${n2(mx(.8, .006 * p[3] * o + .6))}" stroke-linecap="round" opacity="${n2(.3 + .7 * o)}"/>`; } return s ? `<g style="mix-blend-mode:screen">${s}</g>` : ''; }
/* ---- concrete dust */
const DUST = (() => { const R = rng(8), o = []; for (let i = 0; i < 300; i++) { const a = R() * TAU, t0 = lerp(.002, .07, pow(R(), .9)), late = t0 > .026, low = R() < .25; o.push({ t0, p: [-.03, low ? lerp(.05, .5, R()) : CRACK0[1] + sin(a) * .25 * R(), cos(a) * .3 * R()], v: [-lerp(1, late ? 12 : 8, R()), sin(a) * lerp(1, 9, R()) + (low ? 1.5 : 0), cos(a) * lerp(1, 9, R())], k: lerp(7, 13, R()), r: lerp(.12, .3, R()), g: lerp(.22, .55, R()), s: R(), al: lerp(.2, .55, R()), rise: lerp(.02, .3, R()) }); } return o; })();
function dust(cam, tau, o = {}) {
  const it = [], lit = shade(C('#cfc8ba'), norm([-.2, 1, .4]), null, [-.5, 1, 0]), drk = shade(C('#8f877a'), [0, -.5, .5], null, [-.5, 1, 0]); const gL = radG([[0, hex(lit), .9], [.45, hex(mix3(lit, drk, .4)), .5], [.8, hex(drk), .14], [1, hex(drk), 0]], 'cx=".44" cy=".36" fx=".4" fy=".28"');
  for (const d of DUST) { const s = tau - d.t0; if (s <= 0) continue; const P = drag(d.p, d.v, d.k, s); P[1] = mx(.06, P[1] + d.rise * s * .5 - .12 * s); P[0] = mn(P[0], -.02); const z = cam.depth(P); if (z < .25) continue; const r = (d.r * .25 + d.g * (1 - exp(-9 * s)) + d.g * .5 * mn(s, 1.2)) * (o.size || 1), front = o.subjZ != null ? lerp(o.front ?? .25, 1, ss(-.1, .25, z - o.subjZ)) : 1, al = d.al * clamp(s * 130) * (1 - .9 * ss(.06, .7, s)) * (o.op ?? 1) * clamp((z - .25) * 1.5) * front, q = cam.p(P), R = r * q[3]; if (q[0] < -R || q[0] > 1920 + R || R < 1) continue;
    let sv = ''; for (let k = 0; k < 3; k++) { const a = d.s * 9 + k * 2.1 + s * (d.s - .5) * 3; sv += `<circle cx="${n1(q[0] + cos(a) * R * .42)}" cy="${n1(q[1] + sin(a) * R * .34)}" r="${n1(R * lerp(.6, .9, hash(k, d.s * 999)))}" fill="${gL}"/>`; } it.push({ z, s: `<g opacity="${n2(al)}">${sv}</g>` }); }
  return it;
}
/* ---- pressure fronts */
function shock(cam, tau, c, t0, o = {}) {
  const s = tau - t0; if (s <= 0 || s > .02) return ''; const r = 343 * s * (o.k || .55), q = cam.p(c), R = r * q[3], al = (1 - s / .02) * (o.op ?? 1); let sv = '';
  sv += `<circle cx="${n1(q[0])}" cy="${n1(q[1])}" r="${n1(R)}" fill="none" stroke="#eaf6ff" stroke-width="${n1(5 + R * .03)}" opacity="${n2(al * .55)}"/><circle cx="${n1(q[0])}" cy="${n1(q[1])}" r="${n1(R * .95)}" fill="none" stroke="#7fb9e6" stroke-width="${n1(10 + R * .07)}" opacity="${n2(al * .22)}"/><circle cx="${n1(q[0])}" cy="${n1(q[1])}" r="${n1(R * .84)}" fill="none" stroke="#ffffff" stroke-width="${n1(1.5 + R * .006)}" opacity="${n2(al * .35)}"/>`;
  const fr = sqrt(mx(0, r * r - c[1] * c[1])); if (fr > 0) { let d = ''; for (let i = 0; i <= 40; i++) { const a = i / 40 * TAU; const P = [mn(0, c[0] + cos(a) * fr), .01, c[2] + sin(a) * fr]; const p = cam.p(P); if (p[2] < .3) continue; d += (d ? 'L' : 'M') + xy(p); } if (d) sv += `<path d="${d}" fill="none" stroke="#f5fbff" stroke-width="${n1(8)}" opacity="${n2(al * .4)}"/>`; }
  return `<g style="mix-blend-mode:screen">${sv}</g>`;
}
/* everything that belongs to the crash, depth-sorted with the subject */
function crashScene(cam, tau, o = {}) {
  const pose = o.pose || simPose(tau), bike = simBike(tau); DEF = tau < SIM.TREL + .02 ? wallSquash(mix3(pose.spine[2], pose.spine[4], .5)) : null;
  const parts = [...bikeParts(cam, bike), ...pelicanParts(cam, pose)]; DEF = null;
  if (o.fx !== false) parts.push(...looseFeathers(cam, tau, o), ...chunks(cam, tau), ...spokes(cam, tau)); if (o.dust !== false) parts.push(...dust(cam, tau, { subjZ: cam.depth(mix3(pose.spine[1], pose.spine[4], .5)), ...o }));
  parts.sort((a, b) => b.z - a.z);
  if (!o.dof) return parts.map(p => p.s).join('') + (o.fx !== false ? sparks(cam, tau) : '');
  const f = o.dof, far = [], foc = [], near = []; for (const p of parts) (p.z > f.z + f.far ? far : p.z < f.z - f.near ? near : foc).push(p.s);
  return (far.length ? `<g ${blurFull(f.b || 2.5)}>${far.join('')}</g>` : '') + foc.join('') + sparks(cam, tau) + (near.length ? `<g ${blurFull(f.bn || 5)}>${near.join('')}</g>` : '');
}
