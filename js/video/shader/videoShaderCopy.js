document.addEventListener("DOMContentLoaded", async () => {
  const video = document.getElementById("background-video");
  const canvas = document.getElementById("video-canvas");
  const toggleBtn = document.getElementById("shader-toggle-button");
  const gl = canvas.getContext("webgl");
  
  if (!gl) {
    console.error("WebGL non supporté");
    return;
  }

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  }

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  // === SHADERS ===
  const vertexShaderSource = `
    attribute vec2 a_position;
    attribute vec2 a_texCoord;
    varying vec2 v_texCoord;
    void main() {
      gl_Position = vec4(a_position, 0, 1);
      v_texCoord = a_texCoord;
    }
  `;

  async function loadShader(name) {
    try {
      const res = await fetch(`shaders/${name}.glsl`);
      return await res.text();
    } catch (err) {
      console.error("Erreur lors du chargement du shader :", err);
      return null;
    }
  }

  const shaderTag = document.getElementById("active-shader");
  const shaderName = shaderTag ? shaderTag.dataset.shader || "threshold" : "threshold";
  const fragmentShaderSource = await loadShader(shaderName);

  if (!fragmentShaderSource) return;

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

  // === GEOMETRY ===
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

  // === TEXTURE ===
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  // === UNIFORMS ===
  const u_mouse = gl.getUniformLocation(program, "u_mouse");
  const u_resolution = gl.getUniformLocation(program, "u_resolution");

  const mousePos = { x: 0.5, y: 0.5 };

  canvas.addEventListener("mousemove", (e) => {
    mousePos.x = e.clientX / canvas.width;
    mousePos.y = 1.0 - (e.clientY / canvas.height);
  });

  // === RENDER LOOP ===
  function render() {
    if (video.readyState >= 2 && canvas.style.display !== "none") {
      gl.uniform2f(u_mouse, mousePos.x, mousePos.y);
      gl.uniform2f(u_resolution, canvas.width, canvas.height);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    requestAnimationFrame(render);
  }

  video.addEventListener("play", () => {
    render();
  });

  // === SHADER TOGGLE ===
  let shaderEnabled = true;

  if (toggleBtn) {
    const fxOn = "FX";
    const fxOff = "<s>FX</s>";
    toggleBtn.addEventListener("click", () => {
      shaderEnabled = !shaderEnabled;

      if (shaderEnabled) {
        canvas.style.display = "block";
        video.style.display = "none";
        toggleBtn.innerHTML = fxOn;
      } else {
        canvas.style.display = "none";
        video.style.display = "block";
        toggleBtn.innerHTML = fxOff;
      }
    });
    toggleBtn.innerHTML = fxOn;
  }
});
