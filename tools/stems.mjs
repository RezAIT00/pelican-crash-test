// node tools/stems.mjs : solo every stem and print its loudest 200 ms (above 150 Hz, where small speakers live) next to the full mix at that moment
import { bundle } from './bundle.mjs';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'src', '12-audio.js'), 'utf8');
const names = [...new Set([...src.matchAll(/stem\('(\w+)'\)/g)].map(m => m[1]))];
const { AUDIO } = bundle(['AUDIO']);
const hp = B => { const k = Math.exp(-2 * Math.PI * 150 / 48000), o = new Float32Array(B.length); let x1 = 0, y = 0, x2 = 0, z = 0; for (let i = 0; i < B.length; i++) { y = k * (y + B[i] - x1); x1 = B[i]; z = k * (z + y - x2); x2 = y; o[i] = z; } return o; };
const W = 9600, rms = (a, k) => { let e = 0; for (let i = k; i < k + W && i < a.length; i++) e += a[i] * a[i]; return 10 * Math.log10(e / W + 1e-12); };
const full = AUDIO.synth(48000), fl = hp(full.L), fr = hp(full.R), fm = k => Math.max(rms(fl, k), rms(fr, k));
for (const n of names) { const { L, R } = AUDIO.synth(48000, n), l = hp(L), r = hp(R); let best = -200, at = 0; for (let k = 0; k < l.length; k += 2400) { const v = Math.max(rms(l, k), rms(r, k)); if (v > best) { best = v; at = k; } } let pk = 0; for (let i = 0; i < L.length; i++) pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i])); console.log(n.padEnd(10), 't=' + (at / 48000).toFixed(2).padStart(5), 'stem', best.toFixed(1).padStart(6), 'mix', fm(at).toFixed(1).padStart(6), 'peak', pk.toFixed(2)); }
