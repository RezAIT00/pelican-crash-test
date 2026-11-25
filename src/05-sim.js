/* ============================================================ crash simulation: position-based dynamics, plastic yield, breakable joints
   wall = half-space x>0, floor = y<0. Deterministic, pre-computed once, sampled at any simulated time tau. */
const SIM = (() => {
  const N = [], idx = {}, cons = [], ev = [];
  const node = (name, p, m, o = {}) => { idx[name] = N.length; N.push({ name, p: p.slice(), q: p.slice(), w: 1 / m, r: o.r ?? .02, rf: o.rf ?? (o.r ?? .02), e: o.e ?? .1, mu: o.mu ?? .3, grp: o.grp || 'bike', hit: false, fl: 0, v0: [VMAX, 0, 0] }); return idx[name]; };
  const con = (a, b, o = {}) => { const A = idx[a], B = idx[b]; cons.push(Object.assign({ a: A, b: B, rest: o.rest ?? dist(N[A].p, N[B].p), k: 1, yC: 9, yT: 9, brk: 9, rate: .5, tOnly: false, until: 9, type: '', on: true, L0: o.rest ?? dist(N[A].p, N[B].p), dead: 9 }, o)); return cons[cons.length - 1]; };
  const R = rng(4711), bx = X_HIT, W_ = P => [P[0] + bx, P[1], P[2]];
  /* --- frame --- */
  for (const [k, m] of [['RA', 3.2], ['BB', 3.4], ['ST', 2.2], ['HT', .7], ['HB', .7], ['FA', .5], ['SAD', 1.2], ['STEM', .3], ['BAR', .3]]) node(k, W_(G[k]), m, { r: .022 });
  const mid = (n, a, b, off) => node(n, add(mix3(N[idx[a]].p, N[idx[b]].p, .5), off), .35, { r: .02 });
  mid('TT', 'ST', 'HT', [0, .012, .004]); mid('DT', 'BB', 'HB', [.004, -.012, -.004]); mid('SM', 'BB', 'ST', [.006, 0, .003]); mid('CS', 'BB', 'RA', [0, -.005, .004]); mid('SS', 'ST', 'RA', [-.004, .004, -.004]); mid('FK', 'HB', 'FA', [.008, .004, .003]);
  for (const [a, m, b, kk, y] of [['ST', 'TT', 'HT', .05, .006], ['BB', 'DT', 'HB', .06, .006], ['BB', 'SM', 'ST', .4, .02], ['BB', 'CS', 'RA', .4, .02], ['ST', 'SS', 'RA', .3, .02], ['HB', 'FK', 'FA', .08, .006]]) { con(a, m, { k: 1, yC: .06, yT: .05, rate: .05, type: 'tube' }); con(m, b, { k: 1, yC: .06, yT: .05, rate: .05, type: 'tube' }); con(a, b, { k: kk, yC: y, yT: .02, rate: .6, type: 'buckle', tag: m }); }
  con('HT', 'HB', { type: 'tube' }); con('ST', 'SAD'); con('HT', 'STEM'); con('STEM', 'BAR'); con('HB', 'STEM'); con('BB', 'SAD', { k: .4, yC: .02, yT: .02 }); con('HT', 'BAR', { k: .35, yC: .02, yT: .02, rate: .4 }); con('HB', 'BAR', { k: .25, yC: .02, yT: .02, rate: .4 });
  con('ST', 'HB', { k: .02, yC: .01, yT: .02, rate: .8 }); con('BB', 'HT', { k: .02, yC: .01, yT: .02, rate: .8 }); con('HT', 'FA', { k: .06, yC: .01, yT: .015, rate: .8 });
  for (const s of [1, -1]) { const n = s > 0 ? 'GR' : 'GL'; node(n, W_([G.BAR[0] + .02, G.BAR[1] + .012, s * .215]), .2, { r: .02 }); con(n, 'BAR', { k: .8, yC: .05, yT: .05 }); con(n, 'STEM', { k: .5, yC: .03, yT: .03 }); con(n, 'HT', { k: .3, yC: .03, yT: .03 }); }
  con('GR', 'GL', { k: .4, yC: .04, yT: .04 });
  /* --- wheels --- */
  const om = VMAX / G.R;
  const wheel = (pre, hub, ang) => {
    const c = N[idx[hub]].p;
    for (let i = 0; i < NSP; i++) { const a = ang + i / NSP * TAU, d = [cos(a), sin(a), 0]; for (const [s, r, m, rr] of [['r', G.R - .045, .05, .012], ['t', G.R - .019, .035, .018]]) { const n = node(pre + s + i, mad(c, d, r), m, { r: rr, e: .25, mu: .55, grp: pre + s }); N[n].v0 = [VMAX + om * r * sin(a), -om * r * cos(a), (R() - .5) * .9]; } }
    const fr = new Map(), t0 = pre === 'F' ? .017 : .056, t1 = pre === 'F' ? .045 : .096; for (let q = 0; q < 8; q++) fr.set(floor((q + R() * .8) / 8 * NSP) % NSP, lerp(t0, t1, R()));
    for (let i = 0; i < NSP; i++) {
      const j = (i + 1) % NSP, k = (i + 2) % NSP, f = pre === 'F' ? 1 : 1.0;
      con(pre + 'r' + i, pre + 'r' + j, { k: 1, yC: .08, yT: .05, rate: .12, brk: .5, until: fr.has(i) ? fr.get(i) : 9, type: 'rim', i, pre }); con(pre + 'r' + i, pre + 'r' + k, { k: .5, yC: .02, yT: .02, rate: .35, type: 'rimB', i, pre });
      con(pre + 't' + i, pre + 't' + j, { k: .8, yC: .3, yT: .12, rate: .02, type: 'tyre' }); con(pre + 't' + i, pre + 't' + k, { k: .18, yC: .4, yT: .2, rate: .02 });
      con(pre + 'r' + i, pre + 't' + i, { k: .6, yC: .9, yT: .9, until: lerp(t0, t1 + .01, R()), type: 'bead' }); con(pre + 'r' + i, pre + 't' + j, { k: .25, until: lerp(t0, t1, R()), type: 'bead' });
      con(hub, pre + 'r' + i, { k: .75, tOnly: true, brk: 9, until: lerp(t0 - .005, t1, pow(R(), .8)), type: 'spoke', i, pre, yT: .5 });
      con(hub, pre + 'r' + i, { k: .05, yC: .02, yT: .05, rate: .5, until: pre === 'F' ? .024 : .062 });
    }
  };
  const wa = wheelAng(T.hit); wheel('F', 'FA', wa); wheel('R', 'RA', wa + .4);
  /* --- loose fittings --- */
  node('BELL', W_([G.BAR[0] + .025, G.BAR[1] + .034, .08]), .12, { r: .026, e: .6, grp: 'loose' }); con('BELL', 'BAR', { until: .031 }); con('BELL', 'STEM', { until: .031 }); con('BELL', 'GR', { until: .031 });
  node('LAMP', W_([G.HT[0] + .09, G.HT[1] - .05, 0]), .15, { r: .03, e: .4, grp: 'loose' }); con('LAMP', 'HT', { until: .02 }); con('LAMP', 'HB', { until: .02 });
  node('REC', W_([-.40, .78, 0]), 1.3, { r: .06, e: .35, grp: 'loose' }); con('REC', 'ST', { until: .05 }); con('REC', 'RA', { until: .05 }); con('REC', 'SAD', { until: .05 });
  node('PEDR', W_([G.BB[0], G.BB[1] - .12, .13]), .25, { r: .025, e: .4, grp: 'loose' }); con('PEDR', 'BB', { until: .043 });
  /* --- the pelican --- */
  const pose0 = ridePose(T.hit, { bx });
  const pm = [.5, 1.4, 2.4, 2.1, .9, .45, .4, .4], pr = [.05, .1, .085, .085, .06, .045, .04, .045];
  pose0.spine.forEach((p, i) => node('s' + i, p, pm[i], { r: [.03, .05, .05, .05, .04, .035, .035, .04][i], rf: [.05, .12, .15, .14, .09, .055, .05, .055][i], e: .02, mu: .7, grp: 'pel' }));
  const H0 = headFrame(pose0.head); node('hd', H0.c, .8, { r: .05, e: .05, mu: .6, grp: 'pel' }); node('sn', hp(H0, .1, -.006, 0), .3, { r: .035, e: .02, mu: .5, grp: 'pel' }); node('cr', hp(H0, 0, .075, 0), .2, { r: .03, e: .02, mu: .5, grp: 'pel' }); node('ear', hp(H0, 0, 0, .06), .2, { r: .02, e: .02, mu: .5, grp: 'pel' });
  for (const [a, b] of [['hd', 'sn'], ['hd', 'cr'], ['sn', 'cr'], ['hd', 'ear'], ['sn', 'ear'], ['cr', 'ear']]) con(a, b, { k: 1 });
  con('s7', 'hd', { k: 1 }); con('s7', 'cr', { k: .6 }); con('s7', 'sn', { k: .25 }); con('s6', 'hd', { k: .2 });
  for (let i = 0; i < 7; i++) con('s' + i, 's' + (i + 1), { k: i < 3 ? .95 : .8 });
  for (let i = 0; i < 6; i++) con('s' + i, 's' + (i + 2), { k: i < 2 ? .7 : i < 3 ? .3 : .06 });
  for (const w of pose0.wings) {
    const s = w.side > 0 ? 'R' : 'L'; node('S' + s, w.S, .5, { r: .05, e: .05, mu: .6, grp: 'pel' }); node('E' + s, w.E, .35, { r: .03, e: .1, mu: .5, grp: 'pel' }); node('W' + s, w.W, .25, { r: .025, e: .1, mu: .4, grp: 'pel' }); node('T' + s, w.F, .15, { r: .02, e: .1, mu: .4, grp: 'pel' });
    for (const k of ['s2', 's3', 's4']) con('S' + s, k, { k: .9 }); con('S' + s, 'E' + s); con('E' + s, 'W' + s); con('W' + s, 'T' + s); con('E' + s, 'T' + s, { k: .05 }); con('S' + s, 'W' + s, { k: .01 });
    con('W' + s, s === 'R' ? 'GR' : 'GL', { k: .8, until: s === 'R' ? .026 : .030, type: 'grip' });
  }
  con('SR', 'SL', { k: .9 });
  for (const g of pose0.legs) {
    const s = g.side > 0 ? 'R' : 'L'; node('P' + s, g.H, .5, { r: .05, e: .05, mu: .6, grp: 'pel' }); node('K' + s, g.K, .35, { r: .04, e: .15, mu: .5, grp: 'pel' }); node('A' + s, g.A, .2, { r: .02, e: .2, mu: .5, grp: 'pel' }); node('F' + s, g.F, .2, { r: .02, e: .3, mu: .6, grp: 'pel' });
    for (const k of ['s1', 's2']) con('P' + s, k, { k: .9 }); con('P' + s, 'K' + s); con('K' + s, 'A' + s); con('A' + s, 'F' + s); con('P' + s, 'A' + s, { k: .02 });
    con('F' + s, 'BB', { k: .4, until: .02 });
  }
  con('PR', 'PL', { k: .9 });
  /* self-stiffening so the bird never turns inside-out */
  const minD = [['s1', 's3', .24], ['s2', 's4', .2], ['s3', 's5', .1], ['s0', 's2', .2], ['hd', 's4', .1], ['hd', 's3', .16], ['SR', 'KR', .12], ['SL', 'KL', .12], ['FR', 's2', .2], ['FL', 's2', .2], ['AR', 's2', .16], ['AL', 's2', .16]].map(([a, b, d]) => ({ a: idx[a], b: idx[b], d }));
  /* --- integrate --- */
  const times = [], snaps = [], beak = [], vcm = []; const brokenSp = { F: new Array(NSP).fill(9), R: new Array(NSP).fill(9) }, brokenRim = { F: new Array(NSP).fill(9), R: new Array(NSP).fill(9) };
  const snap = tau => { const d = new Float32Array(N.length * 3); N.forEach((n, i) => { d[i * 3] = n.p[0]; d[i * 3 + 1] = n.p[1]; d[i * 3 + 2] = n.p[2]; }); times.push(tau); snaps.push(d); };
  const TEND = 1.35, SN = idx.sn, HD = idx.hd; let tau = 0, dt = 6e-5; N.forEach(n => { n.q = mad(n.p, n.v0, -dt); }); snap(0);
  const TREL = .13; let released = false, nextSnap = .0005, crushMax = 0, lastDt = dt; const bodyIdx = ['s1', 's2', 's3', 's4'].map(k => idx[k]); const pelIdx = N.map((n, i) => (n.grp === 'pel' ? i : -1)).filter(i => i >= 0);
  const contactLog = new Set(['hd', 'sn', 's2', 's3', 's4', 'BAR', 'HT', 'FA', 'BB', 'RA', 'KR', 'KL', 'SR', 'SL', 'WR', 'WL', 's1', 'FR', 'FL', 'STEM']);
  ev.push({ tau: 0, type: 'beak', p: [0, 1.45, 0], mag: 1 });
  while (tau < TEND) {
    dt = tau < .14 ? 6e-5 : 2.4e-4; const ratio = dt / lastDt, g = -9.81 * (tau > TREL ? 1.35 : 1) * dt * dt; lastDt = dt;
    for (const n of N) { const vx = (n.p[0] - n.q[0]) * ratio, vy = (n.p[1] - n.q[1]) * ratio, vz = (n.p[2] - n.q[2]) * ratio * (n.grp === 'bike' ? .9985 : .9996); n.q[0] = n.p[0]; n.q[1] = n.p[1]; n.q[2] = n.p[2]; n.p[0] += vx; n.p[1] += vy + g; n.p[2] += vz; }
    /* the bill as a crumple zone */
    const f = norm(sub(N[SN].p, N[HD].p)), gap = -N[SN].p[0] / mx(.35, f[0]), crush = clamp(BL * .985 - gap, 0, BL * .86); if (tau < .12) crushMax = mx(crushMax, crush); else crushMax = mx(crushMax * .9996, 0);
    if (gap < BL * .985 && tau < .06 && N[SN].p[0] < -.03) { const vx = (N[HD].p[0] - N[HD].q[0]) / dt, a = vx > .5 ? (320 + 900 * pow(crush / BL, 2)) : 0; for (const i of [SN, HD, idx.cr, idx.ear, idx.s7]) { N[i].p[0] -= a * dt * dt; N[i].p[1] += 130 * dt * dt * sin(tau * 400); } }
    for (let it = 0; it < 7; it++) {
      for (const c of cons) {
        if (!c.on) continue; if (tau > c.until) { c.on = false; c.dead = tau; if (c.type === 'grip') ev.push({ tau, type: 'grip', p: N[c.a].p.slice(), mag: .4 });
          if (c.type === 'spoke') { brokenSp[c.pre][c.i] = tau; const B = N[c.b]; ev.push({ tau, type: 'spoke', p: B.p.slice(), mag: .5, i: c.i, pre: c.pre, v: mul(sub(B.p, B.q), 1 / dt), hub: N[c.a].p.slice() }); }
          if (c.type === 'rim') { brokenRim[c.pre][c.i] = tau; const A = N[c.a], B = N[c.b], hub = N[idx[c.pre === 'F' ? 'FA' : 'RA']].p; ev.push({ tau, type: 'rim', p: B.p.slice(), mag: .8, i: c.i, pre: c.pre }); for (const d of cons) if (d.type === 'rimB' && d.pre === c.pre && (d.i === c.i || (d.i + 1) % NSP === c.i)) d.on = false; for (const [n, z] of [[A, 1], [B, -1]]) { const o = norm(sub(n.p, hub)), kz = (hash(c.i, 77) - .5) * 9; n.q = sub(n.q, mul([o[0] * 5 - 3.5, o[1] * 5 + 2, kz + z * 2], dt)); } }
          continue; }
        const A = N[c.a], B = N[c.b], dx = B.p[0] - A.p[0], dy = B.p[1] - A.p[1], dz = B.p[2] - A.p[2], L = sqrt(dx * dx + dy * dy + dz * dz) + 1e-9, st = (L - c.rest) / c.rest; if (c.tOnly && st < 0) continue;
        if (it === 0) {
          if (st > c.brk || (c.type === 'rim' && -st > c.brk * 1.6)) { c.on = false; c.dead = tau; if (c.type === 'spoke') { brokenSp[c.pre][c.i] = tau; ev.push({ tau, type: 'spoke', p: B.p.slice(), mag: .5, i: c.i, pre: c.pre, v: mul(sub(B.p, B.q), 1 / dt) }); } if (c.type === 'rim') { brokenRim[c.pre][c.i] = tau; ev.push({ tau, type: 'rim', p: B.p.slice(), mag: .8, i: c.i, pre: c.pre }); for (const d of cons) if (d.type === 'rimB' && d.pre === c.pre && (d.i === c.i || (d.i + 1) % NSP === c.i)) { d.on = false; } } continue; }
          if (-st > c.yC) { const y = -st - c.yC; c.rest -= c.rest * y * c.rate; if (c.type === 'buckle' && !c.ev) { c.ev = 1; ev.push({ tau, type: 'tube', p: N[idx[c.tag]].p.slice(), mag: .9, tag: c.tag }); } } else if (st > c.yT) c.rest += c.rest * (st - c.yT) * c.rate;
        }
        const ws = A.w + B.w, s = (L - c.rest) / L * c.k / ws; A.p[0] += dx * s * A.w; A.p[1] += dy * s * A.w; A.p[2] += dz * s * A.w; B.p[0] -= dx * s * B.w; B.p[1] -= dy * s * B.w; B.p[2] -= dz * s * B.w;
      }
      for (const c of minD) { const A = N[c.a], B = N[c.b], d = sub(B.p, A.p), L = len(d) + 1e-9; if (L < c.d) { const s = (L - c.d) / L * .5 / (A.w + B.w); for (let k = 0; k < 3; k++) { A.p[k] += d[k] * s * A.w; B.p[k] -= d[k] * s * B.w; } } }
      for (const n of N) { if (n.p[0] > -n.r) n.p[0] = -n.r; if (n.p[1] < n.rf) n.p[1] = n.rf; }
    }
    for (const n of N) {
      if (n.p[0] >= -n.r - 1e-9) { const vx = n.p[0] - n.q[0], stick = n.grp === 'pel' && tau < TREL; if (!n.hit && contactLog.has(n.name)) { n.hit = true; ev.push({ tau, type: 'hit', p: n.p.slice(), mag: n.name === 's3' || n.name === 's2' ? 1 : .5, tag: n.name }); } n.q[0] = n.p[0] + (stick ? 0 : mx(0, vx) * n.e); const mu = stick ? .06 : n.mu * .12 * clamp(vx / dt / 1.5); n.q[1] = lerp(n.q[1], n.p[1], mu); n.q[2] = lerp(n.q[2], n.p[2], mu); }
      if (n.p[1] <= n.rf + 1e-9) { const vy = n.p[1] - n.q[1], sp = -vy / dt, e = n.grp === 'pel' ? .52 : n.grp === 'loose' ? .5 : n.grp[1] === 't' ? .6 : .25; n.q[1] = n.p[1] + mn(0, vy) * (sp > .6 ? e : 0); n.q[0] = lerp(n.q[0], n.p[0], .03); n.q[2] = lerp(n.q[2], n.p[2], .03); if (sp > 1.0 && tau > .14 && tau - n.fl > .12) { n.fl = tau; ev.push({ tau, type: 'floor', p: n.p.slice(), mag: clamp(sp / 6), tag: n.name, grp: n.grp }); } }
    }
    if (tau > .024 && tau < .06) for (const [k, z] of [['ER', 1], ['WR', 1], ['TR', 1], ['EL', -1], ['WL', -1], ['TL', -1]]) { const n = N[idx[k]]; n.q[2] -= z * 340 * dt * dt; n.q[1] -= (k[0] === 'E' ? 60 : 210) * dt * dt; }
    if (tau > .036 && tau < .062) for (const [k, ay] of [['TT', 2600], ['DT', -2400], ['SM', 300]]) { const n = N[idx[k]]; n.q[1] -= ay * dt * dt; n.q[2] -= ay * .22 * dt * dt; }
    if (tau > .03 && tau < .06) for (const [k, z] of [['KR', 1], ['AR', 1], ['FR', 1], ['KL', -1], ['AL', -1], ['FL', -1]]) N[idx[k]].q[2] -= z * 120 * dt * dt;
    if (tau < TREL) for (const i of pelIdx) { const n = N[i]; if (n.p[0] > -n.r - .004 && n.p[0] < n.q[0]) n.p[0] = n.q[0]; }
    if (tau >= TREL && !released) {
      released = true; let c = [0, 0, 0]; for (const i of bodyIdx) c = add(c, mul(N[i].p, .25));
      for (const i of pelIdx) { const n = N[i], r = sub(n.p, c), v = [-2.3 - r[1] * 7.0 + r[2] * 1.2, 1.0 + r[0] * 7.0, -r[2] * .5 - r[0] * 1.2 + (hash(i, 3) - .5) * .6]; n.q = mad(n.p, v, -dt); }
      ev.push({ tau, type: 'peel', p: c, mag: 1 });
    }
    tau += dt;
    if (tau >= nextSnap) { snap(tau); beak.push(crushMax); let v = 0, m = 0; for (const i of bodyIdx) { v += (N[i].p[0] - N[i].q[0]) / dt / N[i].w; m += 1 / N[i].w; } vcm.push(v / m); nextSnap += tau < .16 ? .0005 : .004; }
  }
  beak.unshift(0); vcm.unshift(VMAX);
  /* CFC-style low-pass on the chest channel -> deceleration in g */
  const gc = times.map((t0, i) => { if (t0 > .16) return 0; let a = 0, w = 0; for (let j = mx(1, i - 24); j < mn(times.length, i + 25); j++) { if (times[j] > .16) break; const dtj = times[j] - times[j - 1], k = exp(-pow((times[j] - t0) / .0035, 2) / 2); a += (vcm[j - 1] - vcm[j]) / dtj * k; w += k; } return mx(0, a / w / 9.81); });
  const find = t0 => { let a = 0, b = times.length - 1; if (t0 <= times[0]) return [0, 0, 0]; if (t0 >= times[b]) return [b, b, 0]; while (b - a > 1) { const m = (a + b) >> 1; if (times[m] <= t0) a = m; else b = m; } return [a, b, (t0 - times[a]) / (times[b] - times[a])]; };
  const at = t0 => { const [a, b, f] = find(t0), A = snaps[a], B = snaps[b]; return n => { const i = idx[n] * 3; return [lerp(A[i], B[i], f), lerp(A[i + 1], B[i + 1], f), lerp(A[i + 2], B[i + 2], f)]; }; };
  const samp = arr => t0 => { if (t0 <= 0) return arr[0]; const [a, b, f] = find(t0); return lerp(arr[a], arr[b], f); };
  let gPeak = 0, gPeakT = 0; gc.forEach((g, i) => { if (g > gPeak) { gPeak = g; gPeakT = times[i]; } });
  /* HIC-style integral, purely for science */
  let hic = 0; for (let i = 0; i < times.length && times[i] < .12; i += 2) for (let j = i + 4; j < times.length && times[j] - times[i] <= .036; j += 2) { let s = 0; for (let k = i; k < j; k++) s += gc[k] * (times[k + 1] - times[k]); const d = times[j] - times[i]; hic = mx(hic, pow(s / d, 2.5) * d); }
  ev.sort((a, b) => a.tau - b.tau);
  return { at, ev, beak: samp(beak), v: samp(vcm), g: samp(gc), gPeak, gPeakT, hic, brokenSp, brokenRim, TREL, beakMax: mx(...beak) };
})();

/* squash: everything that would pass through the wall is flattened on it and pushed outwards */
function wallSquash(center, amt = 1) {
  return P => {
    const lim = -.006; if (P[0] < lim - .05) return P; const pen = P[0] - lim, x = pen > 0 ? lim - .004 * (1 - exp(-pen * 8)) - .012 * hash((P[1] * 400) | 0, (P[2] * 400) | 0) * 0 : P[0];
    const d = mx(0, pen) * amt, dy = P[1] - center[1], dz = P[2] - center[2], r = hypot(dy, dz) + .05, k = d * .55 / r; return [pen > 0 ? lim - .03 * exp(-pen * 14) - .002 : x, P[1] + dy * k, P[2] + dz * k];
  };
}
function simBike(tau) {
  const a = SIM.at(tau), b = { time: T.hit + tau * 8, th: crankAng(T.hit) - tau * 14, wa: wheelAng(T.hit), chainSlack: 1, m: {} };
  for (const k of ['RA', 'FA', 'BB', 'ST', 'HT', 'HB', 'SAD', 'STEM', 'BAR']) b[k] = a(k); for (const k of ['TT', 'DT', 'SM', 'CS', 'SS', 'FK']) b.m[k] = a(k);
  const gr = a('GR'), gl = a('GL'); b.barBend = clamp((gr[0] - gl[0]) * 1.2, -.8, .8);
  for (const [pre, hub] of [['F', 'FA'], ['R', 'RA']]) {
    const rim = [], tyre = [], sp = [], rk = [], tk = []; let loose = 0;
    for (let i = 0; i < NSP; i++) { rim.push(a(pre + 'r' + i)); tyre.push(a(pre + 't' + i)); sp.push(tau < SIM.brokenSp[pre][i]); rk.push(tau < SIM.brokenRim[pre][i]); }
    const h = b[hub], d0 = sub(rim[0], h); const ang = atan2(d0[1], d0[0]); b['w' + pre] = { hub: h, axis: [0, 0, 1], e1: [1, 0, 0], e2: [0, 1, 0], rim, tyre, spoke: sp, rimOk: rk, tyreOk: null, ang };
  }
  b.noBell = tau > .031; b.noLamp = tau > .02; b.noRack = tau > .05; b.noChain = tau > .038; b.sadTilt = atan2(b.SAD[1] - b.ST[1], b.SAD[0] - b.ST[0]) - 1.83;
  b.loose = []; if (tau > .031) { const P = a('BELL'), ax = norm([sin(tau * 60), cos(tau * 60), .4]); b.loose.push({ P, s: c => domeSVG(c, P, .027, ax) }); }
  if (tau > .02) { const P = a('LAMP'); b.loose.push({ P, s: c => { const q = c.p(P), d = [cos(tau * 45), sin(tau * 45), .2]; return tube(c, [mad(P, d, -.022), mad(P, d, .022)], .03, BCOL.dark, { cap: 'butt' }) + glow(q[0], q[1], .07 * q[3], '#fff2c0', .5 * exp(-mx(0, tau - .02) * 8)); } }); }
  if (tau > .05) { const P = a('REC'); b.loose.push({ P, s: c => boxRot(c, P, [.085, .04, .06], -tau * 9, '#f08a1c') }); }
  if (tau > .043) { const P = a('PEDR'); b.loose.push({ P, s: c => { const d = [cos(tau * 70), sin(tau * 70), 0], n = [0, 0, .04]; return tube(c, [add(mad(P, d, -.05), n), add(mad(P, d, .05), n)], .011, BCOL.dark) + tube(c, [sub(mad(P, d, -.05), n), sub(mad(P, d, .05), n)], .011, BCOL.dark) + tube(c, [add(mad(P, d, .05), n), sub(mad(P, d, .05), n)], .009, BCOL.amber); } }); }
  return b;
}
function boxRot(cam, c, h, a, col) {
  const ca = cos(a), sa = sin(a), v = (x, y, z) => add(c, [x * h[0] * ca - y * h[1] * sa, x * h[0] * sa + y * h[1] * ca, z * h[2]]), rn = (x, y, z) => [x * ca - y * sa, x * sa + y * ca, z], base = C(col); let s = '';
  for (const [N, p] of [[[1, 0, 0], [[1, -1, -1], [1, 1, -1], [1, 1, 1], [1, -1, 1]]], [[-1, 0, 0], [[-1, -1, -1], [-1, 1, -1], [-1, 1, 1], [-1, -1, 1]]], [[0, 1, 0], [[-1, 1, -1], [1, 1, -1], [1, 1, 1], [-1, 1, 1]]], [[0, -1, 0], [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]]], [[0, 0, 1], [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]]], [[0, 0, -1], [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1]]]]) { const Nw = rn(...N), P = p.map(q => v(...q)), m = mul(add(P[0], P[2]), .5), vd = cam.vd(m); if (dot(Nw, vd) <= 0) continue; s += poly(cam, P, hex(shade(base, Nw, vd, m, .1)), 'stroke="#4a2204" stroke-width=".8"'); }
  return s;
}
function simPose(tau, o = {}) {
  const a = SIM.at(tau), sp = []; for (let i = 0; i < 8; i++) sp.push(a('s' + i));
  const hd = a('hd'), f = norm(sub(a('sn'), hd)), u = norm(sub(a('cr'), hd)), SR_ = a('SR'), SL_ = a('SL'), PR_ = a('PR'), PL_ = a('PL'), bs = norm(add(sub(SR_, SL_), sub(PR_, PL_)));
  const cr = SIM.beak(tau) / BL / .84, acc = clamp(SIM.g(tau) / 120), late = ss(.12, .2, tau), rag = late;
  const pose = {
    time: T.hit + tau * 12, wind: 1 - ss(.0, .03, tau), spine: sp, rad: SR.map((r, i) => { const bulge = 1 + acc * .22 * ss(0, 3, i) * ss(7, 4, i); return [r[0] * bulge, r[1] * bulge]; }), bs, head: { c: hd, f, u },
    ruffle: ss(.012, .06, tau) * (1 - .55 * late), bald: .34 * ss(.02, .08, tau), wScale: 1,
    eye: { size: 1 + .28 * ss(-.02, .012, tau) * (1 - .4 * late), gaze: rag ? [.5 * sin(tau * 23), .5 * cos(tau * 17)] : [.9, -.1], lidU: lerp(.0, .0, 1), lidL: 0, tilt: 0, brow: .9, browTilt: -.35, pupil: lerp(1, .55, ss(0, .02, tau)) },
    beak: { open: .05 + .5 * ss(.004, .04, tau) * (1 - .3 * late) + .12 * rag * sin(tau * 40), crumple: clamp(cr), pouch: 1, inflate: ss(.006, .03, tau) * (1 - ss(.055, .12, tau) * .8) * 1.0 + .12 * rag * sin(tau * 31) },
    wings: [], legs: [], marks: MARKS, cheek: 1, crest: .5 * ss(.005, .04, tau),
  };
  pose.hsd = headFrame(pose.head).s;
  for (const sd of [1, -1]) {
    const s = sd > 0 ? 'R' : 'L', S = a('S' + s), El = a('E' + s), W = a('W' + s), F = a('T' + s), k = ss(.02, .07, tau); const fore = norm(sub(W, El)), away = norm(sub(mix3(S, El, .5), sp[4])), tr0 = norm([-.8, -.32, sd * .28]), back = norm(sub(sp[1], sp[4])); let tr1 = norm(sub(back, mul(fore, dot(back, fore) * .85))); tr1 = norm(add(tr1, mul(away, .25)));
    pose.wings.push({ side: sd, S, E: El, W, F, trail: norm(mix3(tr0, tr1, k)), trailE: norm(mix3([-.92, -.2, sd * .1], tr1, k)), spread: .62 + .3 * k, alula: norm(mix3([.35, -1, -sd * .1], mul(tr1, -1), k)) });
    const P = a('P' + s), K = a('K' + s), A = a('A' + s), Ft = a('F' + s), tar = norm(sub(Ft, A)); let fd = norm(cross(tar, bs)); if (dot(fd, sub(sp[3], sp[1])) < 0) fd = mul(fd, 1); fd = norm(add(mul(fd, -1), mul(tar, .5))); if (tau < .02) fd = norm(mix3([1, 0, 0], fd, tau / .02)); const fu = norm(sub(mul(tar, -1), mul(fd, dot(mul(tar, -1), fd))));
    pose.legs.push({ side: sd, H: P, K, A, F: Ft, fd, fu, spread: 1 + .4 * k, curl: .3 * sin(tau * 50 + sd) * k });
  }
  return Object.assign(pose, o);
}
