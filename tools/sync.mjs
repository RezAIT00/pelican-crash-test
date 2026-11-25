// node tools/sync.mjs film.mp4 : decode the finished file and compare picture cues with sound onsets
import { execFileSync } from 'node:child_process';
const f = process.argv[2], pcm = execFileSync('ffmpeg', ['-loglevel', 'error', '-i', f, '-vn', '-ac', '1', '-ar', '48000', '-f', 'f32le', '-'], { maxBuffer: 1 << 28 }), a = new Float32Array(pcm.buffer, pcm.byteOffset, pcm.length / 4);
const yuv = execFileSync('ffmpeg', ['-loglevel', 'error', '-i', f, '-an', '-vf', 'scale=64:36,format=gray', '-f', 'rawvideo', '-'], { maxBuffer: 1 << 28 }), n = yuv.length / 2304, mean = [...Array(n).keys()].map(i => { let s = 0; for (let k = 0; k < 2304; k++) s += yuv[i * 2304 + k]; return s / 2304; });
const diff = i => { let s = 0; for (let k = 0; k < 2304; k++) s += Math.abs(yuv[i * 2304 + k] - yuv[(i - 1) * 2304 + k]); return s / 2304; };
console.log('frames', n, 'audio s', (a.length / 48000).toFixed(4));
/* sharpest energy rise within +-60 ms of a cue (2 ms windows, high-passed) */
const h = new Float32Array(a.length); for (let i = 1; i < a.length; i++) h[i] = a[i] - .9 * a[i - 1]; const E = t => { let s = 0, k = Math.round(t * 48000); for (let i = k; i < k + 96; i++) s += (h[i] || 0) ** 2; return s; };
const onset = c => { let b = 0, at = c; for (let t = c - .06; t < c + .06; t += .0005) { const r = E(t) - E(t - .002); if (r > b) { b = r; at = t; } } return at; };
const cut = c => { let b = 0, at = 0; for (let i = Math.round(c * 60) - 3; i <= Math.round(c * 60) + 3; i++) if (i > 0 && i < n && diff(i) > b) { b = diff(i); at = i; } return at / 60; };
for (const [name, t] of [['lamp 1', .14], ['lamp 3', .62], ['count 3', 1.5], ['count 2', 2], ['count 1', 2.5], ['go', 3], ['cut crank', 5], ['cut front', 5.5], ['cut drone', 6], ['cut beak cam', 6.25], ['cut wall', 6.5], ['IMPACT', 6.75], ['cut lab', 10.75], ['cut real time', 12.5], ['beak pops', 13.82], ['stamp', 14.48]]) { const o = onset(t), v = cut(t); console.log(name.padEnd(14), 'cue', t.toFixed(3), 'picture', v.toFixed(3), 'sound', o.toFixed(4), 'offset', ((o - t) * 1000).toFixed(1).padStart(6) + ' ms'); }
console.log('brightness 403-408:', mean.slice(403, 409).map(x => x.toFixed(0)).join(' '));
