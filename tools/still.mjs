// node tools/still.mjs outDir t1 t2 ...   |   node tools/still.mjs outDir --eval "<js returning svg markup>"
import { launch } from './cdp.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [out, ...ts] = process.argv.slice(2); mkdirSync(out, { recursive: true });
const c = await launch(); await c.goto(pathToFileURL(join(root, 'dist', 'pelican-crash-test.svg')).href);
if (c.logs.length) console.log(c.logs.join('\n'));
if (ts[0] === '--eval') { const r = await c.eval(`(()=>{const f=${ts[1]};return f()})()`); console.log(r); writeFileSync(join(out, (ts[2] || 'eval') + '.png'), await c.shot()); }
else for (const t of ts) {
  const t0 = Date.now(); const r = await c.eval(`__frame(${t},${t})`); const t1 = Date.now(); const b = await c.shot(); writeFileSync(join(out, 'f' + Number(t).toFixed(3).replace('.', '_') + '.png'), b);
  console.log(t, 'js', t1 - t0, 'ms, shot', Date.now() - t1, 'ms', JSON.stringify(r));
}
if (c.logs.length) console.log(c.logs.join('\n'));
await c.close();
