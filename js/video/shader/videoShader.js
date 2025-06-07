document.addEventListener("DOMContentLoaded", async () => {
  // 🎥 Récupération des éléments DOM nécessaires
  const video = document.getElementById("background-video");
  const canvas = document.getElementById("video-canvas");
  const toggleBtn = document.getElementById("toggle-shader");

  // 🔧 Contexte WebGL
  const gl = canvas.getContext("webgl");
  if (!gl) {
    console.error("WebGL non supporté");
    return;
  }

  // 🔁 Fonction pour redimensionner le canvas pour qu’il couvre l’écran,
  // tout en respectant le ratio de la vidéo
  function resizeCanvasToCoverScreen() {
    const scale = window.devicePixelRatio || 1; // 🖥️ upscale selon densité d’écran

    const videoAspect = video.videoWidth / video.videoHeight;
    const screenAspect = window.innerWidth / window.innerHeight;

    // 📐 Adapter le canvas pour couvrir l'écran (cover, comme en CSS)
    if (videoAspect > screenAspect) {
      canvas.style.height = "100vh";
      canvas.style.width = `${videoAspect * window.innerHeight}px`;
    } else {
      canvas.style.width = "100vw";
      canvas.style.height = `${window.innerWidth / videoAspect}px`;
    }

    // 🎯 Définir la vraie résolution du canvas en tenant compte de l’upscale
    canvas.width = canvas.offsetWidth * scale;
    canvas.height = canvas.offsetHeight * scale;

    // 🧭 Mise à jour de la zone de dessin WebGL
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  // ⚡ Dès que la vidéo a ses métadonnées, on peut redimensionner le canvas
  if (video.readyState >= 1) {
    resizeCanvasToCoverScreen();
  } else {
    video.addEventListener("loadedmetadata", resizeCanvasToCoverScreen);
  }

  // 🔄 Redimensionnement si la fenêtre change de taille
  window.addEventListener("resize", resizeCanvasToCoverScreen);

  // 🎛️ Shader de vertex (position et coordonnées UV)
  const vertexShaderSource = `
    attribute vec2 a_position;
    attribute vec2 a_texCoord;
    varying vec2 v_texCoord;
    void main() {
      gl_Position = vec4(a_position, 0, 1);
      v_texCoord = a_texCoord;
    }
  `;

  // 📦 Chargement asynchrone du fragment shader depuis un fichier
  async function loadShader(name) {
    try {
      const res = await fetch(`shaders/${name}.glsl`);
      return await res.text();
    } catch (err) {
      console.error("Erreur lors du chargement du shader :", err);
      return null;
    }
  }

  // 🔍 Quel shader utiliser ? (par défaut "threshold")
  const shaderTag = document.getElementById("active-shader");
  const shaderName = shaderTag ? shaderTag.dataset.shader || "threshold" : "threshold";
  const fragmentShaderSource = await loadShader(shaderName);
  if (!fragmentShaderSource) return;

  // 🔧 Compilation d’un shader (vertex ou fragment)
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

  // 🧱 Création des shaders + programme WebGL
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.useProgram(program);

  // 📌 Position des sommets (2 triangles couvrant tout le canvas)
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,   1, -1,  -1, 1,
    -1, 1,    1, -1,   1, 1
  ]), gl.STATIC_DRAW);

  const positionLocation = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  // 📌 Coordonnées UV (texture)
  const texCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    0, 1,  1, 1,  0, 0,
    0, 0,  1, 1,  1, 0
  ]), gl.STATIC_DRAW);

  const texCoordLocation = gl.getAttribLocation(program, "a_texCoord");
  gl.enableVertexAttribArray(texCoordLocation);
  gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

  // 🖼️ Création de la texture pour afficher la vidéo dans le shader
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); // lissage

  // 🎮 Uniformes du shader
  const u_mouse = gl.getUniformLocation(program, "u_mouse");
  const u_resolution = gl.getUniformLocation(program, "u_resolution");

  // 🎯 Position de la souris (entre 0 et 1)
  const mousePos = { x: 0.5, y: 0.5 };
  canvas.addEventListener("mousemove", (e) => {
    mousePos.x = e.clientX / canvas.width;
    mousePos.y = 1.0 - (e.clientY / canvas.height); // y inversé pour coord. GLSL
  });

  // 🔁 Fonction principale de rendu
  function render() {
    if (video.readyState >= 2 && canvas.style.display !== "none") {
      // ⌨️ Mise à jour des uniformes
      gl.uniform2f(u_mouse, mousePos.x, mousePos.y);
      gl.uniform2f(u_resolution, canvas.width, canvas.height);

      // 🖼️ Actualiser la texture avec la frame vidéo courante
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);

      // ▶️ Dessiner les triangles (pleine surface)
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    // 🔄 Boucle d’animation
    requestAnimationFrame(render);
  }

  // 🔔 Démarrer le rendu quand la vidéo commence à jouer
  video.addEventListener("play", render);

  // 🎚️ Bouton pour activer/désactiver l’effet shader
  let shaderEnabled = true;
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      shaderEnabled = !shaderEnabled;
      if (shaderEnabled) {
        canvas.style.display = "block";
        video.style.display = "none";
        toggleBtn.textContent = "Disable Shader";
      } else {
        canvas.style.display = "none";
        video.style.display = "block";
        toggleBtn.textContent = "Enable Shader";
      }
    });
  }
});
