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
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      const cw = canvas.width;
      const ch = canvas.height;
      const videoRatio = vw / vh;
      const canvasRatio = cw / ch;
      let sx = 0, sy = 0, sw = vw, sh = vh;
      if (canvasRatio > videoRatio) {
        // Canvas is wider; crop top/bottom from the video
        sh = vw / canvasRatio;
        sy = (vh - sh) / 2;
      } else if (canvasRatio < videoRatio) {
        // Canvas is taller; crop left/right
        sw = vh * canvasRatio;
        sx = (vw - sw) / 2;
      }
      ctx.drawImage(video, sx, sy, sw, sh, 0, 0, cw, ch);
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

const THRESHOLD = Math.round(0.22 * 255);
const THUMB_SIZE = 256;
const thumbnailCache = new Map();


function applyThresholdEffect(canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;
  const topColor = [255, 51, 51];
  const bottomColor = [255, 51, 51];
  for (let y = 0; y < height; y++) {
    const t = y / height; // fraction from top (0) to bottom (1)
    const rGrad = bottomColor[0] * t + topColor[0] * (1 - t);
    const gGrad = bottomColor[1] * t + topColor[1] * (1 - t);
    const bGrad = bottomColor[2] * t + topColor[2] * (1 - t);
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      if (gray >= THRESHOLD) {
        data[i + 3] = 0; // transparent
      } else {
        data[i] = rGrad;
        data[i + 1] = gGrad;
        data[i + 2] = bGrad;
        data[i + 3] = 255;
      }
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

async function captureThumbnail(archive, cell = null) {
  const canvas = document.createElement('canvas');
  if (cell) {
    const rect = cell.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
  } else {
    canvas.width = THUMB_SIZE;
    canvas.height = THUMB_SIZE;
  }
  try {
    const timestamp = await getThumbnailTimestamp(archive.archive);
    await drawFrameToCanvas(archive.file, canvas, timestamp);
    applyThresholdEffect(canvas);
    return canvas.toDataURL();
  } catch (err) {
    console.error('Thumbnail draw failed', err);
    return null;
  }
}

function createFallback() {
  const fallback = document.createElement('div');
  fallback.className = 'thumb-fallback';
  fallback.textContent = 'Thumbnail failed';
  return fallback;
}

export function buildThumbnail(archive, container) {
  const cell = document.createElement('div');
  cell.classList.add('thumbnail-cell');
  if (container) container.appendChild(cell);

  const cached = thumbnailCache.get(archive.file);
  if (cached) {
    const img = document.createElement('img');
    img.src = cached;
    cell.appendChild(img);
  } else {
    const placeholder = createFallback();
    cell.appendChild(placeholder);
    requestAnimationFrame(async () => {
      const url = await captureThumbnail(archive, cell);
      if (url) {
        thumbnailCache.set(archive.file, url);
        const img = document.createElement('img');
        img.src = url;
        cell.replaceChild(img, placeholder);
      } else {
        placeholder.textContent = 'Thumbnail failed';
      }
    });
  }
  return cell;
}
