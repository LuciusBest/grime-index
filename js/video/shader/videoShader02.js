document.addEventListener("DOMContentLoaded", async () => {
  const video = document.getElementById("background-video");
  const canvas = document.getElementById("video-canvas");
  const toggleBtn = document.getElementById("shader-toggle-button");

  const gl = canvas.getContext("webgl");
  if (!gl) {
    console.error("WebGL non supporté");
    return;
  }

  function resizeCanvasToCoverScreen() {
    const scale = window.devicePixelRatio || 1;
    const videoAspect = video.videoWidth / video.videoHeight;
    const screenAspect = window.innerWidth / window.innerHeight;

    if (videoAspect > screenAspect) {
      canvas.style.height = "100vh";
      canvas.style.width = `${videoAspect * window.innerHeight}px`;
    } else {
      canvas.style.width = "100vw";
      canvas.style.height = `${window.innerWidth / videoAspect}px`;
    }

    canvas.width = canvas.offsetWidth * scale;
    canvas.height = canvas.offsetHeight * scale;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  if (video.readyState >= 1) {
    resizeCanvasToCoverScreen();
  } else {
    video.addEventListener("loadedmetadata", resizeCanvasToCoverScreen);
  }
  window.addEventListener("resize", resizeCanvasToCoverScreen);

  const vertexShaderSource = `
    attribute vec2 a_position;
    attribute vec2 a_texCoord;
    varying vec2 v_texCoord;
    void main() {
      gl_Position = vec4(a_position, 0, 1);
      v_texCoord = a_texCoord;
    }
  `;

  const shaderTag = document.getElementById("active-shader");
  const shaderName = shaderTag ? shaderTag.dataset.shader || "threshold" : "threshold";
  const fragmentShaderSource = await fetch(`shaders/${shaderName}.glsl`).then(res => res.text());

  function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error("Erreur de compilation :", gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.useProgram(program);

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,   1, -1,  -1, 1,
    -1, 1,    1, -1,   1, 1
  ]), gl.STATIC_DRAW);

  const positionLocation = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  const texCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    0, 1,  1, 1,  0, 0,
    0, 0,  1, 1,  1, 0
  ]), gl.STATIC_DRAW);

  const texCoordLocation = gl.getAttribLocation(program, "a_texCoord");
  gl.enableVertexAttribArray(texCoordLocation);
  gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  const u_mouse = gl.getUniformLocation(program, "u_mouse");
  const u_resolution = gl.getUniformLocation(program, "u_resolution");
  const u_thresholdLevel = gl.getUniformLocation(program, "u_thresholdLevel");

  let thresholdLevel = 1;
  let currentSpeaker = null;

  const mousePos = { x: 0.5, y: 0.5 };
  canvas.addEventListener("mousemove", (e) => {
    mousePos.x = e.clientX / canvas.width;
    mousePos.y = 1.0 - (e.clientY / canvas.height);
  });

  function render() {
    if (video.readyState >= 2 && canvas.style.display !== "none") {
      gl.uniform2f(u_mouse, mousePos.x, mousePos.y);
      gl.uniform2f(u_resolution, canvas.width, canvas.height);
      gl.uniform1f(u_thresholdLevel, thresholdLevel);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    requestAnimationFrame(render);
  }

  video.addEventListener("play", render);

  if (toggleBtn) {
    let shaderEnabled = true;
    toggleBtn.addEventListener("click", () => {
      shaderEnabled = !shaderEnabled;
      canvas.style.display = shaderEnabled ? "block" : "none";
      video.style.display = shaderEnabled ? "none" : "block";
      toggleBtn.textContent = shaderEnabled ? "Disable Shader" : "Enable Shader";
    });
  }

  // 🔧 CHARGEMENT DE L'ARCHIVE ACTIVE SANS MODULE
  const archiveTag = document.getElementById("active-archive");
  const archiveName = archiveTag.dataset.archive || "ARCHIVE_001_data.json";
  const archiveData = await fetch(`data/${archiveName}`).then((res) => res.json());

  video.addEventListener("timeupdate", () => {
    const currentTime = video.currentTime;
    const currentSegment = archiveData.segments.find(
      (seg) => currentTime >= seg.start && currentTime <= seg.end
    );
    if (!currentSegment) return;

    const speaker = currentSegment.speaker;
    if (speaker && speaker !== currentSpeaker) {
      currentSpeaker = speaker;
      thresholdLevel++;
      console.log(`🎤 Speaker: ${speaker} | Threshold level: ${thresholdLevel}`);
    }
  });
});
