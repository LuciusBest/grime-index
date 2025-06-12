# Highlight Feature Development Log

This file tracks the progress of the highlight feature which introduces optional visual highlighting when playing archives.

## 2025-06-11 – Commit 1
✅ Initialized the highlight log.
💡 Created this file to track progress of the highlight feature.
⚠️ No code added yet.
📍 Next: implement highlight toggle using shaders.

## 2025-06-11 – Commit 2
✅ Added highlight toggle button and shader switching logic.
💡 Introduced `highlightEnabled` flag and `applyHighlight()` to reinitialize video shaders.
⚠️ Existing players refresh shaders on toggle; older browsers may briefly flash.
📍 Next: refine button styling and test multiple open players.

