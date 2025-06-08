document.addEventListener("DOMContentLoaded", () => {
  const video = document.getElementById("background-video");
  const playPauseBtn = document.getElementById("play-pause");
  const playIcon =
    '<svg width="14" height="14" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><polygon points="3,2 13,8 3,14" fill="black"/></svg>';
  const pauseIcon =
    '<svg width="14" height="14" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="2" width="3" height="12" fill="black"/><rect x="10" y="2" width="3" height="12" fill="black"/></svg>';
  playPauseBtn.innerHTML = playIcon;
  const progressBar = document.getElementById("TimelineProgress");
  const timelineBar = document.getElementById("CustomTimeline");
  const timeLabel = document.getElementById("TimelineCursorTime");

  let isDragging = false;
  const defaultTransition = "width 0.25s ease";
  progressBar.style.transition = defaultTransition;

  // 🔢 Formatage du temps (mm:ss)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  // ▶️⏸️ Play / Pause
  playPauseBtn.addEventListener("click", async () => {
    try {
      if (video.paused) {
        await video.play();
        playPauseBtn.innerHTML = pauseIcon;
      } else {
        video.pause();
        playPauseBtn.innerHTML = playIcon;
      }
    } catch (e) {
      console.error("Erreur lors de la lecture :", e);
    }
  });

  // ⏱️ Mise à jour temps depuis position x
  const updateVideoTimeFromX = (x) => {
    const rect = timelineBar.getBoundingClientRect();
    const percent = Math.min(Math.max((x - rect.left) / rect.width, 0), 1);
    const currentTime = percent * video.duration;

    video.currentTime = currentTime;
    progressBar.style.width = `${percent * 100}%`;
    timeLabel.style.left = `${percent * 100}%`;
    timeLabel.textContent = formatTime(currentTime);
  };

  // 🎯 Début du drag
  timelineBar.addEventListener("mousedown", (e) => {
    isDragging = true;
    progressBar.style.transition = "none";
    updateVideoTimeFromX(e.clientX);
  });

  // 🧭 Drag en cours
  document.addEventListener("mousemove", (e) => {
    if (isDragging) {
      updateVideoTimeFromX(e.clientX);
    }
  });

  // ✅ Fin du drag
  document.addEventListener("mouseup", () => {
    if (isDragging) {
      isDragging = false;
      progressBar.style.transition = defaultTransition;
    }
  });

  // 🎥 Mise à jour continue pendant lecture
  video.addEventListener("timeupdate", () => {
    if (video.duration && !isDragging) {
      const percent = video.currentTime / video.duration;

      // ✅ rétablit la transition si désactivée
      if (progressBar.style.transition !== defaultTransition) {
        progressBar.style.transition = defaultTransition;
      }

      progressBar.style.width = `${percent * 100}%`;
      timeLabel.style.left = `${percent * 100}%`;
      timeLabel.textContent = formatTime(video.currentTime);
    }
  });
});
