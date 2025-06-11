import { loadActiveArchiveData } from "../data/dataLinker.js";

const video = document.getElementById("background-video");
let archiveData = {};
let currentSegmentId = null;

loadActiveArchiveData()
  .then(json => {
    archiveData = json;

    const lyricsDiv = document.querySelector("#lyrics .inner_text");

    video.addEventListener("timeupdate", () => {
      const currentTime = video.currentTime;

      const currentSegment = archiveData.segments.find(
        (seg) => currentTime >= seg.start && currentTime <= seg.end
      );

      if (!currentSegment) return;

      // 🎤 Speaker
      document.querySelector("#speaker .inner_text").textContent = currentSegment.speaker || "";

      // 🎼 Instrumental
      const activeInstrumental = (archiveData.instrumentals || []).find(
        (inst) => currentTime >= inst.start && currentTime <= inst.end
      );
      document.querySelector("#instrumental .inner_text").textContent =
        activeInstrumental ? activeInstrumental.title : "";

      // 📝 Injecte mots si segment change UNIQUEMENT
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

      // 📁 Archive title
      const archiveTitle = archiveData.title || "Archive";
      const archiveElement = document.querySelector("#archive .inner_text");
      if (archiveElement) archiveElement.textContent = archiveTitle;
    });

    // 🏷️ Info bar
    const archiveTitle = archiveData.title || "Archive";
    const infoBar = document.getElementById("infoBar");
    if (infoBar) infoBar.textContent = `Now playing: ${archiveTitle}`;
  })
  .catch((error) => {
    console.error("❌ Erreur lors du chargement des données :", error);
  });
