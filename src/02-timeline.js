/* ============================================================ timeline: one clock for picture, simulation and sound */
const DUR = 15, FPS = 60;
const T = {
  lamps: [.14, .38, .62, .86, 1.08], bell0: 1.27,
  count: [1.5, 2.0, 2.5], go: 3.0,
  crank: 5.0, front: 5.5, over: 6.0, pov: 6.25, wall: 6.5,
  hit: 6.75, slowEnd: 9.5,
  xray: 9.5, lab: 10.75, real: 12.5, end: 13.5,
  pop: 13.82, turn: 13.98, stamp: 14.36, bell: 14.72,
};
/* bicycle geometry (bike-local: x forward, y up, z right-hand side towards the main camera) */
const G = {
  R: .315, RA: [-.47, .315, 0], FA: [.50, .315, 0], BB: [-.05, .285, 0], ST: [-.185, .735, 0], HT: [.315, .775, 0], HB: [.35, .62, 0],
  SAD: [-.215, .845, 0], STEM: [.293, .865, 0], BAR: [.375, .905, 0], CR: .125, PZ: .105,
};
/* ---- drive: v(t) in m/s, 80 km/h = 22.222 */
const VMAX = 80 / 3.6;
function vel(t) { if (t < T.go) return 0; const x = inv(T.go, 5.15, t); return VMAX * (x * x * (3 - 2 * x)); }
const POS = (() => { const N = 4096, a = new Float64Array(N + 1); for (let i = 1; i <= N; i++) { const t = (i - .5) / N * T.hit; a[i] = a[i - 1] + vel(t) * T.hit / N; } return a; })();
function travel(t) { const u = clamp(t / T.hit) * 4096, i = mn(floor(u), 4095); return lerp(POS[i], POS[i + 1], u - i); }
const BEAK_REACH = 1.033;                         // bike origin -> beak tip in ride pose (tuned in pelican.js)
const X_HIT = -BEAK_REACH;                        // bike origin at first contact (wall face is x = 0)
const X_START = X_HIT - POS[4096];
function bikeX(t) { return X_START + travel(t); }
const wheelAng = t => -(travel(t) / G.R);
/* pedal cadence: absurd, up to 250 rpm */
const CRANK = (() => { const N = 2048, a = new Float64Array(N + 1); for (let i = 1; i <= N; i++) { const t = (i - .5) / N * T.hit; a[i] = a[i - 1] + (vel(t) / VMAX) * 4.1 * TAU * T.hit / N; } return a; })();
function crankAng(t) { const u = clamp(t / T.hit) * 2048, i = mn(floor(u), 2047); return .55 - lerp(CRANK[i], CRANK[i + 1], u - i); }
/* ---- simulation time (seconds after first contact) as a function of film time */
const TAU_SLOW = 1 / 30;
function tauOf(t) {
  if (t < T.hit) return t - T.hit;
  if (t < T.slowEnd) { const x = t - T.hit; return x * TAU_SLOW * .62 + pow(x / 2.75, 2) * .052; }
  if (t < T.lab) return tabS([[9.5, .0], [9.72, .001], [10.55, .058], [10.75, .06]], t);
  if (t < T.real) return tabS([[10.75, 0], [11.45, .05], [11.6, .05], [11.95, .012], [12.05, .012], [12.45, .085], [12.5, .087]], t);
  return .105 + (t - T.real);
}
/* inverse for the slow-motion segment: used to place sounds on simulated events */
function tOfTau(tau) { let a = T.hit, b = T.slowEnd; for (let i = 0; i < 40; i++) { const m = (a + b) / 2; if (tauOf(m) < tau) a = m; else b = m; } return (a + b) / 2; }
const SLOW_MAX = tauOf(T.slowEnd - 1e-6);
