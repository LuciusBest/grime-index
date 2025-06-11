import { createGrid } from './grid/createGrid.js';
import { configureGrid } from './grid/configureGrid.js';
import { buildThumbnail } from './grid/buildThumbnail.js';

const archives = [
  {
    file: 'videos/Archive_001_LoganSama_JME_NewhamGenerals.mp4',
    archive: 'ARCHIVE_001_data.json',
  },
  {
    file: 'videos/Archive_002_DDoubleE_Footsie_LoganSama.mp4',
    archive: 'ARCHIVE_002_data.json',
  },
  {
    file: 'videos/Archive_003_LoganSama_Skepta_JME_Jammer_Frisco_Shorty.mp4',
    archive: 'ARCHIVE_003_data.json',
  },
  {
    file: 'videos/Archive_007_TempaT_Skepta_JME_LoganSama.mp4',
    archive: 'ARCHIVE_007_data.json',
  }
];

let overallGrid;

export function initOverallGrid() {
  overallGrid = document.getElementById('overall-grid');
  if (!overallGrid) return;
  addSelectorCell();
}

export function addSelectorCell() {
  const cell = document.createElement('div');
  cell.classList.add('selector-cell');
  overallGrid.appendChild(cell);
  buildSelectorGrid(archives, cell);
  updateLayout();
  return cell;
}

export async function buildSelectorGrid(items, cell) {
  const grid = document.createElement('div');
  grid.classList.add('selector-grid');
  cell.appendChild(grid);
  createGrid(grid);
  configureGrid(grid, 'selector');
  for (const arch of items) {
    const thumb = await buildThumbnail(arch, grid);
    thumb.addEventListener('click', () => {
      replaceSelectorWithPlayer(cell, arch);
    });
  }
}

export function replaceSelectorWithPlayer(cell, archive) {
  const player = buildPlayerCell(archive);
  overallGrid.replaceChild(player, cell);
  updateLayout();
}

export function buildPlayerCell(archive) {
  const cell = document.createElement('div');
  cell.classList.add('player-cell');

  const video = document.createElement('video');
  video.src = archive.file;
  video.controls = true;
  video.autoplay = true;
  video.muted = true;

  const canvas = document.createElement('canvas');

  cell.appendChild(video);
  cell.appendChild(canvas);
  return cell;
}

function updateLayout() {
  const count = overallGrid.children.length;
  overallGrid.style.gridTemplateColumns = `repeat(${count}, 1fr)`;
}

document.addEventListener('DOMContentLoaded', initOverallGrid);
