import { loadActiveArchiveData } from "../data/dataLinker.js";

const video = document.getElementById("background-video");
let archiveData = {};
const ACTIVE_DURATION = 500; // ms
const TOLERANCE = 0.03; // secondes
const activeWords = new Map();

loadActiveArchiveData()
  .then((data) => {
    archiveData = data;

    function update() {
      const currentTime = video.currentTime;
      const currentSegment = archiveData.segments.find(
        (s) => currentTime >= s.start && currentTime <= s.end
      );

      if (!currentSegment || !currentSegment.words) {
        requestAnimationFrame(update);
        return;
      }

      const words = document.querySelectorAll("#lyrics .lyric-word");

      currentSegment.words.forEach((word, index) => {
        const el = words[index];
        if (!el) return;

        const wordId = `${currentSegment.start}-${index}`;
        const isActive = activeWords.has(wordId);

        if (!isActive && currentTime >= word.start - TOLERANCE) {
          activeWords.set(wordId, currentTime);
          el.classList.add("bump");
        }

        if (isActive) {
          const triggeredAt = activeWords.get(wordId);
          if ((currentTime - triggeredAt) * 1000 > ACTIVE_DURATION) {
            el.classList.remove("bump");
            activeWords.delete(wordId);
          }
        }
      });

      requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
  })
  .catch((err) => console.error("❌ Erreur dans textAnimations.js :", err));
