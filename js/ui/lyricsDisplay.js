import { loadActiveArchiveData } from "../data/dataLinker.js";

const video = document.getElementById("background-video");
let archiveData = {};
let currentSegmentId = null;
const TOLERANCE = 0.03; // secondes
const SILENCE_THRESHOLD = 2.0; // secondes
let activeWords = new Set();

let currentSegment = null;
let silenceActive = false;
let lastTime = 0;
let waitingForSync = false;

loadActiveArchiveData()
  .then(json => {
    archiveData = json;

    const lyricsDiv = document.querySelector("#lyrics .inner_text");
    const speakerDiv = document.querySelector("#speaker .inner_text");
    const instrumentalDiv = document.querySelector("#instrumental .inner_text");
    const infoBar = document.getElementById("infoBar");
    if (infoBar) infoBar.textContent = `Now playing: ${archiveData.title || "Archive"}`;

    const findSegmentIndex = (time) =>
      archiveData.segments.findIndex(
        (seg) => time >= seg.start && time <= seg.end
      );

    const findSegment = (time) => {
      const idx = findSegmentIndex(time);
      return idx >= 0 ? archiveData.segments[idx] : null;
    };

    function render(currentTime) {
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
        requestAnimationFrame(update);
        return;
      } else {
        silenceActive = false;
      }
      */

      // 🎙 Segment actif
      const idx = findSegmentIndex(currentTime);
      const newSegment = idx >= 0 ? archiveData.segments[idx] : null;

      const inRange =
        newSegment && currentTime >= newSegment.start && currentTime <= newSegment.end;
      console.log(
        `[DEBUG] t=${currentTime.toFixed(2)} idx=${idx} ` +
          (newSegment ? `seg ${newSegment.start}-${newSegment.end}` : "no seg") +
          ` match=${inRange}`
      );

      if (!newSegment) {
        currentSegment = null;
        currentSegmentId = null;
        speakerDiv.textContent = "";
        instrumentalDiv.textContent = "";
        lyricsDiv.innerHTML = "";
        return;
      }

      if (!inRange) {
        console.warn(
          `[WARN] time ${currentTime.toFixed(2)} outside segment ${newSegment.start}-${newSegment.end}`
        );
      }
      currentSegment = newSegment;

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
    }

    const useFrameCallback = Boolean(video.requestVideoFrameCallback);
    let rafId = null;

    function rafUpdate() {
      if (!waitingForSync) {
        render(video.currentTime);
      }
      rafId = requestAnimationFrame(rafUpdate);
    }

    function frameUpdate(_now, metadata) {
      const t = metadata.mediaTime;
      console.log(
        `[FRAME] currentTime=${video.currentTime.toFixed(2)} mediaTime=${t.toFixed(
          2
        )}`
      );
      if (waitingForSync) {
        if (Math.abs(t - video.currentTime) < 0.1) {
          waitingForSync = false;
          render(video.currentTime);
        }
      } else {
        render(t);
      }
      video.requestVideoFrameCallback(frameUpdate);
    }

    // 🔄 Démarre la boucle dès que la vidéo joue
    video.addEventListener("play", () => {
      if (useFrameCallback) {
        video.requestVideoFrameCallback(frameUpdate);
      } else {
        rafId = requestAnimationFrame(rafUpdate);
      }
    });


    let syncTestTimeout = null;

    video.addEventListener("seeking", () => {
      waitingForSync = true;
      activeWords = new Set();
      currentSegmentId = null;
    });

    video.addEventListener("seeked", () => {
      const time = video.currentTime;
      const seg = findSegment(time);
      console.log(
        `[LYRICS] seeked to ${time.toFixed(2)} ` +
          (seg ? `-> segment ${seg.start}-${seg.end}` : "-> no segment")
      );

      console.log(
        seg
          ? `[SYNC TEST] video.currentTime = ${time.toFixed(2)}`
          : `[SYNC TEST] video.currentTime = ${time.toFixed(2)} (no segment)`
      );
      console.log(
        seg
          ? `[SYNC TEST] activeSegment = ${seg.start}-${seg.end} | text = "${seg.text}"`
          : `[SYNC TEST] activeSegment = null`
      );

      if (syncTestTimeout) {
        clearTimeout(syncTestTimeout);
      }
      syncTestTimeout = setTimeout(() => {
        const t2 = video.currentTime;
        const seg2 = findSegment(t2);
        console.log(
          seg2
            ? `[SYNC TEST] +2s video.currentTime = ${t2.toFixed(2)}`
            : `[SYNC TEST] +2s video.currentTime = ${t2.toFixed(2)} (no segment)`
        );
        console.log(
          seg2
            ? `[SYNC TEST] activeSegment = ${seg2.start}-${seg2.end} | text = "${seg2.text}"`
            : `[SYNC TEST] activeSegment = null`
        );
      }, 2000);
    });

    video.addEventListener("pause", () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      waitingForSync = false;
    });
  })
  .catch((error) => {
    console.error("❌ Erreur lors du chargement des données :", error);
  });

