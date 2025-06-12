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
