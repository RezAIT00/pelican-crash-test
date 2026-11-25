/* ============================================================ telemetry, in the house style of people who enjoy calibration certificates */
const de = (x, d = 1) => (x < 0 ? '−' : '') + abs(x).toFixed(d).replace('.', ',');
const HC = { ink: '#f2f7fa', dim: '#9fb2bf', cy: '#58d5ff', am: '#ffb52e', rd: '#ff4438', gn: '#4dff9a', bg: '#060b10' };
function tx(x, y, str, size, fill = HC.ink, o = {}) { return `<text x="${n1(x)}" y="${n1(y)}" font-size="${size}" fill="${fill}" ${o.mono ? MONO : FONT} font-weight="${o.w || 400}" text-anchor="${o.a || 'start'}"${o.ls ? ` letter-spacing="${o.ls}"` : ''}${o.op != null ? ` opacity="${n2(o.op)}"` : ''}${o.x || ''}>${esc(str)}</text>`; }
const rc = (x, y, w, h, fill, ex = '') => `<rect x="${n1(x)}" y="${n1(y)}" width="${n1(w)}" height="${n1(h)}" fill="${fill}" ${ex}/>`;
const ln = (x1, y1, x2, y2, c, w = 1, ex = '') => `<path d="M${n1(x1)},${n1(y1)}L${n1(x2)},${n1(y2)}" stroke="${c}" stroke-width="${w}" fill="none" ${ex}/>`;
function panel(x, y, w, h, o = {}) { const c = o.c || HC.cy; return rc(x, y, w, h, HC.bg, `opacity="${o.op ?? .62}"`) + `<path d="M${x},${y + 14}V${y}H${x + 14}M${x + w - 14},${y}H${x + w}V${y + 14}M${x + w},${y + h - 14}V${y + h}H${x + w - 14}M${x + 14},${y + h}H${x}V${y + h - 14}" fill="none" stroke="${c}" stroke-width="2" opacity=".85"/>`; }
/* ---- channels */
const CH = {
  v: t => (t < T.hit ? vel(t) : mx(0, SIM.v(tauOf(t)))) * 3.6 * (t >= T.real ? 0 : 1) + (t >= T.real && t < T.end ? 9 * exp(-(t - T.real) * 2) : 0),
  g: t => (t < T.hit ? abs((vel(t + .02) - vel(t - .02)) / .04 / 9.81) + .12 * abs(noise1(t * 37)) * vel(t) / VMAX : t < T.slowEnd ? SIM.g(tauOf(t)) : 0),
  b: t => (t < T.hit ? .6 * abs(noise1(t * 21, 5)) * vel(t) / VMAX : SIM.beak(tauOf(t)) * 1000),
};
const GPK = SIM.gPeak, BPK = SIM.beakMax * 1000;
function logo(x, y, s = 1, op = 1) { /* hexagon + pelican head */
  let h = ''; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + PI / 6; h += (i ? 'L' : 'M') + n1(cos(a) * 34) + ',' + n1(sin(a) * 34); }
  return `<g transform="translate(${x} ${y}) scale(${s})" opacity="${op}"><path d="${h}Z" fill="#0b1a24" stroke="${HC.ink}" stroke-width="3"/><path d="M-20,22C-16,6 -14,-2 -12,-10C-10,-19 2,-20 5,-12L27,-7C29,-6 28,-4 26,-3C18,8 6,6 2,0C0,8 4,16 6,24Z" fill="${HC.ink}"/><circle cx="-2" cy="-11" r="2.2" fill="#0b1a24"/><path d="M-30,24H30" stroke="${HC.am}" stroke-width="4"/></g>`;
}
function hudHead(t, o = {}) {
  const a = o.op ?? 1, y = o.y || 0; let s = `<g opacity="${a}" transform="translate(0 ${y})">`;
  s += `<rect x="0" y="0" width="1920" height="165" fill="${linG(0, 0, 0, 1, [[0, '#02060a', .86], [.55, '#02060a', .6], [1, '#02060a', 0]])}"/>` + logo(74, 62, .95);
  s += tx(124, 56, 'PKZ  PELIKAN-KOLLISIONS-ZENTRUM', 27, HC.ink, { w: 700, ls: 1.5 }) + tx(124, 84, 'Versuch 047-P  ·  Frontalaufprall, 100 % Überdeckung, starre Barriere', 18, HC.dim, { ls: .6 }) + tx(124, 106, 'Prüfling: Pelecanus onocrotalus, 11,4 kg, gefrühstückt', 15, HC.dim, { ls: .5, op: .85 });
  const bl = (t * 2 % 1) < .6; s += `<circle cx="${1856 - 17.5 * (o.cam || 'CAM 01').length - 82}" cy="47" r="9" fill="${bl ? HC.rd : '#4a1512'}"/>` + tx(1856 - 17.5 * (o.cam || 'CAM 01').length - 64, 56, 'REC', 24, HC.ink, { w: 700, ls: 2 }) + tx(1876, 56, o.cam || 'CAM 01', 27, HC.ink, { w: 700, a: 'end', ls: 1.5 }) + tx(1876, 84, o.rate || '1 000 Bilder/s  ·  1:1', 18, HC.dim, { a: 'end', ls: .6 });
  const tt = t < T.hit ? t - T.hit : tauOf(t), str = t < T.hit || t >= T.real ? de(t < T.hit ? tt : tt, 3) + ' s' : '+' + de(tt * 1000, 2) + ' ms'; s += tx(1876, 108, 't₀ ' + (tt >= 0 && (t >= T.real) ? '+' : '') + str, 20, t >= T.hit ? HC.am : HC.cy, { a: 'end', mono: 1, w: 700 });
  return s + '</g>';
}
function gauge(x, y, r, v, vmax, o = {}) {
  const a0 = PI * .78, a1 = PI * 2.22, A = k => lerp(a0, a1, k); let s = '', tk = ''; const pt = (k, rr) => [x + cos(A(k)) * rr, y + sin(A(k)) * rr], arc = (k0, k1, rr) => { const p = pt(k0, rr), q = pt(k1, rr); return `M${xy(p)}A${rr},${rr} 0 ${(k1 - k0) * (a1 - a0) > PI ? 1 : 0} 1 ${xy(q)}`; };
  const k = clamp(v / vmax); s += `<path d="${arc(0, 1, r)}" fill="none" stroke="#31424e" stroke-width="13"/>`; if (k > .004) s += `<path d="${arc(0, k, r)}" fill="none" stroke="${o.c || HC.cy}" stroke-width="13"/>`; if (o.lim) s += `<path d="${arc(o.lim - .006, o.lim + .006, r)}" fill="none" stroke="${HC.rd}" stroke-width="22"/>`;
  for (let i = 0; i <= 20; i++) { const p = pt(i / 20, r - 13), q = pt(i / 20, r - (i % 2 ? 19 : 27)); tk += `M${xy(p)}L${xy(q)}`; if (i % 4 === 0) { const l = pt(i / 20, r - 44); s += tx(l[0], l[1] + 6, round(vmax * i / 20), 16, HC.dim, { a: 'middle' }); } }
  s += `<path d="${tk}" stroke="${HC.dim}" stroke-width="2"/>`; const n = pt(k, r - 8), b1 = [x + cos(A(k) + PI / 2) * 4, y + sin(A(k) + PI / 2) * 4], b2 = [x + cos(A(k) - PI / 2) * 4, y + sin(A(k) - PI / 2) * 4];
  return s + `<path d="M${xy(b1)}L${xy(n)}L${xy(b2)}Z" fill="${HC.rd}"/><circle cx="${x}" cy="${y}" r="9" fill="#e8eef2"/>`;
}
function beakIcon(x, y, w, c) { /* side-on bill that crumples with the measured value */
  let d = '', e = ''; const n = 40; for (let i = 0; i <= n; i++) { const u = i / n, px = x + w * u * (1 - .84 * c), z = (1 - 4 * abs(((u * 5.5 + .25) % 1) - .5)) * 11 * c * ss(0, .15, u); d += (i ? 'L' : 'M') + n1(px) + ',' + n1(y - 9 * (1 - u * .75) + z); e = 'L' + n1(px) + ',' + n1(y + 4 + 17 * sin(pow(u, .7) * PI) * (1 + c * .9) + z * .6) + e; }
  return `<path d="M${n1(x)},${n1(y - 14)}Q${n1(x - 26)},${n1(y - 14)} ${n1(x - 26)},${n1(y + 2)}Q${n1(x - 24)},${n1(y + 16)} ${n1(x)},${n1(y + 10)}Z" fill="${HC.ink}"/><circle cx="${n1(x - 11)}" cy="${n1(y - 3)}" r="3" fill="#0a1218"/><path d="${d}${e}Z" fill="${mixC('#ffb52e', '#ff4438', c)}"/>`;
}
function hudMain(t, o = {}) {
  const op = o.op ?? 1, v = CH.v(t), g = CH.g(t), b = CH.b(t), dy = o.dy || 0; let s = `<g opacity="${n2(op)}" transform="translate(0 ${n1(dy)})">`;
  s += `<rect x="0" y="800" width="1920" height="300" fill="${linG(0, 0, 0, 1, [[0, '#000', 0], [1, '#000', .6]])}"/>`;
  /* velocity */
  s += panel(36, 836, 430, 210) + gauge(150, 950, 84, v, 100, { lim: .8 }) + tx(252, 870, 'GESCHWINDIGKEIT', 19, HC.dim, { ls: 1.2 }) + tx(252, 889, 'velocity', 15, HC.dim, { op: .7 }) + tx(446, 962, de(v, 1), 78, HC.ink, { w: 700, a: 'end' }) + tx(446, 994, 'km/h', 24, HC.dim, { a: 'end' }) + tx(252, 1028, `Soll 80,0  Δ ${de(t < T.hit ? v - 80 : -80, 1)}`, 16, HC.am, { mono: 1 });
  /* approach ruler */
  const X = t < T.hit ? -(bikeX(t) + BEAK_REACH) : 0, px = 500, pw = 800; s += panel(px, 962, pw, 84) + tx(px + 18, 990, 'ABSTAND BARRIERE  distance to barrier', 16, HC.dim, { ls: .8 }) + tx(px + pw - 18, 992, de(mx(0, X), 2) + ' m', 26, HC.ink, { a: 'end', w: 700, mono: 1 });
  const xa = px + 18, xb = px + pw - 40, k = clamp(1 - X / 58); let tk = ''; for (let i = 0; i <= 58; i += 1) { const xx = lerp(xa, xb, i / 58); tk += `M${n1(xx)},1028v${i % 10 === 8 ? -14 : -7}`; } s += `<path d="${tk}" stroke="#6f8593" stroke-width="1.5"/>` + ln(xa, 1028, xb, 1028, '#6f8593', 2) + rc(xb, 1000, 15, 34, '#b9b5ab') + ln(xa, 1028, lerp(xa, xb, k), 1028, HC.cy, 5) + `<path d="M${n1(lerp(xa, xb, k))},1026l-9,-15h18z" fill="${HC.am}"/>`;
  /* right-hand stack: beak + g */
  const bx = 1334; s += panel(bx, 766, 550, 128) + tx(bx + 20, 794, 'SCHNABELSTAUCHUNG', 19, HC.dim, { ls: 1.2 }) + tx(bx + 530, 794, 'beak deformation', 15, HC.dim, { op: .7, a: 'end' }) + beakIcon(bx + 56, 842, 150, clamp(b / 480 / .86)) + tx(bx + 530, 852, de(b, 1), 56, b > 40 ? HC.am : HC.ink, { w: 700, a: 'end' }) + tx(bx + 530, 881, `mm  (${de(b / 4.8, 0)} %)`, 18, HC.dim, { a: 'end' });
  s += rc(bx + 20, 876, 300, 9, '#22313b') + rc(bx + 20, 876, 300 * clamp(b / 480), 9, b > 200 ? HC.rd : HC.am);
  s += panel(bx, 906, 550, 140) + tx(bx + 20, 934, 'VERZÖGERUNG BRUSTBEIN', 19, HC.dim, { ls: 1.2 }) + tx(bx + 530, 934, 'sternum g-force', 15, HC.dim, { op: .7, a: 'end' }) + tx(bx + 530, 998, de(g, 1), 60, g > 20 ? HC.rd : HC.ink, { w: 700, a: 'end' }) + tx(bx + 530, 1030, 'g', 24, HC.dim, { a: 'end' });
  let d = ''; const n = 90; for (let i = 0; i <= n; i++) { const tt = t - (1 - i / n) * (t > T.hit ? 1.6 : 2.2), gg = CH.g(mx(0, tt)); d += (i ? 'L' : 'M') + n1(bx + 20 + i / n * 320) + ',' + n1(1032 - 74 * clamp(t > T.hit ? gg / 80 : gg / 3)); } s += rc(bx + 20, 952, 320, 82, '#0b141b', 'opacity=".7"'); for (let i = 1; i < 4; i++) s += ln(bx + 20, 952 + i * 20, bx + 340, 952 + i * 20, '#24343f', 1); s += `<path d="${d}L${bx + 340},1032L${bx + 20},1032Z" fill="${HC.rd}" opacity=".18"/><path d="${d}" fill="none" stroke="${HC.rd}" stroke-width="2.6"/>`;
  return s + '</g>';
}
function corners(op = .7) { return `<path d="M30,150V132H48M1872,132H1890V150" fill="none" stroke="${HC.ink}" stroke-width="2" opacity="${op}"/><path d="M960,522v12M960,546v12M942,540h12M966,540h12" stroke="${HC.ink}" stroke-width="1.6" opacity="${op * .7}"/>`; }
/* ---- countdown */
function countOverlay(t) {
  const i = T.count.findIndex((c, k) => t >= c && t < (T.count[k + 1] ?? T.go)); if (i < 0) return ''; const f = (t - T.count[i]) / .5, n = 3 - i, R = 168, cx = 960, cy = 505, pop = E.outBack(f * 3.2), fade = 1 - ss(.75, 1, f); let s = `<g opacity="${n2(fade)}">`;
  s += `<circle cx="${cx}" cy="${cy}" r="${R + 26}" fill="#05090d" opacity=".5"/><circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#28363f" stroke-width="16"/><circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${HC.rd}" stroke-width="16" stroke-dasharray="${n1(TAU * R * (1 - f))} 2000" transform="rotate(-90 ${cx} ${cy})"/>`;
  let tk = ''; for (let k = 0; k < 60; k++) { const a = k / 60 * TAU, r0 = R + 16, r1 = R + (k % 5 ? 23 : 32); tk += `M${n1(cx + cos(a) * r0)},${n1(cy + sin(a) * r0)}L${n1(cx + cos(a) * r1)},${n1(cy + sin(a) * r1)}`; } s += `<path d="${tk}" stroke="${HC.ink}" stroke-width="2" opacity=".7"/>`;
  s += `<g transform="translate(${cx} ${cy}) scale(${n3(lerp(1.6, 1, clamp(pop)))})">${tx(0, 92, n, 260, HC.ink, { a: 'middle', w: 700 })}</g>` + tx(cx, cy + R + 76, ['DREI', 'ZWEI', 'EINS'][i], 34, HC.ink, { a: 'middle', w: 700, ls: 14 }) + '</g>';
  return s;
}
function lightsRow(t) { /* three red lamps then green */
  const st = t < T.count[0] ? 0 : t < T.count[1] ? 1 : t < T.count[2] ? 2 : t < T.go ? 3 : 4; let s = panel(810, 150, 300, 88, { op: .7 }); for (let i = 0; i < 3; i++) { const on = st === 4 || i < st, c = st === 4 ? HC.gn : HC.rd, x = 870 + i * 90; s += `<circle cx="${x}" cy="194" r="29" fill="${on ? c : '#21120f'}" stroke="#000" stroke-width="4"/>`; if (on) s += glow(x, 194, 110, c, .8) + `<ellipse cx="${x - 8}" cy="183" rx="10" ry="6" fill="#fff" opacity=".7"/>`; } return s;
}
/* ---- score sheet stamps */
function stampSVG(t, t0, x, y, str, sub, rot, col) { const f = (t - t0) / .12; if (f < 0) return ''; const k = f < 1 ? lerp(3.2, 1, E.inCubic(f)) : 1 + .03 * exp(-(f - 1) * 2) * cos((f - 1) * 9), op = clamp(f * 1.6); const id = defOnce('ink', i => `<filter id="${i}" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".09" numOctaves="3" seed="4" result="n"/><feColorMatrix in="n" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -5 3.4" result="m"/><feComposite in="SourceGraphic" in2="m" operator="in" result="c"/><feDisplacementMap in="c" in2="n" scale="5"/></filter>`);
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${n3(k)})" opacity="${n2(op)}"><g filter="url(#${id})"><rect x="-345" y="-98" width="690" height="196" rx="16" fill="none" stroke="${col}" stroke-width="13"/><rect x="-325" y="-79" width="650" height="158" rx="8" fill="none" stroke="${col}" stroke-width="4"/>${tx(0, 22, str, 96, col, { a: 'middle', w: 700, ls: 5 })}${tx(0, 62, sub, 23, col, { a: 'middle', w: 700, ls: 3 })}</g></g>`; }
