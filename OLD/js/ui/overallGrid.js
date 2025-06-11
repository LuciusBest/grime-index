import { createGrid } from './grid/createGrid.js';
import { configureGrid } from './grid/configureGrid.js';
import { buildThumbnail } from './grid/buildThumbnail.js';
import { initVideoShader } from '../video/shader/initVideoShader.js';

let overallContainer;
let loaded = new Set();
let allArchives = [];

export function initOverallGrid(archives) {
  overallContainer = document.getElementById('overall-grid');
  if (!overallContainer) return;
  overallContainer.innerHTML = '';
  loaded.clear();
  allArchives = archives.slice();
  addSelectorCell();
}

export function addSelectorCell() {
  const cell = document.createElement('div');
  cell.classList.add('selector-cell');
  const grid = document.createElement('div');
  grid.classList.add('selector-grid');
  cell.appendChild(grid);
  overallContainer.appendChild(cell);
  buildSelectorGrid(grid, cell);
  updateLayout();
  return cell;
}

export function replaceSelectorWithPlayer(selectorCell, archive) {
  const player = buildPlayerCell(archive);
  overallContainer.replaceChild(player, selectorCell);
  loaded.add(archive.archive);
  updateLayout();
}

export function buildSelectorGrid(container, parentCell) {
  createGrid(container);
  configureGrid(container, 'selector');
  const available = allArchives.filter(a => !loaded.has(a.archive));
  available.forEach(async arch => {
    const thumb = await buildThumbnail(arch, container);
    thumb.addEventListener('click', () => {
      replaceSelectorWithPlayer(parentCell, arch);
    });
  });
}

export function buildPlayerCell(archive) {
  const cell = document.createElement('div');
  cell.classList.add('player-cell');
  const video = document.createElement('video');
  video.src = archive.file;
  video.crossOrigin = 'anonymous';
  video.autoplay = true;
  video.loop = true;
  video.muted = true;
  const canvas = document.createElement('canvas');
  cell.appendChild(video);
  cell.appendChild(canvas);
  initVideoShader(video, canvas, 'threshold_grey_gradient');
  return cell;
}

function updateLayout() {
  const count = overallContainer.children.length;
  overallContainer.style.gridTemplateColumns = `repeat(${count}, 1fr)`;
}
