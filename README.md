# Grime Index

This repository contains a small web application used to visualize video archives of grime performances. It combines HTML, CSS, JavaScript and WebGL shaders to present interactive transcripts synchronized with video playback.

## Project structure

```
assets/   - fonts and logos used by the interface
css/      - stylesheets for layout, headers, timeline and animations
data/     - JSON archives and a globalIndex.json index of all segments
js/
  audio/  - audio‑reactive experiments
  data/   - archive loader and filter logic
  ui/     - interface components (timeline, lyrics, filters)
  video/  - player and WebGL controllers
shaders/  - GLSL fragment shaders used by the WebGL visualizer
index.html - main entry point of the site
```

### HTML layout

`index.html` contains the main layout. A `<canvas>` element covers the screen to display a WebGL effect while the original `<video>` element is hidden. Central modules show the current speaker, instrumental and lyrics. A timeline at the bottom allows play/pause and displays speaker and instrumental segments.

Scripts at the end of the page load data and initialize features:

- `video/videoPlayer.js` – controls video playback and updates the progress bar.
- `data/dataLinker.js` – selects a video and loads its associated JSON archive.
- `ui/lyricsDisplay.js` – displays lyrics word‑by‑word in sync with the video.
- `ui/speakerTimeline.js` – builds the interactive timeline for speakers and instrumentals.
- `video/shader/videoShader.js` – applies a chosen fragment shader from the `shaders/` folder.

### Stylesheets

The `css/` folder contains several files:

- `main_style.css` sets up global page layout.
- `header.css`, `topbar.css` style optional header elements.
- `timeline.css` contains the timeline and progress bar styles.
- `visualizer.css` and `textAnimations.css` define animations for the lyric display.
- `reset.css` provides a basic reset.

### JavaScript modules

The `js/` directory now separates code by function:

- `audio/` contains the audio‑reactive typography experiments.
- `data/` bundles the archive loader and filtering logic.
- `ui/` groups visual components like the timeline, lyrics display and filter UI.
- `video/` hosts the player and WebGL shader controllers.

### Data files

The `data/` directory stores transcript JSON files such as `ARCHIVE_007_data.json`. Each archive lists segments with timestamps, speakers, lyrics, and instrumental information. `globalIndex.json` aggregates data across all archives to enable searching and filtering.

### Shaders

The `shaders/` folder contains fragment shaders used by `videoShader.js`. The shader to load is specified via a `<script id="active-shader" data-shader="..."></script>` tag in `index.html` (e.g. `threshold_grey_gradient`).

## Running the site

Open `index.html` in a modern browser. The page will load a random archive, apply the WebGL shader effect, and display the synchronized transcript and timeline.

