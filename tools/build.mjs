// Concatenate src/*.js into one self-contained, self-playing SVG (and an ES-free audio bundle for node)
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const js = readdirSync(join(root, 'src')).filter(f => f.endsWith('.js')).sort().map(f => readFileSync(join(root, 'src', f), 'utf8')).join('\n');
const body = `(()=>{'use strict';\n${js}\n})();`;
if (body.includes(']]>')) throw new Error('CDATA terminator inside script');
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style="background:#05070a;display:block">
<title>Versuch 047-P: Pelican vs. Concrete, 80 km/h</title>
<g id="stage"></g><g id="ui"></g>
<script type="text/javascript"><![CDATA[
${body}
]]></script>
</svg>
`;
mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'dist', 'pelican-crash-test.svg'), svg);
console.log('svg', (svg.length / 1024).toFixed(1) + ' KB');
