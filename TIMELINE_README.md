# Timeline Feature Development Log

## 2025-06-13 – 10:30

✅ Initialized TIMELINE_README.md to track timeline development.
💡 Strategy: document each implementation stage and reference the OLD timeline before porting.
⚠️ No issues yet.
📍 Next: outline DOM hooks and event flow for integration in the new layout.

## 🧩 Summary of timeline logic from OLD
- `speakerTimeline.js` builds speaker and instrumental blocks using archive segments.
- `timeline.js` manages the progress bar and cursor, updating positions as the video plays.
- Blocks highlight when active and allow seeking by clicking or dragging the timeline.
- `.timeline-row` elements with IDs `FriseTemporelle` and `FriseInstrumentale` toggle visibility on hover.
- The cursor displays the current time (`TimelineCursorTime`) alongside a vertical line.

## 🔗 Dependencies and related components
- CSS: `OLD/css/timeline.css` defines layout and animations.
- JavaScript: `OLD/js/ui/speakerTimeline.js`, `OLD/js/ui/timeline.js`.
- HTML selectors used: `#TimelineContainer`, `#TimelineLeft`, `#TimelineMiddle`, `#TimelineRight`, `#CustomTimeline`, `#TimelineProgress`, `#TimelineCursorWrapper`, `#TimelineCursorTime`, `#TimelineVerticalLine`, `.speaker-block`, `.instrumental-block`.
- Layout assumes a bottom timeline bar divided into left controls, center rows and progress bar, and right volume/shader controls.

## 2025-06-13 – 11:00

✅ Logged integration preparation for the new layout.
💡 Decided on a dedicated footer hierarchy: `#main_footer` wraps `#timeline-footer`. The footer remains 70px tall and full width with a temporary blue background.
⚠️ No implementation yet – this entry only clarifies upcoming work.
📍 Next: create the footer container in `index.html` and style it in `layout.css`.

### ✅ Implementation goals
- Reintroduce the OLD timeline UI inside the new footer.
- Bind timeline controls to the video in the currently highlighted player cell.
- Load corresponding archive JSON based on the highlighted player.

### 💡 Planned strategy for dynamic binding
1. Expose an event when `updateHighlightState()` changes the highlighted cell.
2. Timeline module listens for this event and attaches to the highlighted cell's `<video>` element.
3. Fetch the archive data for that player and rebuild speaker/instrumental blocks on each switch.
4. Pause or detach from the previous player to avoid duplicate listeners.

### ⚠️ Anticipated challenges
- Race conditions between highlight updates and JSON loading: add an `isLoading` lock or queue to prevent conflicts if the highlight switches before data finishes loading.
- Proper cleanup of old event listeners: create a `detachTimeline()` function to fully unbind listeners and UI hooks when switching players.
- Avoid visual artifacts from rapid switches: use `requestAnimationFrame` or a small delay (50–100ms) before attaching the timeline to a new video.
- Switching JSON data while a previous highlight is still closing or in mid-playback.
- Ensuring old event listeners and shaders are cleaned up when focus shifts.
- Handling cases where highlight changes rapidly before data loads.

### 📍 Precise DOM elements to reuse or refactor
- Reuse `#TimelineContainer`, `#TimelineLeft`, `#TimelineMiddle`, `#TimelineRight`, `#CustomTimeline`, `#TimelineProgress`, `#TimelineCursorWrapper`, `#TimelineCursorTime`, `#TimelineVerticalLine` from OLD.
 - Add wrapper `#main_footer` below `#overall-grid` in `index.html`; inside it place `#timeline-footer`.
- `#main_footer` auto height; `#timeline-footer` has fixed 70px height, full width, and a temporary blue background.
- Preserve original visual design: same class names and CSS from `OLD/css/timeline.css`.

## 2025-06-13 – 12:20

✅ Confirmed footer hierarchy with `#main_footer` containing `#timeline-footer`.
💡 Timeline DOM from OLD will populate `#timeline-footer`; `#main_footer` allows future footer tools.
⚠️ Prepare CSS copy from OLD without modifications.

## 2025-06-13 – 14:00

✅ Implemented dynamic timeline binding.
💡 Added data attributes to player cells and dispatched `highlightchange` events in `gridManager.js`. Created `js/timeline.js` to load archive JSON for the highlighted video and manage listeners.
⚠️ Needs further testing with rapid highlight changes.
📍 Next: refine performance and integrate additional footer tools.
