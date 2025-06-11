function drawFrameToCanvas(videoSrc, canvas, time = 0) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.preload = 'auto';
    video.muted = true;
    video.src = videoSrc;

    video.addEventListener('error', () => reject(new Error('Video failed to load')));

    video.addEventListener('loadedmetadata', () => {
      const t = Math.min(Math.max(time, 0), video.duration || time);
      video.currentTime = t;
    });

    video.addEventListener('seeked', () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('2D context not supported'));
        return;
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      video.removeAttribute('src');
      resolve();
    });

    video.load();
  });
}

async function getThumbnailTimestamp(dataFile) {
  try {
    const res = await fetch(`data/${dataFile}`);
    const data = await res.json();
    const arr = data.frameThumbnail;
    if (Array.isArray(arr) && arr.length > 0) {
      return arr[0];
    }
  } catch (err) {
    console.error('Failed to load archive data', err);
  }
  return 0;
}

const queue = [];
let processing = false;

async function processQueue() {
  if (processing) return;
  processing = true;
  while (queue.length) {
    const { canvas, archive, placeholder } = queue.shift();
    placeholder.replaceWith(canvas);
    await renderThumbnail(canvas, archive);
  }
  processing = false;
}

async function renderThumbnail(canvas, archive) {
  await new Promise((resolve) => requestAnimationFrame(resolve));
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  try {
    const timestamp = await getThumbnailTimestamp(archive.archive);
    await drawFrameToCanvas(archive.file, canvas, timestamp);
  } catch (err) {
    console.error('Thumbnail draw failed', err);
    showFallback(canvas);
    return;
  }

  try {
    const url = canvas.toDataURL();
    const img = document.createElement('img');
    img.src = url;
    img.style.width = '100%';
    img.style.height = '100%';
    canvas.replaceWith(img);
  } catch (err) {
    console.error('Failed to export canvas', err);
    showFallback(canvas);
  }
}

function showFallback(canvas) {
  const fallback = document.createElement('div');
  fallback.className = 'thumb-fallback';
  fallback.textContent = 'Thumbnail failed';
  canvas.replaceWith(fallback);
}

export function buildThumbnail(archive, container) {
  const cell = document.createElement('div');
  cell.classList.add('thumbnail-cell');
  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  const placeholder = document.createElement('div');
  placeholder.className = 'thumb-fallback';
  placeholder.textContent = 'Loading...';
  cell.appendChild(placeholder);
  if (container) container.appendChild(cell);

  queue.push({ canvas, archive, placeholder });
  processQueue();
  return cell;
}
