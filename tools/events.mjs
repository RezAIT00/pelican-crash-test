import { bundle } from './bundle.mjs';
const { SIM, tOfTau, SLOW_MAX, T } = bundle(['SIM', 'tOfTau', 'SLOW_MAX', 'T']);
console.log('slowmax', SLOW_MAX, 'gpeak', SIM.gPeak, SIM.gPeakT, 'beakMax', SIM.beakMax, 'hic', SIM.hic);
for (const e of SIM.ev.slice().sort((a, b) => a.tau - b.tau)) console.log(e.tau.toFixed(4), e.tau <= SLOW_MAX ? 't=' + tOfTau(e.tau).toFixed(3) : 'real=' + (T.real + e.tau - .105).toFixed(3), e.type, e.tag || e.pre || '', (e.mag ?? 0).toFixed(2), 'x=' + e.p[0].toFixed(2), 'y=' + e.p[1].toFixed(2));
