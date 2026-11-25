// node tools/render.mjs [--from 0] [--to 900] [--procs 10] [--out build/seg]
// Parallel frame renderer: every worker process owns one headless Chrome. Each film frame is the linear-light average of N shutter
// samples (180 degree shutter); HUD numbers get the frame time, so they stay sharp. Chunks are stored losslessly and can be resumed.
import { fork, spawn } from 'node:child_process';
import { existsSync, mkdirSync, renameSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..'), me = fileURLToPath(import.meta.url);
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : d; };
const FPS = 60, CH = 12, out = arg('out', join(root, 'build', 'seg'));
const shutter = t => (t < 6.5 ? .5 : t < 6.75 ? .16 : t < 12.5 ? .5 : t < 13.5 ? .34 : .5);
const samples = t => (t < 3 ? 3 : t < 3.6 ? 6 : t < 5 ? 8 : t < 5.5 ? 16 : t < 6.5 ? 8 : t < 6.75 ? 10 : t < 7.3 ? 4 : t < 9.5 ? 2 : t < 9.72 ? 10 : t < 10.75 ? 2 : t < 12.5 ? 1 : t < 13.5 ? 8 : 4);
const name = c => join(out, 'c' + String(c).padStart(4, '0') + '.mkv');

if (!process.send) {
  mkdirSync(out, { recursive: true }); const from = +arg('from', 0), to = +arg('to', 900), P = +arg('procs', 10), q = [], t0 = Date.now();
  for (let c = Math.floor(from / CH); c * CH < to; c++) if (!existsSync(name(c))) q.push(c);
  const cost = c => { let s = 0; for (let f = c * CH; f < Math.min(900, (c + 1) * CH); f++) s += samples(f / FPS); return s; };
  q.sort((a, b) => cost(b) - cost(a)); const total = q.reduce((s, c) => s + cost(c), 0); let done = 0, live = 0, failed = {};
  console.log('chunks', q.length, 'samples', total);
  const start = () => { live++; const k = fork(me, process.argv.slice(2)); let cur = null; const next = () => { cur = q.shift(); k.send(cur === undefined ? 'quit' : { c: cur }); };
    k.on('message', m => { if (m === 'ready') next(); else if (m.done !== undefined) { done += cost(m.done); cur = null; const el = (Date.now() - t0) / 1000; console.log(`chunk ${m.done}  ${(100 * done / total).toFixed(1)}%  ${el.toFixed(0)}s  eta ${(el / done * (total - done)).toFixed(0)}s`); next(); } else if (m.log) console.log('worker:', m.log); });
    k.on('exit', code => { live--; if (cur !== null && cur !== undefined) { failed[cur] = (failed[cur] || 0) + 1; console.log('worker died on chunk', cur, code); if (failed[cur] < 4) { q.unshift(cur); start(); } } if (!live) { console.log('finished', ((Date.now() - t0) / 1000).toFixed(0) + 's'); process.exit(q.length ? 1 : 0); } }); };
  for (let i = 0; i < Math.min(P, q.length || 1); i++) setTimeout(start, i * 350);
} else {
  const { launch, decodePNG } = await import('./cdp.mjs');
  const c = await launch(); await c.goto(pathToFileURL(join(root, 'dist', 'pelican-crash-test.svg')).href + '#render'); if (c.logs.length) process.send({ log: c.logs.join('\n') });
  const W = 1920, H = 1080, LIN = new Float32Array(256); for (let i = 0; i < 256; i++) { const x = i / 255; LIN[i] = x <= .04045 ? x / 12.92 : Math.pow((x + .055) / 1.055, 2.4); }
  const ENC = new Uint8Array(65536); for (let i = 0; i < 65536; i++) { const x = i / 65535; ENC[i] = Math.round(255 * (x <= .0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - .055)); }
  const acc = new Float32Array(W * H * 3), rgb = Buffer.alloc(W * H * 3);
  async function shot() { for (let k = 0; ; k++) { try { const p = decodePNG(await c.shot()); if (p.w !== W || p.h !== H) throw new Error('size ' + p.w + 'x' + p.h); return p; } catch (e) { if (k > 2) throw e; } } }
  async function chunk(ci) {
    const a = ci * CH, b = Math.min(900, a + CH), tmp = name(ci).replace('.mkv', '.part.mkv');
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-', '-c:v', 'libx264rgb', '-qp', '0', '-preset', 'ultrafast', '-threads', '2', tmp], { stdio: ['pipe', 'ignore', 'inherit'] }); const fin = new Promise((res, rej) => ff.on('exit', x => (x ? rej(new Error('ffmpeg ' + x)) : res())));
    for (let f = a; f < b; f++) {
      const ft = f / FPS, n = samples(ft + 1e-9); if (n > 1) acc.fill(0);
      for (let k = 0; k < n; k++) {
        const t = ft + 1e-6 + (n > 1 ? (k + .5) / n * shutter(ft + 1e-6) / FPS : 0); await c.eval(`__frame(${t},${ft + 1e-6})`); const { bpp, data } = await shot();
        if (n === 1) { for (let i = 0, j = 0; j < rgb.length; i += bpp, j += 3) { rgb[j] = data[i]; rgb[j + 1] = data[i + 1]; rgb[j + 2] = data[i + 2]; } }
        else for (let i = 0, j = 0; j < acc.length; i += bpp, j += 3) { acc[j] += LIN[data[i]]; acc[j + 1] += LIN[data[i + 1]]; acc[j + 2] += LIN[data[i + 2]]; }
      }
      if (n > 1) { const m = 65535 / n; for (let j = 0; j < acc.length; j++) rgb[j] = ENC[(acc[j] * m + .5) | 0]; }
      if (!ff.stdin.write(Buffer.from(rgb))) await new Promise(r => ff.stdin.once('drain', r));
    }
    ff.stdin.end(); await fin; renameSync(tmp, name(ci));
  }
  process.on('message', async m => { if (m === 'quit') { await c.close(); process.exit(0); } try { await chunk(m.c); if (c.logs.length) process.send({ log: c.logs.splice(0).join('\n') }); process.send({ done: m.c }); } catch (e) { process.send({ log: String(e.stack || e) }); await c.close(); process.exit(1); } });
  process.send('ready');
}
