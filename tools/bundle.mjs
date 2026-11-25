// Load the film's modules in node without a DOM (everything except the player touches no document at load time)
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
export function bundle(names) {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const js = readdirSync(join(root, 'src')).filter(f => f.endsWith('.js') && !f.startsWith('99')).sort().map(f => readFileSync(join(root, 'src', f), 'utf8')).join('\n');
  return new Function(`'use strict';\n${js}\nreturn {${names.join(',')}};`)();
}
