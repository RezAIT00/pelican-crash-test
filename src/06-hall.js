/* ============================================================ the crash hall */
const HALL = { x0: -76, x1: 9, z: 8, h: 8.2, wallZ: 1.5, wallH: 2.55, wallT: 1.4 };
const FONT = 'font-family="Bahnschrift,DIN Alternate,DIN Condensed,Roboto Condensed,Arial Narrow,sans-serif"';
const MONO = 'font-family="Cascadia Mono,Consolas,DejaVu Sans Mono,monospace"';
const LAMPX = []; for (let x = -70; x <= 2; x += 4) LAMPX.push(x);
/* crack network on the barrier face (plane x=0), grown from the impact point */
const CRACK0 = [0, 1.28, 0];
const CRACKS = (() => {
  const R = rng(99), out = [];
  const grow = (y, z, a, L, w, t0, depth) => { const pts = [[y, z]], n = mx(3, ceil(L / .085)); let t = t0, a0 = a; for (let i = 0; i < n; i++) { a = a0 + (R() - .5) * 1.5; a0 += (R() - .5) * .16; y += sin(a) * L / n; z += cos(a) * L / n; t += L / n; pts.push([y, z]); if (depth < 2 && R() < (depth ? .1 : .2) && i > 0) grow(y, z, a0 + (R() < .5 ? -1 : 1) * lerp(.5, 1.1, R()), L * lerp(.2, .42, R()) * (1 - i / n + .3), w * .55, t, depth + 1); if (y < .02 || y > 2.53 || abs(z) > 1.5) break; } out.push({ pts, w, t0, L: t - t0 }); };
  for (let i = 0; i < 17; i++) { const a = (i + R() * .7) / 17 * TAU; grow(CRACK0[1] + sin(a) * .1, sin(a) * 0 + cos(a) * .1, a, lerp(.7, 1.7, R()), .0095, 0, 0); }
  return out;
})();
const CRATER = (() => { const R = rng(5), p = []; for (let i = 0; i < 34; i++) { const a = i / 34 * TAU; p.push([sin(a), cos(a), lerp(.9, 1.06, R()) * (1 + .13 * sin(a * 3 + 1) + .08 * sin(a * 5 + 2))]); } return p; })();
function silhouette() { /* side profile of the whole catastrophe in local (u right, v up) metres, for the imprint */
  const f = (a, b) => [a, b]; return {
    bird: [f(-.64, .95), f(-.46, .99), f(-.3, 1.1), f(-.12, 1.21), f(.06, 1.28), f(.17, 1.34), f(.23, 1.42), f(.27, 1.5), f(.31, 1.545), f(.36, 1.565), f(.43, 1.565), f(.49, 1.535), f(.56, 1.515), f(.8, 1.485), f(1.0, 1.46), f(1.03, 1.43), f(.98, 1.425), f(.85, 1.36), f(.7, 1.33), f(.58, 1.36), f(.5, 1.41), f(.43, 1.4), f(.38, 1.33), f(.33, 1.22), f(.27, 1.1), f(.3, 1.03), f(.42, .97), f(.43, .91), f(.36, .87), f(.12, .84), f(.02, .78), f(-.04, .62), f(.0, .45), f(.06, .33), f(.17, .31), f(.16, .27), f(.02, .27), f(-.06, .4), f(-.12, .58), f(-.13, .72), f(-.2, .8), f(-.36, .82), f(-.5, .88)],
  };
}
const SILH = silhouette();

function barrier(cam, o = {}) {
  const Z = HALL.wallZ, H = HALL.wallH, Tk = HALL.wallT, dm = o.dim ?? 1; let s = '';
  /* steel backing */
  for (const z of [-1.1, 0, 1.1]) s += box(cam, [Tk, 0, z - .09], [Tk + .25, H - .1, z + .09], '#3b4550', { dim: dm }) + line3(cam, [Tk + .25, H * .8, z], [Tk + 2.2, 0, z], hex(mul(shade(C('#46515c'), [0, .5, .5], null, [0, 0, 0]), dm)), .18);
  s += box(cam, [0, 0, -Z], [Tk, H, Z], '#aaa79f', { dim: dm });
  /* near side texture: formwork seams, tie holes, aggregate */
  const sideZ = cam.pos[2] > Z ? Z : cam.pos[2] < -Z ? -Z : null;
  if (sideZ != null) {
    for (const y of [.62, 1.24, 1.86]) s += line3(cam, [0, y, sideZ], [Tk, y, sideZ], '#5d5b56', .012, 'opacity=".6"');
    for (let i = 0; i < 70; i++) { const p = cam.p([hash(i, 21) * Tk, hash(i, 22) * H, sideZ]); s += `<circle cx="${n1(p[0])}" cy="${n1(p[1])}" r="${n1(mx(.5, hash(i, 23) * .016 * p[3]))}" fill="#4a4843" opacity="${n2(.1 + .25 * hash(i, 24))}"/>`; }
    for (let i = 0; i < 7; i++) { const x0 = i * .23; s += poly(cam, [[x0, H - .22, sideZ], [x0 + .115, H - .22, sideZ], [x0 + .23, H, sideZ], [x0 + .115, H, sideZ]].map(p => [mn(p[0], Tk), p[1], p[2]]), i % 1 ? '#111' : '#ffcf00', `opacity="${n2(.85 * dm)}"`); }
    s += text3(cam, [.16, 1.25, sideZ + .002], [.34, 0, 0], [0, .34, 0], '100 t', '#2c2b28', FONT + ' font-weight="700" opacity=".75"') + text3(cam, [.16, 1.02, sideZ + .002], [.115, 0, 0], [0, .115, 0], 'BARRIERE B1 · STARR', '#2c2b28', FONT + ' opacity=".75"');
  }
  if (cam.pos[0] < 0) {
    const c = shade(C('#b4b1a9'), [-1, 0, 0], cam.vd([0, 1.2, 0]), [0, 1.2, 0]); { const q = cam.p([0, 1.3, 0]), q2 = cam.p([0, 0, 0]); s += poly(cam, [[0, 0, -Z], [0, H, -Z], [0, H, Z], [0, 0, Z]], radG([[0, hex(mul(c, 1.22 * dm))], [.55, hex(mul(c, 1.02 * dm))], [1, hex(mul(c, .62 * dm))]], 'cx=".5" cy=".45" r=".75"')); } const face = (pts, fill, ex) => poly(cam, pts.map(p => [0, p[0], p[1]]), fill, ex);
    for (const y of [.62, 1.24, 1.86]) s += line3(cam, [0, y, -Z], [0, y, Z], hex(mul(c, .55 * dm)), .012, 'opacity=".7"'); for (const z of [-.75, 0, .75]) s += line3(cam, [0, 0, z], [0, H, z], hex(mul(c, .6 * dm)), .01, 'opacity=".6"');
    for (let i = 0; i < 120; i++) { const p = cam.p([0, hash(i, 31) * H, (hash(i, 32) * 2 - 1) * Z]); s += `<circle cx="${n1(p[0])}" cy="${n1(p[1])}" r="${n1(mx(.4, hash(i, 33) * .014 * p[3]))}" fill="${hash(i, 34) > .5 ? '#55534d' : '#d4d1c8'}" opacity="${n2(.08 + .22 * hash(i, 35))}"/>`; }
    const nS = 13; for (let i = 0; i < nS; i++) { const z0 = -Z + i / nS * 2 * Z, w = 2 * Z / nS / 2; s += face([[H - .22, z0], [H - .22, z0 + w], [H, mn(Z, z0 + 2 * w)], [H, z0 + w]], '#ffcf00', `opacity="${n2(.9 * dm)}"`); }
    if (!o.noTarget) { /* impact target cross */
      for (const r of [.34, .2]) { let d = ''; for (let i = 0; i <= 40; i++) { const a = i / 40 * TAU, p = cam.p([0, 1.36 + sin(a) * r, cos(a) * r]); d += (i ? 'L' : 'M') + xy(p); } s += `<path d="${d}" fill="none" stroke="#b3201d" stroke-width="${n1(.018 * cam.p([0, 1.36, 0])[3])}" opacity="${n2(.75 * dm)}"/>`; }
      s += line3(cam, [0, 1.36, -.48], [0, 1.36, .48], '#b3201d', .014, `opacity="${n2(.75 * dm)}"`) + line3(cam, [0, .88, 0], [0, 1.84, 0], '#b3201d', .014, `opacity="${n2(.75 * dm)}"`);
    }
    if (o.crack > 0) {
      const g = o.crack, cr = .36 * E.outCubic(g * 1.4);
      if (!o.imprint) {
        s += face(CRATER.map(p => [CRACK0[1] + p[0] * cr * p[2], p[1] * cr * p[2]]), hex(mul(c, .46 * dm))) + face(CRATER.map(p => [CRACK0[1] - .02 + p[0] * cr * p[2] * .8, p[1] * cr * p[2] * .8]), hex(mul(c, .27 * dm)));
        if (g > .3) { for (let i = -2; i <= 2; i++) { const k = sqrt(mx(0, 1 - pow(i / 3, 2))) * cr * .8; s += line3(cam, [0, CRACK0[1] + i * .1, -k], [0, CRACK0[1] + i * .1 + .01 * i, k], '#7a3f22', .02, 'stroke-linecap="round"') + line3(cam, [0, CRACK0[1] - k, i * .1], [0, CRACK0[1] + k, i * .1 + .012], '#8c4b29', .017, 'stroke-linecap="round"'); } }
      }
      const reach = g * 2.1;
      for (const k of CRACKS) {
        const vis = clamp((reach - k.t0) / k.L); if (vis <= 0) continue; const n = k.pts.length - 1, m = vis * n;
        let d1 = ''; const P = []; for (let i = 0; i <= ceil(m) && i <= n; i++) { const f = i > m ? m - floor(m) : 1, a = k.pts[mx(0, i - 1)], b = k.pts[i], q = i ? [lerp(a[0], b[0], f), lerp(a[1], b[1], f)] : b; P.push([0, clamp(q[0], .01, H - .01), clamp(q[1], -Z + .01, Z - .01)]); }
        for (let i = 0; i < P.length - 1; i++) { const w = k.w * (1 - .8 * i / n) * (.5 + .7 * g); const h = add(P[i], [0, -.006, .006]), h2 = add(P[i + 1], [0, -.006, .006]); s += line3(cam, h, h2, hex(mul(c, 1.25 * dm)), w * .6, 'stroke-linecap="round" opacity=".6"') + line3(cam, P[i], P[i + 1], '#17150f', w, 'stroke-linecap="round"'); }
      }
    }
    if (o.imprint) s += imprintSVG(cam, o.imprint);
  }
  return s;
}
/* the Looney moment: a perfect profile of bird + bike pressed into the concrete */
function imprintSVG(cam, o) {
  const at = (u, v) => [0, v + (o.dy ?? .12), -(u - .1) * (o.flip ?? 1) + (o.z || 0)]; const toD = pts => 'M' + pts.map(p => xy(cam.p(at(p[0], p[1])))).join('L') + 'Z';
  const circ = (cx, cy, r, n = 44) => { const a = []; for (let i = 0; i < n; i++) a.push([cx + cos(i / n * TAU) * r, cy + sin(i / n * TAU) * r]); return a; };
  const bar = (a, b, w) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = hypot(dx, dy), nx = -dy / L * w, ny = dx / L * w; return [[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny], [b[0] - nx, b[1] - ny], [a[0] - nx, a[1] - ny]]; };
  const L = []; for (const k of ['RA', 'FA']) { const c = G[k]; L.push(toD(circ(c[0], c[1], G.R)) + toD(circ(c[0], c[1], G.R - .045).reverse())); L.push(toD(circ(c[0], c[1], .03))); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + .2; L.push(toD(bar(c, [c[0] + cos(a) * .28, c[1] + sin(a) * .28], .004))); } }
  for (const [a, b, w] of [['BB', 'ST', .018], ['ST', 'HT', .018], ['BB', 'HB', .02], ['HT', 'HB', .022], ['HB', 'FA', .014], ['BB', 'RA', .013], ['ST', 'RA', .012], ['ST', 'SAD', .014], ['HT', 'STEM', .014], ['STEM', 'BAR', .014]]) L.push(toD(bar(G[a], G[b], w)));
  L.push(toD(circ(G.BB[0], G.BB[1], .085, 24)));
  let bd = ''; const b = SILH.bird; const q = b.map(p => cam.p(at(p[0], p[1]))); bd = ringPath(q, true) + 'Z';
  const px = cam.p(at(0, 1))[3]; const off = .02 * px;
  let s = ''; const all = `<path d="${bd}"/>` + L.map(d => `<path d="${d}" fill-rule="evenodd"/>`).join('');
  s += `<g fill="#d9d5cb" opacity=".8" transform="translate(${n1(off * .5)} ${n1(off * .7)})">${all}</g><g fill="#1b1915">${all}</g><g fill="#3a3731" transform="translate(${n1(off * .55)} ${n1(off * .75)})" opacity=".9"><g ${defClip(bd, L)}>${all}</g></g>`;
  return s;
}
function defClip(bd, L) { const id = defOnce('imp' + bd.slice(0, 60), i => `<clipPath id="${i}"><path d="${bd}"/>${L.map(d => `<path d="${d}" clip-rule="evenodd"/>`).join('')}</clipPath>`); return `clip-path="url(#${id})"`; }

function tripodCam(cam, p, look, o = {}) { /* high-speed camera on a heavy tripod */
  let s = ''; const c = add(p, [0, o.h || 1.15, 0]); const dm = o.dim ?? 1, K = k => hex(mul(shade(C(k), [0, .6, .8], null, c), dm));
  for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + .5; s += line3(cam, add(c, [0, -.1, 0]), add(p, [cos(a) * .36, 0, sin(a) * .36]), K('#23272c'), .035, 'stroke-linecap="round"'); }
  s += line3(cam, add(c, [0, -.12, 0]), add(c, [0, -.4, 0]), K('#333a41'), .06);
  const d = norm(sub(look, c)); s += box(cam, add(c, [-.13, -.1, -.1]), add(c, [.13, .12, .1]), '#2c3239', { dim: dm, stroke: '#0c0e10' });
  s += tube(cam, [mad(c, d, .1), mad(c, d, .3)], .062, C('#14171a'), { cap: 'butt' }); const e = cam.p(mad(c, d, .31)); if (dot(d, cam.f) < .2) s += `<circle cx="${n1(e[0])}" cy="${n1(e[1])}" r="${n1(.05 * e[3])}" fill="${radG([[0, '#7fd4ff'], [.4, '#2a4a7a'], [1, '#05070b']])}"/><circle cx="${n1(e[0] - .015 * e[3])}" cy="${n1(e[1] - .018 * e[3])}" r="${n1(.012 * e[3])}" fill="#fff" opacity=".9"/>`;
  const l = cam.p(add(c, [.09, .15, 0])); if (o.rec) s += `<circle cx="${n1(l[0])}" cy="${n1(l[1])}" r="${n1(mx(1, .012 * l[3]))}" fill="#ff2b2b"/>` + glow(l[0], l[1], .16 * l[3], '#ff2020', .9);
  return s;
}
function ledBank(cam, c, N, o = {}) { /* emissive panel facing N */
  const t = norm(cross([0, 1, 0], N)), u = cross(N, t), W = o.w || .9, H = o.h || .6; const pt = (a, b) => add(c, add(mul(t, a * W), mul(u, b * H))); let s = '';
  if (o.stand !== false) s += line3(cam, add(c, mul(u, -H)), [c[0], 0, c[2]], '#1d2226', .06) + line3(cam, [c[0] - .4, .02, c[2]], [c[0] + .4, .02, c[2]], '#1d2226', .06);
  s += poly(cam, [pt(-1.06, -1.08), pt(1.06, -1.08), pt(1.06, 1.08), pt(-1.06, 1.08)], '#14181c');
  const fr = dot(N, cam.vd(c)); if (fr > 0) { const on = o.on ?? 1; for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) { const p = cam.p(pt((i + .5) / 3 - 1, (j + .5) / 2 - 1)), r = .062 * p[3]; s += `<circle cx="${n1(p[0])}" cy="${n1(p[1])}" r="${n1(r)}" fill="${mixC('#1c2226', '#f4fbff', on)}"/>`; } const q = cam.p(c); s += glow(q[0], q[1], (o.g || 2.2) * q[3], '#dff0ff', .55 * on); }
  return s;
}
function engineer(cam, x, y, z, k, t, o = {}) { /* silhouette with lab coat and clipboard behind glass */
  const sw = .02 * sin(t * 1.7 + k * 2), P = (a, b) => cam.p([x + a + sw * b, y + b, z]), D = pts => 'M' + pts.map(p => xy(P(...p))).join('L') + 'Z'; const coat = o.coat || '#c9d3da', hair = ['#2a2018', '#5a4a38', '#8a8a8a', '#1b1b1f'][k % 4]; let s = '';
  s += `<path d="${D([[-.2, 0], [-.23, .5], [-.15, .66], [.15, .66], [.23, .5], [.2, 0]])}" fill="${coat}"/><path d="${D([[-.04, .66], [0, .3], [.04, .66]])}" fill="#27404f"/>`;
  const h = P(0, .83), r = .115 * h[3]; s += `<circle cx="${n1(h[0])}" cy="${n1(h[1])}" r="${n1(r)}" fill="#d8a98a"/><path d="M${n1(h[0] - r)},${n1(h[1])}A${n1(r)},${n1(r)} 0 0 1 ${n1(h[0] + r)},${n1(h[1])}Q${n1(h[0])},${n1(h[1] - r * .5)} ${n1(h[0] - r)},${n1(h[1])}Z" fill="${hair}"/><path d="M${n1(h[0] - r * .75)},${n1(h[1] + r * .08)}h${n1(r * .6)}m${n1(r * .3)},0h${n1(r * .6)}" stroke="#101418" stroke-width="${n1(r * .22)}" />`;
  s += `<path d="${D([[.02, .22], [.26, .28], [.24, .5], [.0, .44]])}" fill="#f5f0dc" stroke="#6b4a2a" stroke-width=".8"/>`; return s;
}

/* lamp intensity callback: lamp(i) in 0..1 */
function drawHall(cam, t, o = {}) {
  const A = HALL, lamp = o.lamp || (() => 1), x0 = mx(A.x0, o.x0 ?? A.x0), x1 = mn(A.x1, o.x1 ?? A.x1); let s = ''; const lit = o.lit ?? 1;
  const M = (a, b) => mixC(a, b, lit); const skyTop = M('#04060a', '#1d262e'), skyBot = M('#07090d', '#394750');
  s += `<rect width="1920" height="1080" fill="${linG(0, 0, 0, 1, [[0, skyTop], [1, skyBot]])}"/>`;
  const wallAt = z => {
    if ((z < 0) === (cam.pos[2] < z)) return ''; let w = ''; const sg = z < 0 ? 1 : -1, q = (xa, xb, ya, yb, f, e = '', dz = 0) => poly(cam, [[xa, ya, z + dz * sg], [xb, ya, z + dz * sg], [xb, yb, z + dz * sg], [xa, yb, z + dz * sg]], f, e);
    const base = M('#0a0e13', '#51606b'), dark = M('#06080c', '#28323a'), mid = M('#080c10', '#445059'); const p0 = cam.p([cam.pos[0] + cam.f[0] * 20, A.h, z]), p1 = cam.p([cam.pos[0] + cam.f[0] * 20, 0, z]);
    w += q(x0, x1, 0, A.h, abs(cam.f[2]) > .5 ? linG(0, n1(p0[1]), 0, n1(p1[1]), [[0, M('#05070a', '#222c34')], [.55, base], [1, M('#0c1116', '#6a7a85')]], 1) : base);
    q; w += q(x0, x1, 0, 1.15, dark) + q(x0, x1, 1.15, 1.23, M('#1a1500', '#d9a900')) + q(x0, x1, 1.23, 1.26, M('#050505', '#15181b'));
    for (let x = ceil(x0); x <= x1; x += 1) w += line3(cam, [x, 1.26, z], [x, A.h, z], M('#05070a', '#3c4851'), .018, 'opacity=".55"', .3);
    for (let y = 2.6; y < A.h; y += 1.35) w += line3(cam, [x0, y, z], [x1, y, z], M('#05070a', '#3c4851'), .016, 'opacity=".5"', .3);
    /* observation windows */
    for (const [wa, wb] of [[-12, -3.2], [-31, -23], [-52, -44]]) {
      if (wb < x0 || wa > x1) continue; const on = o.win ?? 1; w += q(wa - .16, wb + .16, 2.25, 4.35, M('#0b0e11', '#20272c'), '', .03) + q(wa, wb, 2.4, 4.2, linG(0, 0, 0, 1, [[0, mixC('#0a1013', '#d9e6df', on * .85)], [.4, mixC('#0a1013', '#9db8b4', on * .85)], [1, mixC('#070b0d', '#51686c', on * .8)]]), '', .04);
      if (z < 0) for (let k = 0; k < 4; k++) { const ex = lerp(wa + 1, wb - 1, (k + .5) / 4); w += engineer(cam, ex, 2.42, z + .05, k + round(-wa), t, { coat: mixC('#222a2e', '#dfe6ea', on * .9) }); }
      for (let x = wa; x <= wb + .01; x += (wb - wa) / 4) w += q(x - .05, x + .05, 2.4, 4.2, M('#0b0e11', '#20272c'), '', .06); w += q(wa, wb, 2.4, 2.55, M('#0b0e11', '#20272c'), '', .06);
      w += poly(cam, [[wa + .4, 4.2, z + .07 * sg], [wa + 1.3, 4.2, z + .07 * sg], [wa + .3, 2.4, z + .07 * sg], [wa, 2.4, z + .07 * sg], [wa, 3.4, z + .07 * sg]], '#fff', `opacity="${n2(.07 * on)}"`);
    }
    /* columns */
    for (let x = ceil(x0 / 4) * 4; x <= x1; x += 4) { w += q(x - .16, x + .16, 0, A.h, M('#0c1116', '#5f6e79'), '', .25) + q(x - .16, x - .11, 0, A.h, M('#10161b', '#8394a0'), '', .26) + q(x + .1, x + .16, 0, A.h, M('#05070a', '#333e46'), '', .26) + q(x - .17, x + .17, 0, .9, M('#1a1500', '#d9a900'), '', .27); for (let y = 0; y < .9; y += .3) w += poly(cam, [[x - .17, y, z + .28 * sg], [x + .17, y + .15, z + .28 * sg], [x + .17, y + .3, z + .28 * sg], [x - .17, y + .15, z + .28 * sg]], M('#060504', '#15150f')); }
    /* cable trays, conduits */
    w += q(x0, x1, 4.9, 5.05, M('#0a0d10', '#2b343b'), '', .2) + q(x0, x1, 5.05, 5.08, M('#141a1f', '#8897a2'), '', .21); for (let k = 0; k < 3; k++) w += line3(cam, [x0, 4.82 - k * .06, z + .22 * sg], [x1, 4.82 - k * .06, z + .22 * sg], ['#b3432c', '#2a7f8c', '#c9a227'][k], .025, `opacity="${n2(.25 + .55 * lit)}"`, .4);
    /* distance boards and signage */
    if (z < 0 && abs(cam.f[2]) > .25) for (let m = -60; m <= -5; m += 5) { if (m < x0 || m > x1) continue; w += q(m - .62, m + .62, 1.5, 2.1, M('#0a0c0e', '#111820'), '', .05) + text3(cam, [m - .52, 1.63, z + .07], [.4, 0, 0], [0, .4, 0], `${-m} m`, M('#2a3a12', '#d6ff5a'), FONT + ' font-weight="700"'); }
    if (z < 0) { w += text3(cam, [-21.8, 2.75, z + .05], [1.25, 0, 0], [0, 1.25, 0], 'PKZ', M('#11161a', '#c9d4db'), FONT + ' font-weight="700" opacity=".85"') + text3(cam, [-21.8, 2.35, z + .05], [.27, 0, 0], [0, .27, 0], 'PELIKAN-KOLLISIONS-ZENTRUM', M('#11161a', '#c9d4db'), FONT + ' opacity=".8"') + text3(cam, [-42.8, 3.1, z + .05], [.55, 0, 0], [0, .55, 0], 'SICHERHEIT ZUERST', M('#1a1500', '#ffd000'), FONT + ' font-weight="700" opacity=".85"') + text3(cam, [-42.8, 2.6, z + .05], [.3, 0, 0], [0, .3, 0], 'SCHNABEL IMMER GESCHLOSSEN HALTEN', M('#1a1500', '#ffd000'), FONT + ' opacity=".7"'); }
    for (const ex of [-1.4, -16, -36, -56]) { if (z > 0) break; w += q(ex - .45, ex + .45, 4.4, 4.75, '#0c7a3d', `opacity="${n2(.45 + .55 * lit)}"`, .06) + text3(cam, [ex - .38, 4.5, z + .08], [.15, 0, 0], [0, .15, 0], 'NOTAUSGANG', '#eafff2', FONT + ' font-weight="700"'); }
    for (const ex of [-14.2, -34.4]) if (z < 0) { w += q(ex - .09, ex + .09, .55, 1.1, M('#2a0505', '#c4211b'), '', .12) + q(ex - .03, ex + .03, 1.1, 1.18, '#111', '', .12); }
    return w;
  };
  s += wallAt(-A.z) + wallAt(A.z);
  /* end walls */
  if (cam.f[0] > .05) s += poly(cam, [[A.x1, 0, -A.z], [A.x1, 0, A.z], [A.x1, A.h, A.z], [A.x1, A.h, -A.z]], M('#080b0f', '#3a464f')) + poly(cam, [[A.x1 - .02, 2.6, -3.4], [A.x1 - .02, 2.6, 3.4], [A.x1 - .02, 5.2, 3.4], [A.x1 - .02, 5.2, -3.4]], M('#0a0d11', '#222b32'));
  if (cam.f[0] < -.05) { s += poly(cam, [[A.x0, 0, -A.z], [A.x0, 0, A.z], [A.x0, A.h, A.z], [A.x0, A.h, -A.z]], M('#080b0f', '#3a464f')); s += poly(cam, [[A.x0 + .02, 0, -2.6], [A.x0 + .02, 0, 2.6], [A.x0 + .02, 4.4, 2.6], [A.x0 + .02, 4.4, -2.6]], M('#06090c', '#26303a')); }
  /* ceiling + trusses */
  if (cam.pos[1] < A.h) s += poly(cam, [[x0, A.h, -A.z], [x1, A.h, -A.z], [x1, A.h, A.z], [x0, A.h, A.z]], M('#030406', '#161d23'));
  const tr = []; for (let x = ceil(x0 / 4) * 4 + 2; x <= x1; x += 4) tr.push(x); tr.sort((a, b) => cam.depth([b, 7, 0]) - cam.depth([a, 7, 0]));
  if (o.truss !== false) for (const x of tr) { const c1 = M('#0b0f13', '#4c5963'); s += line3(cam, [x, 7.6, -A.z], [x, 7.6, A.z], c1, .14) + line3(cam, [x, 6.7, -A.z], [x, 6.7, A.z], c1, .12); for (let z = -A.z; z < A.z; z += 1) s += line3(cam, [x, z % 2 ? 7.6 : 6.7, z], [x, z % 2 ? 6.7 : 7.6, z + 1], c1, .06); }
  for (const z of [-5.2, 5.2]) s += line3(cam, [x0, 7.1, z], [x1, 7.1, z], M('#0b0f13', '#44505a'), .2);
  /* floor */
  const pf = cam.p([cam.pos[0] + cam.f[0] * 30, 0, cam.pos[2] + cam.f[2] * 30]), hy = clamp(pf[1], -500, 1500);
  s += poly(cam, [[A.x0, 0, -A.z], [A.x1, 0, -A.z], [A.x1, 0, A.z], [A.x0, 0, A.z]], linG(0, n1(hy), 0, 1080, [[0, M('#0a0f13', '#76858f')], [.35, M('#0b1014', '#63717b')], [1, M('#07090c', '#3b464e')]], 1));
  const fl = (xa, xb, za, zb, f, e) => poly(cam, [[xa, .002, za], [xb, .002, za], [xb, .002, zb], [xa, .002, zb]], f, e);
  s += fl(x0, x1, -1.25, 1.25, M('#0c1216', '#8b99a2'), 'opacity=".55"');
  for (let x = ceil(x0 / 5) * 5; x <= x1; x += 5) s += line3(cam, [x, .002, -A.z], [x, .002, A.z], M('#06080a', '#3a454c'), .02, 'opacity=".6"', .3);
  /* lamp pools */
  for (let i = 0; i < LAMPX.length; i++) { const L = lamp(i, LAMPX[i]); if (L < .01 || LAMPX[i] < x0 - 3 || LAMPX[i] > x1 + 3) continue; for (const z of [-2.6, 2.6]) { const d = polyD(cam, [...Array(20).keys()].map(k => [LAMPX[i] + cos(k / 20 * TAU) * 2.5, .003, z + sin(k / 20 * TAU) * 2.5])); if (d) s += `<path d="${d}" fill="${radG([[0, '#e8f4ff', .34], [.5, '#cfe6ff', .15], [1, '#cfe6ff', 0]])}" opacity="${n2(L)}" style="mix-blend-mode:screen"/>`; } }
  s += fl(x0, x1, -1.31, -1.23, M('#1c1700', '#ffc800')) + fl(x0, x1, 1.23, 1.31, M('#1c1700', '#ffc800'));
  const ch = [mx(x0, cam.pos[0] - 16), mn(x1, cam.pos[0] + (abs(cam.f[0]) > .6 ? 60 : 16))];
  for (let x = ceil(ch[0]); x <= mn(ch[1], 0); x++) { const big = x % 5 === 0; s += fl(x - .02, x + .02, 1.31, big ? 1.75 : 1.5, M('#101010', '#f2f5f7')) + fl(x - .02, x + .02, -1.31, big ? -1.75 : -1.5, M('#101010', '#f2f5f7')); if (big && x < 0 && abs(cam.f[2]) > .2) s += text3(cam, [x - .2, .004, 2.25], [.42, 0, 0], [0, 0, -.42], `${-x}`, M('#1a1a1a', '#f2f5f7'), FONT + ' font-weight="700" opacity=".9"'); }
  /* calibration checker strip and run-up hazard zone */
  for (let x = ceil(mx(ch[0], -8) / .25) * .25; x < -0.01 && x < ch[1]; x += .25) { const k = round(x / .25) & 1; s += fl(x, x + .25, 1.02, 1.09, k ? M('#080808', '#15171a') : M('#1c1700', '#ffd400')) + fl(x, x + .25, -1.09, -1.02, k ? M('#1c1700', '#ffd400') : M('#080808', '#15171a')); }
  for (let x = mx(-5, ch[0]); x < -.3 && x < ch[1]; x += .9) s += poly(cam, [[x, .002, -1.0], [x + .4, .002, 0], [x, .002, 1.0], [x + .26, .002, 1.0], [x + .66, .002, 0], [x + .26, .002, -1.0]], M('#1c1700', '#e5b400'), 'opacity=".4"');
  /* tow rail */
  s += fl(x0, -.2, -.07, .07, M('#050607', '#20262b')) + fl(x0, -.2, -.085, -.07, M('#12161a', '#b9c4cc')) + fl(x0, -.2, .07, .085, M('#12161a', '#b9c4cc')) + line3(cam, [x0, .004, 0], [-.2, .004, 0], M('#0c0c0c', '#8c97a0'), .022);
  /* lamps: housings, glow, beams */
  let beams = '';
  for (let i = 0; i < LAMPX.length; i++) {
    const x = LAMPX[i]; if (x < x0 - 1 || x > x1 + 1) continue; const L = lamp(i, x);
    for (const z of [-2.6, 2.6]) {
      const c = [x, 6.45, z], q = cam.p(c); if (q[2] < .4) continue; s += line3(cam, [x, 6.7, z], [x, 6.5, z], '#20262b', .08) + poly(cam, [[x - .42, 6.5, z - .42], [x + .42, 6.5, z - .42], [x + .42, 6.5, z + .42], [x - .42, 6.5, z + .42]], M('#0c1013', '#313b43'));
      const d = polyD(cam, [...Array(18).keys()].map(k => [x + cos(k / 18 * TAU) * .36, 6.44, z + sin(k / 18 * TAU) * .36])); if (d) s += `<path d="${d}" fill="${mixC('#10161a', '#fbfdff', L)}"/>`;
      if (L > .02) { beams += glow(q[0], q[1], (o.glow || 2.3) * q[3], '#d9ecff', .75 * L); const bA = cam.p([x, 6.4, z]), bB = [x, 0, z]; const e1 = cam.r, l = mad([x, 6.4, z], e1, -.34), r = mad([x, 6.4, z], e1, .34), l2 = mad(bB, e1, -2.4), r2 = mad(bB, e1, 2.4); const q0 = cam.p(bB); const dd = polyD(cam, [l, r, r2, l2]); if (dd && o.beam !== 0) beams += `<path d="${dd}" fill="${linG(0, n1(bA[1]), 0, n1(q0[1]), [[0, '#dcecff', .2], [.45, '#cfe4ff', .06], [1, '#cfe4ff', 0]], 1)}" opacity="${n2(L * (o.beam ?? 1))}" style="mix-blend-mode:screen"/>`; }
    }
  }
  return { back: s, beams };
}
/* props around the impact zone, split into far / near relative to the lane */
function impactProps(cam, t, o = {}) {
  const look = [0, 1.1, 0], far = [], f = (z, s) => far.push({ z, s }); const on = o.led ?? 1;
  f(cam.depth([-3.2, 1, -4.4]), ledBank(cam, [-3.4, 2.75, -4.6], norm([.55, -.35, 1]), { on, w: .8, h: .5 }));
  f(cam.depth([1.6, 1, -4.6]), ledBank(cam, [2.2, 2.9, -4.8], norm([-.5, -.3, 1]), { on, w: .8, h: .5 }));
  f(cam.depth([-3.3, 1, -3]), tripodCam(cam, [-3.4, 0, -2.9], look, { rec: 1 })); f(cam.depth([-.4, 1, -2.6]), tripodCam(cam, [-.5, 0, -2.7], [-.4, 1.1, 0], { rec: 1, h: .9 }));
  f(cam.depth([-5.6, 1, -3.2]), tripodCam(cam, [-5.8, 0, -3.1], look, { rec: 1, h: 1.4 }));
  far.sort((a, b) => b.z - a.z); return far.map(x => x.s).join('');
}
function signalMast(cam, x, z, st) { /* st: 0 off, 1..3 reds lit, 4 green */
  let s = line3(cam, [x, 0, z], [x, 2.75, z], '#20262b', .09) + box(cam, [x - .13, 1.62, z - .13], [x + .13, 2.72, z + .13], '#15191d', { stroke: '#000' });
  const cols = ['#ff2a1f', '#ff2a1f', '#ff2a1f', '#20ff6a']; for (let i = 0; i < 4; i++) { const on = st === 4 ? i === 3 : i < st && i < 3, dx = cam.pos[0] < x ? -.135 : .135, useZ = abs(cam.pos[2] - z) > abs(cam.pos[0] - x), P = useZ ? [x, 2.58 - i * .27, z + (cam.pos[2] > z ? .135 : -.135)] : [x + dx, 2.58 - i * .27, z], q = cam.p(P); if (q[2] < .2) continue; s += `<circle cx="${n1(q[0])}" cy="${n1(q[1])}" r="${n1(.095 * q[3])}" fill="${on ? cols[i] : '#2a1412'}" stroke="#000"/>`; if (on) s += glow(q[0], q[1], .95 * q[3], cols[i], .95); }
  return s;
}
