# Highlight & Focus Performance Notes

## 2025-06-12 – 19:50

- 📊 A full promotion cascade from player-cell-4 to player-cell-0 takes roughly 0.8s.
- ⏱ Measured `cascadePromote()` with `console.time` and observed around 800ms total.
- ✨ Each promotion step includes a 0.1s transition and a 0.1s delay.
- 📍 Review whether the remaining child-close delay (0.3s) should be shortened.

## 2025-06-12 – 23:01

- ⏲ Restored 0.3s animations for all layout movements.
- 📏 `cascadePromote()` still uses a 0.1s delay between steps for a quick climb.
- ❓ Measure again to confirm the cascade duration with slower transitions.
