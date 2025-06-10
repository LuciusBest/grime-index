const archives = [
  {
    file: "videos/Archive_001_LoganSama_JME_NewhamGenerals.mp4",
    archive: "ARCHIVE_001_data.json",
  },
  {
    file: "videos/Archive_002_DDoubleE_Footsie_LoganSama.mp4",
    archive: "ARCHIVE_002_data.json",
  },
  {
    file: "videos/Archive_003_LoganSama_Skepta_JME_Jammer_Frisco_Shorty.mp4",
    archive: "ARCHIVE_003_data.json",
  },
  {
    file: "videos/Archive_007_TempaT_Skepta_JME_LoganSama.mp4",
    archive: "ARCHIVE_007_data.json",
  },
];

function loadShader(gl, name) {
  return fetch(`shaders/${name}.glsl`).then((res) => res.text());
}

async function drawFrameToCanvas(videoSrc, canvas, shaderName = "threshold_grey_gradient") {
  const gl = canvas.getContext("webgl");
  if (!gl) return;

  const vertexSrc = `attribute vec2 a_position;\nattribute vec2 a_texCoord;\nvarying vec2 v_texCoord;\nvoid main(){gl_Position=vec4(a_position,0,1);v_texCoord=a_texCoord;}`;
  const fragSrc = await loadShader(gl, shaderName);
  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vertexSrc);
  gl.compileShader(vertexShader);
  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fragSrc);
  gl.compileShader(fragmentShader);
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.useProgram(program);

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW
  );
  const positionLoc = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(positionLoc);
  gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

  const texCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0]),
    gl.STATIC_DRAW
  );
  const texCoordLoc = gl.getAttribLocation(program, "a_texCoord");
  gl.enableVertexAttribArray(texCoordLoc);
  gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  const video = document.createElement("video");
  video.crossOrigin = "anonymous";
  video.src = videoSrc;
  video.muted = true;
  video.preload = "auto";
  video.addEventListener("loadedmetadata", () => {
    const t = Math.random() * video.duration;
    video.currentTime = t;
  });
  video.addEventListener("seeked", () => {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  });
}

export function initThumbnailGrid(options = {}) {
  const { containerId = "thumbnail-grid", columns = 2, rows = 2 } = options;
  const container = document.getElementById(containerId);
  if (!container) return;
  container.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
  container.style.gridAutoRows = `calc(100vh / ${rows})`;
  archives.forEach((arch) => {
    const cell = document.createElement("div");
    cell.classList.add("thumbnail-cell");
    const c = document.createElement("canvas");
    cell.appendChild(c);
    container.appendChild(cell);
    drawFrameToCanvas(arch.file, c);
  });
}

document.addEventListener("DOMContentLoaded", () =>
  initThumbnailGrid({ columns: 2, rows: 2 })
);
