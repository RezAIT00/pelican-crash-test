// Minimal zero-dependency Chrome DevTools driver used by still.mjs / render.mjs
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import zlib from 'node:zlib';

const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
export async function launch({ w = 1920, h = 1080 } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'pelican-chrome-'));
  const p = spawn(CHROME, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${dir}`, `--window-size=${w},${h}`, '--hide-scrollbars', '--mute-audio', '--no-first-run', '--no-default-browser-check', '--force-device-scale-factor=1', '--force-color-profile=srgb', '--disable-lcd-text', '--allow-file-access-from-files', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
  const url = await new Promise((res, rej) => { let s = ''; p.stderr.on('data', d => { s += d; const m = s.match(/ws:\/\/\S+/); if (m) res(m[0]); }); p.on('exit', () => rej(new Error('chrome exited: ' + s))); });
  const ws = new WebSocket(url); await new Promise(r => (ws.onopen = r));
  let id = 0; const wait = new Map(), evs = [];
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && wait.has(m.id)) { const [res, rej] = wait.get(m.id); wait.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result); } else evs.forEach(f => f(m)); };
  const send = (method, params = {}, sessionId) => new Promise((res, rej) => { const i = ++id; wait.set(i, [res, rej]); ws.send(JSON.stringify({ id: i, method, params, sessionId })); });
  const { targetInfos } = await send('Target.getTargets'); const tid = targetInfos.find(t => t.type === 'page').targetId;
  const { sessionId } = await send('Target.attachToTarget', { targetId: tid, flatten: true });
  const S = (m, p) => send(m, p, sessionId);
  await S('Page.enable'); await S('Runtime.enable');
  await S('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
  const logs = []; evs.push(m => { if (m.method === 'Runtime.exceptionThrown') logs.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text); if (m.method === 'Runtime.consoleAPICalled') logs.push(m.params.args.map(a => a.value ?? a.description).join(' ')); });
  return {
    S, logs,
    async goto(u) { const done = new Promise(r => evs.push(m => m.method === 'Page.loadEventFired' && r())); await S('Page.navigate', { url: u }); await done; },
    async eval(x) { const r = await S('Runtime.evaluate', { expression: x, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result.value; },
    async shot() { const r = await S('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true }); return Buffer.from(r.data, 'base64'); },
    async close() { try { await send('Browser.close'); } catch { } await new Promise(r => setTimeout(r, 300)); try { p.kill(); rmSync(dir, { recursive: true, force: true }); } catch { } },
  };
}
// fast PNG -> RGB(A) decode (8-bit, non-interlaced)
export function decodePNG(buf) {
  let o = 8, w = 0, h = 0, ct = 0; const idat = [];
  while (o < buf.length) { const L = buf.readUInt32BE(o), t = buf.toString('latin1', o + 4, o + 8); if (t === 'IHDR') { w = buf.readUInt32BE(o + 8); h = buf.readUInt32BE(o + 12); ct = buf[o + 17]; } else if (t === 'IDAT') idat.push(buf.subarray(o + 8, o + 8 + L)); else if (t === 'IEND') break; o += 12 + L; }
  const bpp = ct === 6 ? 4 : 3, raw = zlib.inflateSync(Buffer.concat(idat)), st = w * bpp, out = new Uint8Array(st * h);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (st + 1)], s = y * (st + 1) + 1, d = y * st, u = d - st;
    if (f === 0) out.set(raw.subarray(s, s + st), d);
    else if (f === 1) { for (let i = 0; i < st; i++) out[d + i] = raw[s + i] + (i >= bpp ? out[d + i - bpp] : 0); }
    else if (f === 2) { if (y === 0) out.set(raw.subarray(s, s + st), d); else for (let i = 0; i < st; i++) out[d + i] = raw[s + i] + out[u + i]; }
    else if (f === 3) { for (let i = 0; i < st; i++) out[d + i] = raw[s + i] + (((i >= bpp ? out[d + i - bpp] : 0) + (y ? out[u + i] : 0)) >> 1); }
    else { for (let i = 0; i < st; i++) { const a = i >= bpp ? out[d + i - bpp] : 0, b = y ? out[u + i] : 0, c = i >= bpp && y ? out[u + i - bpp] : 0, p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); out[d + i] = raw[s + i] + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c); } }
  }
  return { w, h, bpp, data: out };
}
