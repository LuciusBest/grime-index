# Grime Index (New Interface)

This repository is being rebuilt with a simplified layout.
General development notes are stored in `NEW/NEW_README.md`.
Thumbnail rendering experiments are tracked in `THUMBNAIL_LOG.md`.

## Latest Thumbnail Findings

- **Strategy:** Switched from WebGL to 2D canvas rendering with a post-process threshold filter.
- **Observed:** After the switch, raw video frames were displayed without the expected red effect.
- **Correction:** Added pixel manipulation that turns dark areas transparent and light areas red.
