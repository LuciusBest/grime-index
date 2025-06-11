# Thumbnail Rendering Debug Log

This file tracks attempts to generate thumbnails for the selector grid.
Each entry lists the strategy used, implementation steps, expected outcome,
actual result, and next planned action.

## Commit f1d6d98 (2025-06-11)
**Strategy:** Load each video and draw a frame to a WebGL canvas.
**Steps:** Added `buildThumbnail.js` using WebGL shaders and inserted canvases for each archive in `gridManager.js`.
**Expected:** Thumbnails render with visual shader effect.
**Observed:** Thumbnails sometimes appeared but often failed when many were created at once. Browsers reported reaching WebGL context limits.
**Next:** Reduce WebGL usage and render thumbnails sequentially to avoid context exhaustion.

## Commit 991d9dd (2025-06-11)
**Strategy:** Queue thumbnail rendering one at a time with WebGL, replacing each canvas with an exported image and showing a placeholder while waiting.
**Steps:** Introduced `processQueue` in `buildThumbnail.js`, added `.thumb-fallback` placeholder and error element. Canvases now convert to images after drawing and release the WebGL context. Updated `gridManager.js` to build thumbnails without awaiting each one.
**Expected:** Thumbnails appear sequentially with reduced WebGL load and fallback on failure.
**Observed:** Only "Loading..." overlays show in each cell. No canvases or images appear, leaving blank cells.
**Next:** Rework rendering to use a simpler 2D canvas approach and confirm the elements are inserted correctly.

## Commit <next> (pending)
**Strategy:** Replace WebGL rendering with 2D canvas drawing. Continue using the sequential queue and export each thumbnail as an image.
**Steps:** Removed shader code from `buildThumbnail.js` and implemented a simpler `drawImage` approach using a temporary `<video>` element.
**Expected:** Thumbnails draw reliably without WebGL contexts and appear progressively.
**Observed:** _(pending after test)_
**Next:** Verify thumbnails display correctly; if not, inspect video loading paths.
