/* ============================================================ boot: worker (sound), renderer hook, or interactive player */
if (typeof document === 'undefined') { /* inside the audio worker */
  const a = AUDIO.synth(48000); postMessage({ L: a.L, R: a.R, sr: a.sr }, [a.L.buffer, a.R.buffer]);
} else {
  const stage = document.getElementById('stage'), ui = document.getElementById('ui'), root = document.documentElement;
  const draw = (t, ft) => { const s = filmFrame(t, ft); stage.innerHTML = s; return s.length; };
  window.__frame = draw; window.__SIM = SIM; window.__synth = () => AUDIO.synth(48000);
  if (!location.hash.startsWith('#render')) {
    LIVE = true; let ctx = null, buffer = null, src = null, playing = false, pos = 0, t0 = 0, want = false, full = false;
    const clock = () => (ctx ? ctx.currentTime - (ctx.outputLatency || ctx.baseLatency || 0) : performance.now() / 1000);
    const overlay = msg => { ui.innerHTML = msg ? `<g style="cursor:pointer"><rect width="1920" height="1080" fill="#02060a" opacity=".45"/><circle cx="960" cy="540" r="118" fill="#05090d" opacity=".82" stroke="#ffb52e" stroke-width="7"/><path d="M922,474L1030,540L922,606Z" fill="#ffb52e"/><text x="960" y="724" text-anchor="middle" font-family="Bahnschrift,DIN Alternate,Arial,sans-serif" font-size="38" font-weight="700" fill="#eef6fa" letter-spacing="2">${msg}</text><text x="960" y="772" text-anchor="middle" font-family="Bahnschrift,DIN Alternate,Arial,sans-serif" font-size="22" fill="#9fb3bf">click: play / pause   ·   ← →: single frames   ·   R: restart   ·   Q: full render quality (slow)</text></g>` : ''; };
    const still = t => { const l = LIVE; LIVE = false; draw(t, t); LIVE = l; };
    function adopt(L, R, sr) { if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: sr }); buffer = ctx.createBuffer(2, L.length, sr); buffer.copyToChannel(L, 0); buffer.copyToChannel(R, 1); if (want) start(); }
    let pcm = null; const got = m => { pcm = m; if (want) adopt(m.L, m.R, m.sr); };
    try { const code = root.querySelector('script').textContent, w = new Worker(URL.createObjectURL(new Blob([code], { type: 'text/javascript' }))); w.onmessage = e => { got(e.data); w.terminate(); }; w.onerror = () => { w.terminate(); pcm = null; fallback = true; if (want) sync(); }; } catch { fallback = true; }
    var fallback; const sync = () => setTimeout(() => got(AUDIO.synth(48000)), 30);
    function start() { ctx.resume(); src = ctx.createBufferSource(); src.buffer = buffer; src.connect(ctx.destination); if (pos >= DUR - .02) pos = 0; src.start(0, pos); t0 = clock() - pos; playing = true; overlay(''); requestAnimationFrame(loop); }
    function pause() { if (playing) { pos = clamp(clock() - t0, 0, DUR); playing = false; try { src.stop(); } catch { } src.disconnect(); } }
    function loop() { if (!playing) return; const t = clock() - t0; if (t >= DUR) { pause(); pos = DUR; still(14.86); overlay('REPLAY'); return; } draw(clamp(t, 0, DUR - 1e-4), clamp(t, 0, DUR - 1e-4)); requestAnimationFrame(loop); }
    function toggle() { if (playing) { pause(); still(pos); overlay('PAUSE'); return; } want = true; if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 48000 }); if (buffer) start(); else { overlay('SYNTHESISING SOUND …'); if (pcm) adopt(pcm.L, pcm.R, pcm.sr); else if (fallback) sync(); } }
    root.addEventListener('click', toggle);
    addEventListener('keydown', e => { if (e.key === ' ') { e.preventDefault(); toggle(); } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { pause(); pos = clamp(round(pos * FPS + (e.key === 'ArrowRight' ? 1 : -1)) / FPS, 0, DUR - 1 / FPS); overlay(''); still(pos + 1e-6); } else if (e.key === 'r' || e.key === 'R') { pause(); pos = 0; want = false; toggle(); } else if (e.key === 'q' || e.key === 'Q') { full = !full; LIVE = !full; } });
    still(14.86); overlay('VERSUCH 047-P');
  }
}
