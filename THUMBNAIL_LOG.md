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

## Commit 8137097 (2025-06-11)
**Strategy:** Replace WebGL rendering with 2D canvas drawing and convert each canvas to an image once rendered.
**Steps:** Removed shader code from `buildThumbnail.js`, drew video frames with `drawImage`, kept the sequential queue intact.
**Expected:** Stable thumbnails matching the previous red threshold style.
**Observed:** Thumbnails appeared in all cells but showed raw video frames with no red threshold effect.
**Next:** Post-process the drawn frame to apply the threshold filter using pixel data.

## Commit <next>
**Strategy:** Recreate the old shader in 2D canvas. Pixels are converted to grayscale using 0.299/0.587/0.114 weights and compared to a 0.22 threshold. Bright values are cleared, dark ones recoloured with a vertical red gradient.
**Steps:** Updated `applyThresholdEffect` to loop over each scanline, calculate grayscale, apply transparency above the threshold, and fill remaining pixels with red. Updated README with the new description.
**Expected:** Thumbnails match the previous shader effect with red silhouettes on transparency.
**Observed:** Thumbnails render, but aspect ratios differ between selector grids, causing distortion.
**Next:** Crop video frames during capture to emulate `object-fit: cover`.

## Commit <new>
**Strategy:** Preserve video aspect ratio when drawing to the canvas.
**Steps:** Updated `drawFrameToCanvas` to calculate crop rectangles and draw with `drawImage(video, sx, sy, sw, sh, 0, 0, cw, ch)`. Added inline `objectFit: cover` style when replacing the canvas with an image.
**Expected:** All grids display thumbnails that cover their cell without stretching.
**Observed:** All thumbnails now fill their cells correctly without distortion.
**Next:** Confirm stable sizing across archives and adjust CSS only if necessary.

## Commit <latest>
**Strategy:** Preload all thumbnails once during site startup and reuse them.
**Steps:** Added `preloadThumbnails()` which generates thumbnail images at a fixed size and caches the data URLs. `gridManager.js` now waits for this preload before building the first selector.
**Expected:** Thumbnails appear instantly when selectors are shown with no additional rendering cost.
**Observed:** Prebuilt images load quickly across all selectors without rebuilding.
**Next:** Monitor memory impact but keep the preload approach.

## Commit <newer>
**Strategy:** Generate thumbnails on demand using each cell's dimensions.**
**Steps:** Removed the preload step. `captureThumbnail` now sizes its canvas from `getBoundingClientRect()` and `buildThumbnail` replaces the placeholder with the generated image. Inline width/height styles were removed so CSS controls layout.**
**Expected:** Thumbnail grid stays perfectly balanced with 3×3 layout and no distortions.**
**Observed:** Thumbnails now fill their cells consistently across all selectors.**
**Next:** Evaluate performance when many selectors are opened.**

## Commit d2866de (2025-06-12)
**Strategy:** Adjust CSS so preloaded thumbnails do not alter the selector grid layout.
**Steps:** Added `grid-auto-rows: 1fr` and explicit 100% sizing to `.selector-grid` and `.thumbnail-cell` in `layout.css`.
**Expected:** The selector grid consistently shows a 3\u00d73 layout with thumbnails filling each cell.
**Observed:** Thumbnails fit correctly within their cells and the grid no longer stretches vertically.
**Next:** Continue monitoring grid behavior as more archives are added.
