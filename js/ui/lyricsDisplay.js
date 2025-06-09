import { loadActiveArchiveData } from "../data/dataLinker.js";

// Debug flag to toggle verbose logging
export const DEBUG = true;

const video = document.getElementById("background-video");
let archiveData = {};
let segments = [];
let currentSegmentId = null;
let currentSegmentIndex = 0;
const TOLERANCE = 0.03; // secondes
const SILENCE_THRESHOLD = 2.0; // secondes
let activeWords = new Set();
let rafId = null;

let currentSegment = null;
let silenceActive = false;
let lastTime = 0;

function findSegmentIndex(time) {
  let low = 0;
  let high = segments.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const seg = segments[mid];
    if (time < seg.start) {
      high = mid - 1;
    } else if (time > seg.end) {
      low = mid + 1;
    } else {
      return mid;
    }
  }
  return Math.max(0, Math.min(low, segments.length - 1));
}

loadActiveArchiveData()
  .then(json => {
    archiveData = json;
    segments = archiveData.segments || [];

    const lyricsDiv = document.querySelector("#lyrics .inner_text");
    const speakerDiv = document.querySelector("#speaker .inner_text");
    const instrumentalDiv = document.querySelector("#instrumental .inner_text");
    const infoBar = document.getElementById("infoBar");
    if (infoBar) infoBar.textContent = `Now playing: ${archiveData.title || "Archive"}`;

    const startLoop = () => {
      if (rafId) cancelAnimationFrame(rafId);
      currentSegmentIndex = findSegmentIndex(video.currentTime);
      currentSegment = segments[currentSegmentIndex] || null;
      update();
      if (DEBUG) console.log("[SYNC] frame end");
      rafId = requestAnimationFrame(update);
    };

    video.addEventListener("seeking", () => {
      if (DEBUG) console.log("[VIDEO] seeking", video.currentTime.toFixed(3));
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    });

    video.addEventListener("seeked", () => {
      if (DEBUG) console.log("[VIDEO] seeked", video.currentTime.toFixed(3));
      // Clear previous state when seeking to avoid desyncs
      activeWords = new Set();
      currentSegmentId = null;
      lastTime = video.currentTime;
      currentSegmentIndex = findSegmentIndex(video.currentTime);
      currentSegment = segments[currentSegmentIndex] || null;
      if (DEBUG && currentSegment) {
        console.log(
          `[SYNC] startLoop segment ${currentSegment.start}-${currentSegment.end}`
        );
      }
      startLoop();
    });

    video.addEventListener("timeupdate", () => {
      if (DEBUG) console.log("[VIDEO] timeupdate", video.currentTime.toFixed(3));
    });

    function update() {
      const currentTime = video.currentTime;
      if (DEBUG) console.log("[VIDEO] update", currentTime.toFixed(3));

      // 🔁 Réinitialisation des animations si retour arrière
      if (currentTime < lastTime) {
        activeWords = new Set();
      }
      lastTime = currentTime;

      // 🔇 Détection de silence (désactivée)
      /*
      const previousSegment = [...archiveData.segments]
        .filter(seg => seg.end <= currentTime)
        .sort((a, b) => b.end - a.end)[0];
      const nextSegment = [...archiveData.segments]
        .filter(seg => seg.start >= currentTime)
        .sort((a, b) => a.start - b.start)[0];

      const silenceDetected =
        previousSegment && nextSegment &&
        (nextSegment.start - previousSegment.end) >= SILENCE_THRESHOLD &&
        currentTime > previousSegment.end &&
        currentTime < nextSegment.start;

      if (silenceDetected) {
        if (!silenceActive) {
          silenceActive = true;
          lyricsDiv.innerHTML = "<span class='lyric-word'>...</span>";
        }
        if (DEBUG) console.log("[SYNC] continue loop");
        rafId = requestAnimationFrame(update);
        return;
      } else {
        silenceActive = false;
      }
      */

      // 🎙 Segment actif
      let seg = segments[currentSegmentIndex];
      if (!seg || currentTime < seg.start || currentTime > seg.end) {
        currentSegmentIndex = findSegmentIndex(currentTime);
        seg = segments[currentSegmentIndex];
        if (DEBUG && seg) {
          console.log(
            `[SYNC] new segment ${seg.start}-${seg.end} at ${currentTime.toFixed(3)}`
          );
        }
      }
      if (!seg) {
        if (DEBUG) console.log("[SYNC] no segment", currentTime.toFixed(3));
        if (DEBUG) console.log("[SYNC] continue loop");
        rafId = requestAnimationFrame(update);
        return;
      }
      currentSegment = seg;
      if (DEBUG) {
        console.log(
          `[LYRICS] active segment ${currentSegment.start}-${currentSegment.end}`
        );
      }

      // 🎤 Speaker
      speakerDiv.textContent = currentSegment.speaker || "";
      if (DEBUG) {
        console.log(
          `[SPEAKER] ${currentSegment.speaker || "(none)"} ${currentSegment.start}-${currentSegment.end}`
        );
      }

      // 🎼 Instrumental
      const activeInstrumental = (archiveData.instrumentals || []).find(
        (inst) => currentTime >= inst.start && currentTime <= inst.end
      );
      instrumentalDiv.textContent = activeInstrumental ? activeInstrumental.title : "";
      if (DEBUG && activeInstrumental) {
        console.log(
          `[SYNC] instrumental ${activeInstrumental.title} ${activeInstrumental.start}-${activeInstrumental.end}`
        );
      }

      // 📝 Injection mots si changement de segment
      if (currentSegment.start !== currentSegmentId) {
        currentSegmentId = currentSegment.start;
        lyricsDiv.innerHTML = "";
        if (DEBUG) {
          console.log(
            `[LYRICS] inject segment ${currentSegment.start}-${currentSegment.end}`
          );
        }

        (currentSegment.words || []).forEach((word, index) => {
          const span = document.createElement("span");
          span.textContent = word.word;
          span.classList.add("lyric-word");
          span.dataset.wordIndex = index;
          const wordId = `${currentSegment.start}-${index}`;
          if (currentTime >= word.start - TOLERANCE) {
            span.classList.add("bump");
            activeWords.add(wordId);
          }
          lyricsDiv.appendChild(span);
          lyricsDiv.appendChild(document.createTextNode(" "));
        });
      }

      // 🌀 Animation mot à mot
      (currentSegment.words || []).forEach((word, index) => {
        const el = document.querySelector(`#lyrics .lyric-word[data-word-index="${index}"]`);
        if (!el) return;

        const wordId = `${currentSegment.start}-${index}`;
        if (!activeWords.has(wordId) && currentTime >= word.start - TOLERANCE) {
          activeWords.add(wordId);
          el.classList.add("bump");
          if (DEBUG) {
            console.log(
              `[LYRICS] bump '${word.word}' at ${word.start} seg ${currentSegment.start}`
            );
          }
        }
      });

      rafId = requestAnimationFrame(update);
    }

    // 🔄 Démarre la boucle dès que la vidéo joue
    video.addEventListener("play", () => {
      if (DEBUG) console.log("[VIDEO] play", video.currentTime.toFixed(3));
      startLoop();
    });
    video.addEventListener("pause", () => {
      if (DEBUG) console.log("[VIDEO] pause", video.currentTime.toFixed(3));
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    });
  })
  .catch((error) => {
    console.error("❌ Erreur lors du chargement des données :", error);
  });
