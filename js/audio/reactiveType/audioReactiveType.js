ocument.addEventListener("DOMContentLoaded", () => {
  const REM_IN_PX = 16;
  const MIN_FONT_SIZE = 1.2;
  const MAX_FONT_SIZE = 9.0;
  const MAX_FONT_SIZE_LYRICS = 6.0; // 👈 limite spécifique
  const MIN_WEIGHT = 500;
  const MAX_WEIGHT = 900;
  const MIN_WIDTH = 20;
  const MAX_WIDTH = 200;
  const MAX_WIDTH_LYRICS = 50; // 👈 limite spécifique
  const VOLUME_THRESHOLD = 10;

  const speakerDiv = document.querySelector("#speaker .inner_text");
  const instrumentalDiv = document.querySelector("#instrumental .inner_text");
  const lyricsDiv = document.querySelector("#lyrics .inner_text");

  const frozenModules = new Set();

  document.querySelectorAll(".module").forEach((module) => {
    module.addEventListener("mouseenter", () => {
      frozenModules.add(module.id);
    });
    module.addEventListener("mouseleave", () => {
      frozenModules.delete(module.id);
    });
  });

  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;

  const freqData = new Uint8Array(analyser.frequencyBinCount);
  const waveformData = new Uint8Array(analyser.fftSize);

  const video = document.getElementById("background-video");
  const videoAudioSource = audioContext.createMediaElementSource(video);
  videoAudioSource.connect(analyser);
  analyser.connect(audioContext.destination);

  function scale(value, inMin, inMax, outMin, outMax) {
    return Math.max(outMin, Math.min(outMax,
      ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin));
  }

  function boost(v) {
    const x = v / 255;
    return x < 0.1 ? 0 : Math.pow(x, 1.8) * 255;
  }

  function getAvg(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  let prevAvg = 0;
  function smooth(value, alpha = 0.2) {
    prevAvg = (1 - alpha) * prevAvg + alpha * value;
    return prevAvg;
  }

  function updateVisualizer() {
    analyser.getByteFrequencyData(freqData);
    analyser.getByteTimeDomainData(waveformData);

    const low = freqData.slice(0, 10);
    const mid = freqData.slice(10, 30);
    const high = freqData.slice(30, 50);

    const avgLow = getAvg(low);
    const avgMid = getAvg(mid);
    const avgHigh = getAvg(high);
    const avgTotal = smooth(getAvg(freqData));

    if (avgTotal < VOLUME_THRESHOLD) {
      [speakerDiv, instrumentalDiv, lyricsDiv].forEach(div => {
        div.style.fontSize = `${MIN_FONT_SIZE}rem`;
        div.style.lineHeight = "1";
      });
      return requestAnimationFrame(updateVisualizer);
    }

    const updateText = (
      div, avg, id,
      scaleFactor = 1.0,
      widthFactor = 1.0,
      customMaxWidth = MAX_WIDTH,
      customMaxFontSize = MAX_FONT_SIZE
    ) => {
      if (frozenModules.has(id)) return;
      const fontSize = scale(avg, 0, 255, MIN_FONT_SIZE, customMaxFontSize) * scaleFactor;
      const weight = scale(boost(avg), 0, 255, MIN_WEIGHT, MAX_WEIGHT).toFixed(0);
      const width = (scale(boost(avg), 0, 255, MIN_WIDTH, customMaxWidth) * widthFactor).toFixed(0);
      div.style.fontSize = `${fontSize.toFixed(2)}rem`;
      div.style.lineHeight = "0.85";
      div.style.fontVariationSettings = `'wght' ${weight}, 'wdth' ${width}`;
    };

    updateText(speakerDiv, avgHigh, "speaker");
    updateText(instrumentalDiv, avgMid, "instrumental");
    updateText(
      lyricsDiv,
      avgLow,
      "lyrics",
      0.85,
      0.8,
      MAX_WIDTH_LYRICS,
      MAX_FONT_SIZE_LYRICS
    ); // 👈 width + font-size limités

    requestAnimationFrame(updateVisualizer);
  }

  video.addEventListener("play", () => {
    if (audioContext.state === "suspended") {
      audioContext.resume();
    }
    updateVisualizer();
  });

  const canvas = document.getElementById("video-canvas");
  const toggleBtn = document.getElementById("toggle-shader");
  if (canvas && video) {
    canvas.style.display = "block";
    video.style.display = "none";
  }

  if (toggleBtn) {
    let shaderEnabled = false;
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
