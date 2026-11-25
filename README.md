# Pelican vs. Concrete, 80 km/h

A 15-second crash test of a pelican on a bicycle. Every frame is SVG drawn by code, the crash is a physics simulation, and all the sound is synthesized. No images, recordings or libraries.

## Download

| File | What it is |
|---|---|
| [pelican-crash-test.mp4](https://github.com/RezAIT00/pelican-crash-test/releases/latest/download/pelican-crash-test.mp4) | The finished film, 1920×1080, 60 fps, with sound (33 MB) |
| [pelican-crash-test.svg](https://github.com/RezAIT00/pelican-crash-test/releases/latest/download/pelican-crash-test.svg) | The live version in one file (242 KB). Open it in a browser and click to play |
| [Source code (zip)](https://github.com/RezAIT00/pelican-crash-test/archive/refs/heads/main.zip) | Everything in this repository |

The SVG redraws every frame live, so it can stutter. The MP4 is the smooth version.

## Build it yourself

The SVG needs only Node. The film also needs Chrome (set `CHROME` to its path if it isn't in the default Windows location) and ffmpeg.

```
node tools/build.mjs                   # src/*.js -> dist/pelican-crash-test.svg
node tools/audio.mjs build/audio.wav   # soundtrack
node tools/render.mjs                  # 900 frames -> build/seg
node tools/encode.mjs                  # -> dist/pelican-crash-test.mp4
```

Made with Claude Opus 5.5.
