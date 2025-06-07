import { loadActiveArchiveData } from "../data/dataLinker.js";

loadActiveArchiveData()
  .then(data => {
    const segments = data.segments;
    const speakerSegments = [];
    let lastSpeaker = null;

    segments.forEach(({ speaker, start, end }) => {
      if (!speaker) return;
      if (lastSpeaker && lastSpeaker.speaker === speaker) {
        lastSpeaker.end = end;
      } else {
        if (lastSpeaker) speakerSegments.push(lastSpeaker);
        lastSpeaker = { speaker, start, end };
      }
    });
    if (lastSpeaker) speakerSegments.push(lastSpeaker);

    const totalTime = Math.max(...segments.map(s => s.end));
    const speakerContainer = document.getElementById("FriseTemporelle");
    speakerContainer.innerHTML = "";
    let usedWidth = 0;

    speakerSegments.forEach((seg, i) => {
      let width = ((seg.end - seg.start) / totalTime) * 100;
      if (i === speakerSegments.length - 1) width = 100 - usedWidth;
      else usedWidth += width;

      const div = document.createElement("div");
      div.className = "speaker-block";
      div.style.width = `${width}%`;
      div.textContent = seg.speaker;
      div.title = `${seg.speaker} (${formatTime(seg.start)} - ${formatTime(seg.end)})`;
      div.dataset.speaker = seg.speaker;
      div.dataset.start = seg.start;
      div.dataset.end = seg.end;
      speakerContainer.appendChild(div);
    });

    const instrSegments = data.instrumentals || [];
    const instrContainer = document.getElementById("FriseInstrumentale");
    instrContainer.innerHTML = "";
    let instrUsedWidth = 0;

    instrSegments.forEach((seg, i) => {
      let width = ((seg.end - seg.start) / totalTime) * 100;
      if (i === instrSegments.length - 1) width = 100 - instrUsedWidth;
      else instrUsedWidth += width;

      const div = document.createElement("div");
      div.className = "instrumental-block";
      div.style.width = `${width}%`;
      const key = `${seg.title} – ${seg.artist}`;
      div.textContent = key;
      div.title = `${key} (${formatTime(seg.start)} - ${formatTime(seg.end)})`;
      div.dataset.instrumental = key;
      div.dataset.start = seg.start;
      div.dataset.end = seg.end;
      instrContainer.appendChild(div);
    });

    const friseLyrics = document.getElementById("FriseLyrics");
    const archiveDiv = document.getElementById("FriseArchive");
    if (archiveDiv) archiveDiv.textContent = data.title || "Archive";

    const video = document.getElementById("background-video");
    const timeline = document.getElementById("CustomTimeline");
    const progress = document.getElementById("TimelineProgress");
    const cursorWrapper = document.getElementById("TimelineCursorWrapper");
    const cursorTime = document.getElementById("TimelineCursorTime");
    const verticalLine = document.getElementById("TimelineVerticalLine");

    function clamp(x, min, max) {
      return Math.max(min, Math.min(x, max));
    }

    function formatTime(sec) {
      return `${Math.floor(sec)}`;
    }

    function updateTimelineCursor(currentTime) {
      if (!video.duration || !timeline) return;
      const percent = Math.min(currentTime / video.duration, 1);
      const timelineWidth = timeline.getBoundingClientRect().width;
      const halfCursorWidth = cursorWrapper.offsetWidth / 2;
      const x = clamp(percent * timelineWidth, halfCursorWidth, timelineWidth - halfCursorWidth);

      progress.style.width = `${percent * 100}%`;
      cursorWrapper.style.left = `${x}px`;
      verticalLine.style.left = `${x}px`;
      cursorTime.textContent = formatTime(currentTime);
      cursorWrapper.style.display = "flex";
      verticalLine.style.display = "block";
      cursorTime.classList.remove('hover');
    }

    const updateLyrics = (currentTime) => {
      if (!friseLyrics) return;
      const segment = segments.find(
        seg => currentTime >= seg.start && currentTime <= seg.end && seg.text
      );
      friseLyrics.textContent = segment ? segment.text : "";
    };

    video.addEventListener("timeupdate", () => {
      updateLyrics(video.currentTime);
      updateTimelineCursor(video.currentTime);

      document.querySelectorAll(".speaker-block").forEach(block => {
        const start = parseFloat(block.dataset.start);
        const end = parseFloat(block.dataset.end);
        block.classList.toggle("active", video.currentTime >= start && video.currentTime <= end);
      });

      document.querySelectorAll(".instrumental-block").forEach(block => {
        const start = parseFloat(block.dataset.start);
        const end = parseFloat(block.dataset.end);
        block.classList.toggle("active", video.currentTime >= start && video.currentTime <= end);
      });
    });

    let isDragging = false;

    timeline.addEventListener("mousedown", (e) => {
      isDragging = true;
      seekFromEvent(e);
    });

    document.addEventListener("mouseup", () => {
      isDragging = false;
    });

    document.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      seekFromEvent(e);
    });

    function seekFromEvent(e) {
      const rect = timeline.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      video.currentTime = clamp(percent, 0, 1) * video.duration;
      updateTimelineCursor(video.currentTime);
    }

    timeline.addEventListener("mouseleave", () => {
      updateTimelineCursor(video.currentTime);
      cursorTime.classList.remove("hover");
      verticalLine.style.display = "none";
    });

    if (video.readyState >= 1) {
      updateTimelineCursor(video.currentTime);
    } else {
      video.addEventListener("loadedmetadata", () => {
        updateTimelineCursor(video.currentTime);
      });
    }

    const timelineZone = document.getElementById("TimelineContainer");
    const rows = document.querySelectorAll(".timeline-row");

    function setTimelineRowVisibility(visible) {
      rows.forEach(row => {
        row.classList.toggle("hidden", !visible);
      });
    }

    timelineZone.addEventListener("mouseenter", () => {
      setTimelineRowVisibility(true);
    });

    timelineZone.addEventListener("mouseleave", () => {
      setTimelineRowVisibility(false);
    });
  })
  .catch(err => {
    console.error("❌ Erreur lors du chargement JSON :", err);
  });
