// Dynamic timeline binding for highlighted player cells
let currentVideo = null;
let queuedCell = null;
let isLoading = false;
let detachCallbacks = [];

// global shader toggle state
window.shaderEnabled = window.shaderEnabled !== false;

function applyShaderState(enable = window.shaderEnabled) {
  document.querySelectorAll('.player-cell').forEach(cell => {
    const vid = cell.querySelector('video');
    const canvas = cell.querySelector('canvas');
    if (!vid || !canvas) return;
    if (enable) {
      canvas.style.display = 'block';
      vid.style.display = 'none';
    } else {
      canvas.style.display = 'none';
      vid.style.display = 'block';
    }
  });
}
window.applyShaderState = applyShaderState;

function detachTimeline() {
  detachCallbacks.forEach(fn => fn());
  detachCallbacks = [];
  const speaker = document.getElementById('FriseTemporelle');
  const instr = document.getElementById('FriseInstrumentale');
  const progress = document.getElementById('TimelineProgress');
  if (speaker) speaker.innerHTML = '';
  if (instr) instr.innerHTML = '';
  if (progress) progress.style.width = '0%';
  currentVideo = null;
}

async function loadArchiveData(archivePath) {
  const res = await fetch(`data/${archivePath}`);
  if (!res.ok) throw new Error(`Failed to load ${archivePath}`);
  return res.json();
}

function buildBlocks(data, seekTo) {
  const total = data.duration || Math.max(...data.segments.map(s => s.end));
  const speakerSegs = [];
  let last = null;
  data.segments.forEach(({ speaker, start, end }) => {
    if (!speaker) return;
    if (last && last.speaker === speaker) {
      last.end = end;
    } else {
      if (last) speakerSegs.push(last);
      last = { speaker, start, end };
    }
  });
  if (last) speakerSegs.push(last);
  const speaker = document.getElementById('FriseTemporelle');
  const instr = document.getElementById('FriseInstrumentale');
  if (!speaker || !instr) return;
  speaker.innerHTML = '';
  instr.innerHTML = '';

  speakerSegs.forEach(seg => {
    const width = ((seg.end - seg.start) / total) * 100;
    const left = (seg.start / total) * 100;
    const div = document.createElement('div');
    div.className = 'speaker-block';
    div.style.width = `calc(${width}% - 2px)`;
    div.style.left = `${left}%`;
    div.textContent = seg.speaker;
    div.dataset.start = seg.start;
    div.dataset.end = seg.end;
    div.addEventListener('click', () => seekTo(seg.start));
    speaker.appendChild(div);
  });

  const instrSegs = data.instrumentals || [];
  instrSegs.forEach(seg => {
    const width = ((seg.end - seg.start) / total) * 100;
    const left = (seg.start / total) * 100;
    const div = document.createElement('div');
    div.className = 'instrumental-block';
    div.style.width = `calc(${width}% - 2px)`;
    div.style.left = `${left}%`;
    const key = `${seg.title} – ${seg.artist}`;
    div.textContent = key;
    div.dataset.start = seg.start;
    div.dataset.end = seg.end;
    div.addEventListener('click', () => seekTo(seg.start));
    instr.appendChild(div);
  });
}

function bindTimeline(video) {
  const timeline = document.getElementById('CustomTimeline');
  const progress = document.getElementById('TimelineProgress');
  const cursor = document.getElementById('TimelineCursorWrapper');
  const cursorTime = document.getElementById('TimelineCursorTime');
  const vertical = document.getElementById('TimelineVerticalLine');
  const playPause = document.getElementById('play-pause');
  const volumeSlider = document.getElementById('volume-slider');
  const shaderBtn = document.getElementById('shader-toggle-button');
  if (!timeline || !progress || !cursor || !cursorTime || !vertical) return;
  let isDragging = false;
  const playIcon =
    '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="3,2 13,8 3,14" fill="black"/></svg>';
  const pauseIcon =
    '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="2" width="3" height="12" fill="black"/><rect x="10" y="2" width="3" height="12" fill="black"/></svg>';

  const clamp = (x, min, max) => Math.max(min, Math.min(x, max));
  const formatTime = (sec) => {
    if (!isFinite(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };
  const updateActive = (t) => {
    document.querySelectorAll('.speaker-block').forEach(b => {
      const s = parseFloat(b.dataset.start);
      const e = parseFloat(b.dataset.end);
      b.classList.toggle('active', t >= s && t <= e);
    });
    document.querySelectorAll('.instrumental-block').forEach(b => {
      const s = parseFloat(b.dataset.start);
      const e = parseFloat(b.dataset.end);
      b.classList.toggle('active', t >= s && t <= e);
    });
  };

  function updateCursor(time, smooth = false) {
    if (!video.duration) return;
    const percent = Math.min(time / video.duration, 1);
    const width = timeline.getBoundingClientRect().width;
    const half = cursor.offsetWidth / 2;
    const x = clamp(percent * width, half, width - half);
    if (smooth) {
      progress.classList.add('smooth');
      cursor.classList.add('smooth');
      setTimeout(() => {
        progress.classList.remove('smooth');
        cursor.classList.remove('smooth');
      }, 300);
    }
    progress.style.width = `${percent * 100}%`;
    cursor.style.left = `${x}px`;
    vertical.style.left = `${x}px`;
    cursorTime.textContent = formatTime(time);
    cursor.style.display = 'flex';
    vertical.style.display = 'block';
    cursorTime.classList.remove('hover');
  }

  const onTimeUpdate = () => {
    updateCursor(video.currentTime);
    updateActive(video.currentTime);
  };

  const seekFromEvent = (e, smooth) => {
    const rect = timeline.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    video.currentTime = clamp(percent, 0, 1) * video.duration;
    updateCursor(video.currentTime, smooth);
    updateActive(video.currentTime);
  };

  const onMouseDown = (e) => {
    isDragging = true;
    seekFromEvent(e, true);
  };
  const onMouseUp = () => { isDragging = false; };
  const onMouseMove = (e) => { if (isDragging) seekFromEvent(e, false); };
  const onMouseLeave = () => {
    updateCursor(video.currentTime);
    cursorTime.classList.remove('hover');
    vertical.style.display = 'none';
  };

  timeline.addEventListener('mousedown', onMouseDown);
  document.addEventListener('mouseup', onMouseUp);
  document.addEventListener('mousemove', onMouseMove);
  timeline.addEventListener('mouseleave', onMouseLeave);
  video.addEventListener('timeupdate', onTimeUpdate);

  let playPauseHandler = null;
  let syncPlay = null;
  let syncPause = null;
  let volumeHandler = null;
  if (playPause) {
    playPause.innerHTML = video.paused ? playIcon : pauseIcon;
    playPauseHandler = async () => {
      try {
        if (video.paused) {
          await video.play();
          playPause.innerHTML = pauseIcon;
        } else {
          video.pause();
          playPause.innerHTML = playIcon;
        }
      } catch (err) {
        console.error('playback error', err);
      }
    };
    playPause.addEventListener('click', playPauseHandler);
    syncPlay = () => { playPause.innerHTML = pauseIcon; };
    syncPause = () => { playPause.innerHTML = playIcon; };
    video.addEventListener('play', syncPlay);
    video.addEventListener('pause', syncPause);
  }

  if (volumeSlider) {
    volumeSlider.value = video.volume;
    volumeHandler = (e) => { video.volume = parseFloat(e.target.value); };
    volumeSlider.addEventListener('input', volumeHandler);
  }

  if (shaderBtn) {
    const fxOn = 'FX';
    const fxOff = '<s>FX</s>';
    shaderBtn.innerHTML = window.shaderEnabled ? fxOn : fxOff;
    const shaderHandler = () => {
      window.shaderEnabled = !window.shaderEnabled;
      shaderBtn.innerHTML = window.shaderEnabled ? fxOn : fxOff;
      if (window.applyShaderState) window.applyShaderState(window.shaderEnabled);
    };
    shaderBtn.addEventListener('click', shaderHandler);
    detachCallbacks.push(() => {
      shaderBtn.removeEventListener('click', shaderHandler);
    });
  }

  detachCallbacks.push(() => {
    timeline.removeEventListener('mousedown', onMouseDown);
    document.removeEventListener('mouseup', onMouseUp);
    document.removeEventListener('mousemove', onMouseMove);
    timeline.removeEventListener('mouseleave', onMouseLeave);
    video.removeEventListener('timeupdate', onTimeUpdate);
    if (playPause && playPauseHandler) playPause.removeEventListener('click', playPauseHandler);
    if (playPause && syncPlay) video.removeEventListener('play', syncPlay);
    if (playPause && syncPause) video.removeEventListener('pause', syncPause);
    if (volumeSlider && volumeHandler) volumeSlider.removeEventListener('input', volumeHandler);
  });

  if (video.readyState >= 1) updateCursor(video.currentTime);
  else video.addEventListener('loadedmetadata', () => updateCursor(video.currentTime), { once: true });
}

async function attachTimeline(cell) {
  if (isLoading) { queuedCell = cell; return; }
  isLoading = true;
  detachTimeline();
  if (!cell) { isLoading = false; return; }
  const video = cell.querySelector('video');
  const archive = cell.dataset.archive;
  if (!video || !archive) { isLoading = false; return; }
  currentVideo = video;
  let data;
  try {
    data = await loadArchiveData(archive);
  } catch (err) {
    console.error('Timeline data load failed', err);
    isLoading = false;
    return;
  }
  const seekTo = (time) => {
    video.currentTime = time;
    updateCursor(video.currentTime, true);
    updateActive(video.currentTime);
  };
  buildBlocks(data, seekTo);
  bindTimeline(video);
  isLoading = false;
  if (queuedCell && queuedCell !== cell) {
    const next = queuedCell;
    queuedCell = null;
    attachTimeline(next);
  }
}

document.addEventListener('highlightchange', (e) => {
  attachTimeline(e.detail.cell);
});

export { attachTimeline, detachTimeline };
applyShaderState();
