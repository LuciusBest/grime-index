async function loadShader(gl, name) {
  const res = await fetch(`shaders/${name}.glsl`);
  return res.text();
}

async function drawFrameToCanvas(videoSrc, canvas, time = 0, shaderName = 'threshold_grey_gradient') {
  const gl = canvas.getContext('webgl');
  if (!gl) return;
  gl.viewport(0, 0, canvas.width, canvas.height);

  const vertexSrc = `attribute vec2 a_position;\nattribute vec2 a_texCoord;\nvarying vec2 v_texCoord;\nvoid main(){gl_Position=vec4(a_position,0,1);v_texCoord=a_texCoord;}`;
  const fragSrc = await loadShader(gl, shaderName);
  const vShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vShader, vertexSrc);
  gl.compileShader(vShader);
  const fShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fShader, fragSrc);
  gl.compileShader(fShader);
  const program = gl.createProgram();
  gl.attachShader(program, vShader);
  gl.attachShader(program, fShader);
  gl.linkProgram(program);
  gl.useProgram(program);

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
  const positionLoc = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(positionLoc);
  gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

  const texCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0,1,1,1,0,0,0,0,1,1,1,0]), gl.STATIC_DRAW);
  const texCoordLoc = gl.getAttribLocation(program, 'a_texCoord');
  gl.enableVertexAttribArray(texCoordLoc);
  gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  const video = document.createElement('video');
  video.crossOrigin = 'anonymous';
  video.src = videoSrc;
  video.muted = true;
  video.preload = 'auto';
  video.addEventListener('loadedmetadata', () => {
    const t = Math.min(Math.max(time, 0), video.duration || time);
    video.currentTime = t;
  });
  video.addEventListener('seeked', () => {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
    const canvasRatio = canvas.width / canvas.height;
    const videoRatio = video.videoWidth / video.videoHeight;
    let x0 = 0, x1 = 1, y0 = 0, y1 = 1;
    if (videoRatio > canvasRatio) {
      const crop = (1 - canvasRatio / videoRatio) / 2;
      x0 = crop;
      x1 = 1 - crop;
    } else if (videoRatio < canvasRatio) {
      const crop = (1 - videoRatio / canvasRatio) / 2;
      y0 = crop;
      y1 = 1 - crop;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      x0, y1,
      x1, y1,
      x0, y0,
      x0, y0,
      x1, y1,
      x1, y0,
    ]), gl.STATIC_DRAW);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
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

let renderQueue = Promise.resolve();

async function renderThumbnail(canvas, archive) {
  await new Promise((resolve) => requestAnimationFrame(resolve));
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  const timestamp = await getThumbnailTimestamp(archive.archive);
  await drawFrameToCanvas(archive.file, canvas, timestamp);

  const gl = canvas.getContext('webgl');
  gl?.getExtension('WEBGL_lose_context')?.loseContext();

  const img = document.createElement('img');
  img.src = canvas.toDataURL();
  img.style.width = '100%';
  img.style.height = '100%';
  canvas.replaceWith(img);
}

export async function buildThumbnail(archive, container) {
  const cell = document.createElement('div');
  cell.classList.add('thumbnail-cell');
  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  cell.appendChild(canvas);
  if (container) container.appendChild(cell);

  renderQueue = renderQueue.then(() => renderThumbnail(canvas, archive));
  await renderQueue;
  return cell;
}
