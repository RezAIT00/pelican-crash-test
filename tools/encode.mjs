// node tools/encode.mjs [crf] : join lossless chunks + soundtrack into the final H.264/AAC MP4 (bt709, exactly 15 s, 900 frames)
import { readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..'), seg = join(root, 'build', 'seg'), crf = process.argv[2] || '17';
const files = readdirSync(seg).filter(f => /^c\d{4}\.mkv$/.test(f)).sort(); if (files.length !== 75) throw new Error('expected 75 chunks, have ' + files.length);
writeFileSync(join(root, 'build', 'list.txt'), files.map(f => `file '${join(seg, f).replace(/\\/g, '/')}'`).join('\n'));
mkdirSync(join(root, 'dist'), { recursive: true }); const out = join(root, 'dist', 'pelican-crash-test.mp4');
execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'warning', '-f', 'concat', '-safe', '0', '-i', join(root, 'build', 'list.txt'), '-i', join(root, 'build', 'audio.wav'), '-map', '0:v', '-map', '1:a',
  '-vf', 'scale=out_color_matrix=bt709:out_range=tv:flags=lanczos+accurate_rnd+full_chroma_int,format=yuv420p,setsar=1', '-r', '60', '-frames:v', '900', '-c:v', 'libx264', '-preset', 'slow', '-crf', crf, '-profile:v', 'high', '-level', '4.2', '-g', '60', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv',
  '-c:a', 'aac', '-b:a', '320k', '-ar', '48000', '-t', '15', '-movflags', '+faststart', '-metadata', 'title=Versuch 047-P: Pelican vs. Concrete, 80 km/h', out], { stdio: 'inherit' });
console.log(out);
