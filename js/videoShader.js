export async function initVideoShader(video, canvas, shaderName = 'threshold_grey_gradient') {
  const gl = canvas.getContext('webgl');
  if (!gl) return () => {};

  function resize() {
    const scale = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    const videoAspect = (video.videoWidth || 16) / (video.videoHeight || 9);
    const containerAspect = rect.width / rect.height;
    if (videoAspect > containerAspect) {
      const height = rect.height;
      const width = videoAspect * height;
      canvas.style.height = `${height}px`;
      canvas.style.width = `${width}px`;
      video.style.height = `${height}px`;
      video.style.width = `${width}px`;
    } else {
      const width = rect.width;
      const height = width / videoAspect;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      video.style.width = `${width}px`;
      video.style.height = `${height}px`;
    }
    canvas.width = canvas.offsetWidth * scale;
    canvas.height = canvas.offsetHeight * scale;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  if (video.readyState >= 1) {
    resize();
  } else {
    video.addEventListener('loadedmetadata', resize, { once: true });
  }
  window.addEventListener('resize', resize);

  const vertexSrc = `
    attribute vec2 a_position;
    attribute vec2 a_texCoord;
    varying vec2 v_texCoord;
    void main(){
      gl_Position = vec4(a_position,0,1);
      v_texCoord=a_texCoord;
    }`;
  const fragSrc = await fetch(`shaders/${shaderName}.glsl`).then(r => r.text());

  function createShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  }

  const vShader = createShader(gl.VERTEX_SHADER, vertexSrc);
  const fShader = createShader(gl.FRAGMENT_SHADER, fragSrc);
  const program = gl.createProgram();
  gl.attachShader(program, vShader);
  gl.attachShader(program, fShader);
  gl.linkProgram(program);
  gl.useProgram(program);

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1,-1, 1,-1, -1,1,
    -1,1, 1,-1, 1,1
  ]), gl.STATIC_DRAW);
  const posLoc = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  const texCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    0,1, 1,1, 0,0,
    0,0, 1,1, 1,0
  ]), gl.STATIC_DRAW);
  const texLoc = gl.getAttribLocation(program, 'a_texCoord');
  gl.enableVertexAttribArray(texLoc);
  gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 0, 0);

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  const u_mouse = gl.getUniformLocation(program, 'u_mouse');
  const u_resolution = gl.getUniformLocation(program, 'u_resolution');
  const mousePos = { x: 0.5, y: 0.5 };
  canvas.addEventListener('mousemove', e => {
    mousePos.x = e.clientX / canvas.width;
    mousePos.y = 1 - e.clientY / canvas.height;
  });

  let frameId;
  function render() {
    if (video.readyState >= 2 && !video.paused) {
      gl.uniform2f(u_mouse, mousePos.x, mousePos.y);
      gl.uniform2f(u_resolution, canvas.width, canvas.height);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    frameId = requestAnimationFrame(render);
  }

  function start() {
    if (!frameId) frameId = requestAnimationFrame(render);
  }
  function stop() {
    if (frameId) cancelAnimationFrame(frameId);
    frameId = null;
  }

  video.addEventListener('play', start);
  video.addEventListener('pause', stop);
  video.addEventListener('ended', stop);
  if (!video.paused) start();

  video.style.display = 'none';
  canvas.style.display = 'block';

  return () => {
    stop();
    const ext = gl.getExtension('WEBGL_lose_context');
    if (ext) ext.loseContext();
    window.removeEventListener('resize', resize);
    video.removeEventListener('play', start);
    video.removeEventListener('pause', stop);
    video.removeEventListener('ended', stop);
  };
}
