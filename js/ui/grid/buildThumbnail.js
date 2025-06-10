async function loadShader(gl, name) {
  const res = await fetch(`shaders/${name}.glsl`);
  return res.text();
}

async function drawFrameToCanvas(videoSrc, canvas, shaderName = 'threshold_grey_gradient') {
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
    const t = Math.random() * video.duration;
    video.currentTime = t;
  });
  video.addEventListener('seeked', () => {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  });
}

export async function buildThumbnail(archive) {
  const cell = document.createElement('div');
  cell.classList.add('thumbnail-cell');
  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  cell.appendChild(canvas);
  await new Promise((resolve) => {
    requestAnimationFrame(async () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      await drawFrameToCanvas(archive.file, canvas);
      resolve();
    });
  });
  return cell;
}
