import { loadActiveArchiveData } from "../data/dataLinker.js";

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
      rafId = requestAnimationFrame(update);
    };

    video.addEventListener("seeking", () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    });

    video.addEventListener("seeked", () => {
      // Clear previous state when seeking to avoid desyncs
      activeWords = new Set();
      currentSegmentId = null;
      lastTime = video.currentTime;
      currentSegmentIndex = findSegmentIndex(video.currentTime);
      currentSegment = segments[currentSegmentIndex] || null;
      startLoop();
    });

    function update() {
      const currentTime = video.currentTime;

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
      }
      if (!seg) {
        rafId = requestAnimationFrame(update);
        return;
      }
      currentSegment = seg;

      // 🎤 Speaker
      speakerDiv.textContent = currentSegment.speaker || "";

      // 🎼 Instrumental
      const activeInstrumental = (archiveData.instrumentals || []).find(
        (inst) => currentTime >= inst.start && currentTime <= inst.end
      );
      instrumentalDiv.textContent = activeInstrumental ? activeInstrumental.title : "";

      // 📝 Injection mots si changement de segment
      if (currentSegment.start !== currentSegmentId) {
        currentSegmentId = currentSegment.start;
        lyricsDiv.innerHTML = "";

        (currentSegment.words || []).forEach((word, index) => {
          const span = document.createElement("span");
          span.textContent = word.word;
          span.classList.add("lyric-word");
          span.dataset.wordIndex = index;
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
        }
      });

      rafId = requestAnimationFrame(update);
    }

    // 🔄 Démarre la boucle dès que la vidéo joue
    video.addEventListener("play", startLoop);
    video.addEventListener("pause", () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    });
  })
  .catch((error) => {
    console.error("❌ Erreur lors du chargement des données :", error);
  });
