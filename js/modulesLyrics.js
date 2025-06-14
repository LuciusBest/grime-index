import { activeMedia } from './activeMedia.js';

const TOLERANCE = 0.03;

const liveText = document.getElementById('liveText');

// Build DOM structure
const wrapper = document.createElement('div');
wrapper.className = 'audioType_wrapper';
wrapper.innerHTML = `
  <div class="audioType_container">
    <div class="module" id="speaker"><div class="inner_text"></div></div>
    <div class="module" id="instrumental"><div class="inner_text"></div></div>
    <div class="module" id="lyrics"><div class="inner_text"></div></div>
  </div>`;

liveText.appendChild(wrapper);

const speakerDiv = wrapper.querySelector('#speaker .inner_text');
const instrumentalDiv = wrapper.querySelector('#instrumental .inner_text');
const lyricsDiv = wrapper.querySelector('#lyrics .inner_text');

let archiveData = null;
let currentSegmentId = null;
let activeWords = new Set();

activeMedia.onVideoChange(({ archiveData: data }) => {
  archiveData = data;
  currentSegmentId = null;
  activeWords = new Set();
  lyricsDiv.innerHTML = '';
  speakerDiv.textContent = '';
  instrumentalDiv.textContent = '';
});

activeMedia.onTimeUpdate(time => {
  if (!archiveData) return;

  const currentSegment = archiveData.segments.find(
    seg => time >= seg.start && time <= seg.end
  );
  if (!currentSegment) return;

  speakerDiv.textContent = currentSegment.speaker || '';
  const activeInstrumental = (archiveData.instrumentals || []).find(
    inst => time >= inst.start && time <= inst.end
  );
  instrumentalDiv.textContent = activeInstrumental ? activeInstrumental.title : '';

  if (currentSegment.start !== currentSegmentId) {
    currentSegmentId = currentSegment.start;
    lyricsDiv.innerHTML = '';
    (currentSegment.words || []).forEach((word, index) => {
      const span = document.createElement('span');
      span.textContent = word.word;
      span.classList.add('lyric-word');
      span.dataset.wordIndex = index;
      lyricsDiv.appendChild(span);
      lyricsDiv.appendChild(document.createTextNode(' '));
    });
  }

  (currentSegment.words || []).forEach((word, index) => {
    const el = lyricsDiv.querySelector(`.lyric-word[data-word-index="${index}"]`);
    if (!el) return;

    const wordId = `${currentSegment.start}-${index}`;
    if (!activeWords.has(wordId) && time >= word.start - TOLERANCE) {
      activeWords.add(wordId);
      el.classList.add('bump');
    }
  });
});
