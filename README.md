# Grime Index

This repository contains a small web application used to visualize video archives of grime performances. It combines HTML, CSS, JavaScript and WebGL shaders to present interactive transcripts synchronized with video playback.

## Project structure

```
assets/   - fonts and logos used by the interface
css/      - stylesheets for layout, headers, timeline and animations
data/     - JSON archives and a globalIndex.json index of all segments
js/       - JavaScript modules powering the site
shaders/  - GLSL fragment shaders used by the WebGL visualizer
index.html - main entry point of the site
```

### HTML layout

`index.html` contains the main layout. A `<canvas>` element covers the screen to display a WebGL effect while the original `<video>` element is hidden. Central modules show the current speaker, instrumental and lyrics. A timeline at the bottom allows play/pause and displays speaker and instrumental segments.

Scripts at the end of the page load data and initialize features:

- `videoPlayer.js` – controls video playback and updates the progress bar.
- `dataLinker.js` – selects a video and loads its associated JSON archive.
- `textManagerLyricsAnimation02.js` – displays lyrics word‑by‑word in sync with the video.
- `timeline03.js` – builds the interactive timeline for speakers and instrumentals.
- `js/SHADER/videoShader.js` – applies a chosen fragment shader from the `shaders/` folder.

### Stylesheets

The `css/` folder contains several files:

- `main_style.css` sets up global page layout.
- `header.css`, `topbar.css` and `grid.css` style optional header elements.
- `timeline.css` contains the timeline and progress bar styles.
- `visualizer.css` and `textAnimations.css` define animations for the lyric display.
- `reset.css` provides a basic reset.

### JavaScript modules

The `js/` directory contains modules used by the main page as well as utilities for future features. For example, `filters/` contains scripts to filter the global index by speaker or instrumental and `AudioReactiveType/` provides an audio‑reactive typography experiment.

### Data files

The `data/` directory stores transcript JSON files such as `ARCHIVE_007_data.json`. Each archive lists segments with timestamps, speakers, lyrics, and instrumental information. `globalIndex.json` aggregates data across all archives to enable searching and filtering.

### Shaders

The `shaders/` folder contains fragment shaders used by `videoShader.js`. The shader to load is specified via a `<script id="active-shader" data-shader="..."></script>` tag in `index.html` (e.g. `threshold_grey_gradient`).

## Running the site

Open `index.html` in a modern browser. The page will load a random archive, apply the WebGL shader effect, and display the synchronized transcript and timeline.

