import { loadActiveArchiveData } from "../../data/dataLinker.js";

document.addEventListener("DOMContentLoaded", async () => {
  const REM_IN_PX = 16;
  const MIN_FONT_SIZE = 8;
  const MAX_FONT_SIZE = 9.0;
  const MAX_FONT_SIZE_LYRICS = 6.0;
  const MIN_WEIGHT = 500;
  const MAX_WEIGHT = 900;
  const MIN_WIDTH = 20;
  const MAX_WIDTH = 200;
  const VOLUME_THRESHOLD = 10;

  const speakerDiv = document.querySelector("#speaker .inner_text");
  const instrumentalDiv = document.querySelector("#instrumental .inner_text");
  const lyricsDiv = document.querySelector("#lyrics .inner_text");

  const frozenModules = new Set();
  document.querySelectorAll(".module").forEach((module) => {
    module.addEventListener("mouseenter", () => frozenModules.add(module.id));
    module.addEventListener("mouseleave", () => frozenModules.delete(module.id));
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

  let artistWidths = {};
  let instrumentalWeights = {};

  async function loadDurations() {
    try {
      const archive = await loadActiveArchiveData();
      const data = archive.segments;
      const totalDuration = Math.max(...data.map(seg => seg.end || 0));

      const artistDurations = {};
      const instrumentalDurations = {};

      data.forEach(({ speaker, instrumental, start, end }) => {
        const duration = end - start;
        if (speaker) {
          artistDurations[speaker] = (artistDurations[speaker] || 0) + duration;
        }
        if (instrumental && instrumental.title) {
          const key = `${instrumental.title} – ${instrumental.artist}`;
          instrumentalDurations[key] = (instrumentalDurations[key] || 0) + duration;
        }
      });

      Object.entries(artistDurations).forEach(([k, v]) => {
        artistWidths[k] = scale(v, 0, totalDuration, MIN_WIDTH, MAX_WIDTH);
      });

      Object.entries(instrumentalDurations).forEach(([k, v]) => {
        instrumentalWeights[k] = scale(v, 0, totalDuration, MIN_WEIGHT, MAX_WEIGHT);
      });

    } catch (err) {
      console.error("Erreur de chargement JSON :", err);
    }
  }

  await loadDurations();

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

    const speakerLabel = speakerDiv.textContent.trim();
    const instrLabel = instrumentalDiv.textContent.trim();

    const updateText = (
      div, avg, id,
      scaleFactor = 1.0,
      weightOverride = null,
      widthOverride = null,
      customMaxFontSize = MAX_FONT_SIZE
    ) => {
      if (frozenModules.has(id)) return;

      const fontSize = scale(avg, 0, 255, MIN_FONT_SIZE, customMaxFontSize) * scaleFactor;
      const weight = weightOverride !== null ? weightOverride : scale(boost(avg), 0, 255, MIN_WEIGHT, MAX_WEIGHT).toFixed(0);
      const width = widthOverride !== null ? widthOverride : scale(boost(avg), 0, 255, MIN_WIDTH, MAX_WIDTH).toFixed(0);

      div.style.fontSize = `${fontSize.toFixed(2)}rem`;
      div.style.lineHeight = "0.60";
      div.style.fontVariationSettings = `'wght' ${weight}, 'wdth' ${width}`;
    };

    updateText(
      speakerDiv,
      avgHigh,
      "speaker",
      1.0,
      null,
      artistWidths[speakerLabel] || MIN_WIDTH
    );

    updateText(
      instrumentalDiv,
      avgLow,
      "instrumental",
      1.0,
      instrumentalWeights[instrLabel] || MIN_WEIGHT,
      null
    );

    // 🎤 Pas de fontVariationSettings pour lyrics
    if (!frozenModules.has("lyrics")) {
      const fontSize = scale(avgMid, 0, 255, MIN_FONT_SIZE, MAX_FONT_SIZE_LYRICS) * 0.85;
      lyricsDiv.style.fontSize = `${fontSize.toFixed(2)}rem`;
      lyricsDiv.style.lineHeight = "0.50";
    }

    requestAnimationFrame(updateVisualizer);
  }

  video.addEventListener("play", () => {
    if (audioContext.state === "suspended") {
      audioContext.resume();
    }
    updateVisualizer();
  });

  const canvas = document.getElementById("video-canvas");
  const toggleBtn = document.getElementById("shader-toggle-button");
  if (canvas && video) {
    canvas.style.display = "block";
    video.style.display = "none";
  }

  if (toggleBtn) {
    const fxOn = "FX";
    const fxOff = "<s>FX</s>";
    let shaderEnabled = false;
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
    toggleBtn.innerHTML = fxOff;
  }
});
