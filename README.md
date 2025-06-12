# Grime Index (New Interface)

This repository is being rebuilt with a simplified layout.
General development notes are stored in `NEW/NEW_README.md`.
Thumbnail rendering experiments are tracked in `THUMBNAIL_LOG.md`.

## Latest Thumbnail Findings

- **Strategy:** Use 2D canvas rendering with a shader-like threshold postprocess.
- **Observed:** Initial 2D approach drew raw frames with no effect.
- **Correction:** Pixels are now converted to grayscale and compared against a 0.22 threshold. Bright areas become fully transparent while dark areas are coloured red with a vertical gradient.
- **Fix:** Video frames are cropped to preserve aspect ratio before export so thumbnails mimic `object-fit: cover` in every grid.
