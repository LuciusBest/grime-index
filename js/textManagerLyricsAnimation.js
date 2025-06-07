import { loadActiveArchiveData } from "./dataLinker.js";

const video = document.getElementById("background-video");
let archiveData = {};
let currentSegmentId = null;
const TOLERANCE = 0.03; // secondes
const activeWords = new Set();
let previousSegmentStart = null;

loadActiveArchiveData()
  .then(json => {
    archiveData = json;

    const lyricsDiv = document.querySelector("#lyrics .inner_text");
    const speakerDiv = document.querySelector("#speaker .inner_text");
    const instrumentalDiv = document.querySelector("#instrumental .inner_text");
    const infoBar = document.getElementById("infoBar");
    if (infoBar) infoBar.textContent = `Now playing: ${archiveData.title || "Archive"}`;

    video.addEventListener("timeupdate", () => {
      const currentTime = video.currentTime;

      // 🔎 Trouver le segment actif
      const currentSegment = archiveData.segments.find(
        (seg) => currentTime >= seg.start && currentTime <= seg.end
      );
      if (!currentSegment) return;

      // 🎤 Afficher le speaker
      speakerDiv.textContent = currentSegment.speaker || "";

      // 🎼 Afficher l'instrumental actif
      const activeInstrumental = (archiveData.instrumentals || []).find(
        (inst) => currentTime >= inst.start && currentTime <= inst.end
      );
      instrumentalDiv.textContent = activeInstrumental ? activeInstrumental.title : "";

      // 📝 Injecter les mots si le segment change
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

      // 🌀 Animation karaoke : état permanent
      if (currentSegment.start !== previousSegmentStart) {
        previousSegmentStart = currentSegment.start;
      }

      currentSegment.words.forEach((word, index) => {
        const el = document.querySelector(`#lyrics .lyric-word[data-word-index="${index}"]`);
        if (!el) return;

        const wordId = `${currentSegment.start}-${index}`;
        if (!activeWords.has(wordId) && currentTime >= word.start - TOLERANCE) {
          activeWords.add(wordId);
          el.classList.add("bump");
        }
      });
    });
  })
  .catch((error) => {
    console.error("❌ Erreur lors du chargement des données :", error);
  });
