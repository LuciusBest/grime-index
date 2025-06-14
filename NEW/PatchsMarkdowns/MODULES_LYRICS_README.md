# Modules & Lyrics Display Development Log

## 2025-06-14 – Planning Phase

✅ **Legacy understanding**
- `textManagerLyricsAnimation.js` loads the active archive JSON and binds to a single `background-video` element.
- It injects speaker, instrumental and word spans into fixed modules `#speaker`, `#instrumental` and `#lyrics`.
- Word spans receive a `bump` class when playback reaches their timestamp for karaoke-style animation.

🔍 **Observations**
- Segments and words are synced on every `timeupdate` event of the bound video.
- DOM expects `.inner_text` containers inside each module for text updates.
- Active words are tracked in a `Set` to avoid retriggering animations when seeking backwards.

🧠 **Dependencies**
- Archive JSON loaded via `loadActiveArchiveData()`.
- Access to the playing `<video>` element.
- CSS classes from `OLD/css/visualizer.css` and `textAnimations.css` drive the appearance.

💡 **Planned strategy**
- Replace direct video/query bindings with `activeMedia.js` callbacks to obtain the current highlighted player and its archive data.
- Render the modules inside a new `#liveText` overlay that follows highlight changes.
- Reuse the existing karaoke logic but adapt selectors to the new container.

⚠️ **Potential risks**
- Frequent highlight changes may create race conditions while fetching archives.
- Styling from the legacy CSS might clash with the modern layout if not scoped correctly.
- Performance concerns if multiple modules listen to rapid `timeupdate` events simultaneously.


## 2025-06-14 – Implementation Kickoff

✅ Added `modulesLyrics.js` to render speaker, instrumental and lyrics modules dynamically inside `#liveText`.
✅ Created dedicated `modulesLyrics.css` with styles copied from legacy `visualizer.css`.
💡 Utilizes `activeMedia` to track highlighted player and archive data.
📍 Next: refine positioning and test multiple highlight transitions.

## 2025-06-14 – Player-cell embedding

✅ `#liveText` now attaches to the highlighted player cell via `activeMedia` events.
✅ Added scaling logic to keep text modules proportional to cell size.
⚠️ Monitor highlight swaps to ensure overlays move smoothly.

## 2025-06-14 – Per-Cell Containers

✅ Each player cell now includes an empty `.liveText` placeholder created by `gridManager`.
✅ The overlay wrapper moves into the highlighted cell's container and only that container stays visible.
✅ Removed the global `#liveText` element and switched scaling to `font-size` to avoid transforms.
