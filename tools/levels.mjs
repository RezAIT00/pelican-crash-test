import { readFileSync } from 'node:fs';
const b = readFileSync(process.argv[2]), n = (b.length - 44) / 8, sr = 48000, W = Number(process.argv[3] || .25), w = Math.round(W * sr); let s = '';
for (let k = 0; k + w <= n; k += w) { let e = 0, p = 0; for (let i = k; i < k + w; i++) { const l = b.readFloatLE(44 + i * 8), r = b.readFloatLE(48 + i * 8); e += (l * l + r * r) / 2; p = Math.max(p, Math.abs(l), Math.abs(r)); } s += (k / sr).toFixed(2) + ':' + (10 * Math.log10(e / w + 1e-12)).toFixed(0) + '/' + p.toFixed(2) + '  '; }
console.log(s);
