// node tools/audio.mjs out.wav : render the soundtrack to 32-bit float WAV with the same code the SVG uses
import { bundle } from './bundle.mjs';
import { writeFileSync } from 'node:fs';
const { AUDIO } = bundle(['AUDIO']);
const t0 = Date.now(), { L, R, sr } = AUDIO.synth(48000), n = L.length; console.log('synth', Date.now() - t0, 'ms');
let bad = 0, pk = 0; for (let i = 0; i < n; i++) { if (!Number.isFinite(L[i]) || !Number.isFinite(R[i])) bad++; pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i])); } console.log('samples', n, 'bad', bad, 'peak', pk.toFixed(4));
const b = Buffer.alloc(44 + n * 8); b.write('RIFF', 0); b.writeUInt32LE(36 + n * 8, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(3, 20); b.writeUInt16LE(2, 22); b.writeUInt32LE(sr, 24); b.writeUInt32LE(sr * 8, 28); b.writeUInt16LE(8, 32); b.writeUInt16LE(32, 34); b.write('data', 36); b.writeUInt32LE(n * 8, 40);
for (let i = 0; i < n; i++) { b.writeFloatLE(L[i], 44 + i * 8); b.writeFloatLE(R[i], 48 + i * 8); }
writeFileSync(process.argv[2], b);
