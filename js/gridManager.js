import { buildThumbnail } from './buildThumbnail.js';
import { initVideoShader } from './videoShader.js';

export class GridNavigationManager {
  constructor() {
    this.activeSelectorCells = new Map();
    this.activePlayerCells = new Map();
    this.childSelectors = new Map();
    // start with 0 so the initial selector matches the root layout area
    this.cellCounter = 0;
    this.layoutStack = [{ x: 0, y: 0, width: 100, height: 100, orientation: 'vertical', id: 0 }];
    this.nextHorizontal = true;
    this.highlightedPlayerCell = null;
    this.archives = [
      { file: 'videos/Archive_001_LoganSama_JME_NewhamGenerals.mp4', archive: 'ARCHIVE_001_data.json' },
      { file: 'videos/Archive_002_DDoubleE_Footsie_LoganSama.mp4', archive: 'ARCHIVE_002_data.json' },
      { file: 'videos/Archive_003_LoganSama_Skepta_JME_Jammer_Frisco_Shorty.mp4', archive: 'ARCHIVE_003_data.json' },
      { file: 'videos/Archive_004_ThatsNotMeAllStar_TodlaT.mp4', archive: 'ARCHIVE_004_data.json' },
      { file: 'videos/Archive_005_KeepinItGrimy_Session_Feat_MerkyAce_MIK_Ego.mp4', archive: 'ARCHIVE_005_data.json' },
      { file: 'videos/Archive_006_MerkyACE_ Footsie_ TKO_ShifMan_Kiss Sept_5th_2011.mp4', archive: 'ARCHIVE_006_data.json' },
      { file: 'videos/Archive_007_TempaT_Skepta_JME_LoganSama.mp4', archive: 'ARCHIVE_007_data.json' },
      { file: 'videos/Archive_008_Scrufizzer_2Face_Teeza_15th_November_2011.mp4', archive: 'ARCHIVE_008_data.json' },
      { file: 'videos/Archive_009_Trilla_crew_Crib_Session_Part_2TimWestwoodTV.mp4', archive: 'ARCHIVE_009_data.json' },
    ];
  }

  trackSelectorCell(id, cell) {
    this.activeSelectorCells.set(String(id), cell);
  }

  untrackSelectorCell(id) {
    this.activeSelectorCells.delete(String(id));
  }

  trackPlayerCell(id, cell) {
    this.activePlayerCells.set(String(id), cell);
  }

  untrackPlayerCell(id) {
    this.activePlayerCells.delete(String(id));
  }

  getLinkedSelector(id) {
    return this.activeSelectorCells.get(String(id));
  }

  updateHighlightState(targetCell = this.highlightedPlayerCell) {
    if (!targetCell || !this.activePlayerCells.has(String(targetCell.dataset.cellId))) {
      let latestId = -Infinity;
      this.activePlayerCells.forEach((cell, key) => {
        const pid = parseInt(key, 10);
        if (pid > latestId) {
          latestId = pid;
          targetCell = cell;
        }
      });
    }
    const previous = this.highlightedPlayerCell;
    this.highlightedPlayerCell = targetCell || null;
    this.activePlayerCells.forEach(cell => {
      const video = cell.querySelector('video');
      if (cell === this.highlightedPlayerCell) {
        cell.classList.add('highlighted-player-cell');
        if (video) video.muted = false;
      } else {
        cell.classList.remove('highlighted-player-cell');
        if (video) video.muted = true;
      }
    });
    if (this.highlightedPlayerCell !== previous) {
      document.dispatchEvent(new CustomEvent('highlightchange', { detail: { cell: this.highlightedPlayerCell } }));
    }
  }

  updateCellStyles(area) {
    const selector = this.getLinkedSelector(area.id);
    const player = this.activePlayerCells.get(String(area.id));
    if (selector) {
      selector.style.left = area.x + '%';
      selector.style.top = area.y + '%';
      selector.style.width = area.width + '%';
      selector.style.height = area.height + '%';
    }
    if (player) {
      player.style.left = area.x + '%';
      player.style.top = area.y + '%';
      player.style.width = area.width + '%';
      player.style.height = area.height + '%';
    }
  }

  computeNextArea() {
    const parent = this.layoutStack[this.layoutStack.length - 1];
    const area = {};
    if (this.nextHorizontal) {
      area.width = parent.width / 2;
      area.height = parent.height;
      area.x = parent.x + parent.width - area.width;
      area.y = parent.y;
      area.orientation = 'horizontal';
      parent.width /= 2;
    } else {
      area.width = parent.width;
      area.height = parent.height / 2;
      area.x = parent.x;
      area.y = parent.y + parent.height - area.height;
      area.orientation = 'vertical';
      parent.height /= 2;
    }
    this.updateCellStyles(parent);
    return area;
  }

  initOverallGrid() {
    const grid = document.getElementById('overall-grid');
    grid.innerHTML = '';
    return grid;
  }

  createSelectorCell(area, id, parentId = null) {
    const grid = document.getElementById('overall-grid');
    const cell = document.createElement('div');
    cell.className = 'selector-cell';
    cell.dataset.cellId = id;
    cell.dataset.orientation = area.orientation;
    if (parentId !== null) {
      cell.dataset.parentId = parentId;
      this.childSelectors.set(parentId, id);
    }
    cell.style.zIndex = id * 2;
    cell.style.width = area.width + '%';
    cell.style.height = area.height + '%';

    if (area.orientation === 'horizontal') {
      cell.style.left = area.x + area.width + '%';
      cell.style.top = area.y + '%';
      requestAnimationFrame(() => {
        cell.style.left = area.x + '%';
      });
    } else {
      cell.style.left = area.x + '%';
      cell.style.top = area.y + area.height + '%';
      requestAnimationFrame(() => {
        cell.style.top = area.y + '%';
      });
    }
    this.trackSelectorCell(id, cell);

    const selectorGrid = document.createElement('div');
    selectorGrid.className = 'selector-grid';
    cell.appendChild(selectorGrid);
    grid.appendChild(cell);

    this.archives.forEach(arch => {
      const thumb = buildThumbnail(arch, selectorGrid);
      thumb.dataset.file = arch.file;
      thumb.dataset.archive = arch.archive;
      thumb.dataset.title = arch.archive;
      thumb.addEventListener('click', () => this.onThumbnailClick(thumb));
    });

    return cell;
  }

  createPlayerCell(area, id, orientation, archive) {
    const grid = document.getElementById('overall-grid');
    const cell = document.createElement('div');
    cell.className = 'player-cell';
    cell.dataset.cellId = id;
    cell.dataset.orientation = orientation;
    cell.dataset.file = archive.file;
    cell.dataset.archive = archive.archive;
    if (archive.title) cell.dataset.title = archive.title;
    cell.style.zIndex = id * 2 + 1;
    cell.style.left = area.x + '%';
    cell.style.top = area.y + '%';
    cell.style.width = area.width + '%';
    cell.style.height = area.height + '%';

    let splitter = null;
    if (this.activePlayerCells.size > 0) {
      splitter = document.createElement('div');
      splitter.className = 'splitter';
      splitter.dataset.forPlayer = id;
      if (orientation === 'horizontal') {
        splitter.style.width = '3px';
        splitter.style.height = area.height + '%';
        splitter.style.left = area.x + '%';
        splitter.style.top = area.y + '%';
      } else {
        splitter.style.height = '3px';
        splitter.style.width = area.width + '%';
        splitter.style.left = area.x + '%';
        splitter.style.top = area.y + '%';
      }
      grid.appendChild(splitter);
    }

    const videoLayer = document.createElement('div');
    videoLayer.className = 'video-background-layer';
    const uiLayer = document.createElement('div');
    uiLayer.className = 'ui-foreground-layer';

    const videoWrapper = document.createElement('div');
    videoWrapper.className = 'video-wrapper';

    const video = document.createElement('video');
    video.src = archive.file;
    video.crossOrigin = 'anonymous';
    video.autoplay = true;
    video.loop = true;
    const canvas = document.createElement('canvas');

    videoWrapper.appendChild(video);
    videoWrapper.appendChild(canvas);
    videoLayer.appendChild(videoWrapper);

    cell.appendChild(videoLayer);
    cell.appendChild(uiLayer);

    const gridUiContainer = document.createElement('div');
    gridUiContainer.className = 'grid-manager-UI-container';

    const btnWhite = document.createElement('button');
    btnWhite.className = 'gm-btn white';
    gridUiContainer.appendChild(btnWhite);

    const btnGrey = document.createElement('button');
    btnGrey.className = 'gm-btn grey';
    gridUiContainer.appendChild(btnGrey);

    const btnBlack = document.createElement('button');
    btnBlack.className = 'gm-btn black';
    gridUiContainer.appendChild(btnBlack);

    cell.appendChild(gridUiContainer);

    grid.appendChild(cell);
    if (splitter) cell._splitter = splitter;
    this.trackPlayerCell(id, cell);
    cell.addEventListener('click', () => this.updateHighlightState(cell));

    requestAnimationFrame(async () => {
      cell._dispose = await initVideoShader(video, canvas, 'threshold_grey_gradient');
    });

    if (orientation === 'horizontal') {
      cell.style.left = area.x + area.width + '%';
      requestAnimationFrame(() => {
        cell.style.left = area.x + '%';
      });
    } else {
      cell.style.top = area.y + area.height + '%';
      requestAnimationFrame(() => {
        cell.style.top = area.y + '%';
      });
    }
    this.updateHighlightState(cell);
    return cell;
  }

  addPlayerControls(playerCell) {
    const container = playerCell.querySelector('.grid-manager-UI-container') || playerCell;
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-btn';
    closeBtn.textContent = 'Close';
    closeBtn.addEventListener('click', () => this.handleClose(playerCell));
    container.appendChild(closeBtn);

    const nextBtn = document.createElement('button');
    nextBtn.className = 'next-btn';
    nextBtn.textContent = 'Next';
    nextBtn.addEventListener('click', () => this.handleNext(playerCell));
    container.appendChild(nextBtn);

    const focusBtn = document.createElement('button');
    focusBtn.className = 'focus-btn';
    focusBtn.textContent = 'Focus';
    focusBtn.addEventListener('click', e => {
      e.stopPropagation();
      this.handleFocus(playerCell);
    });
    container.appendChild(focusBtn);
  }

  restoreLastPlayerControls() {
    if (this.activePlayerCells.size === 0) return;
    let lastId = -Infinity;
    let lastPlayer = null;
    this.activePlayerCells.forEach(p => {
      const pid = parseInt(p.dataset.cellId, 10);
      if (pid > lastId) {
        lastId = pid;
        lastPlayer = p;
      }
    });
    if (!lastPlayer) return;
    if (!lastPlayer.querySelector('.close-btn')) {
      this.addPlayerControls(lastPlayer);
    }
    this.ensureNextOnLast();
  }

  ensureNextOnLast() {
    if (this.activePlayerCells.size === 0) return;
    let lastId = -Infinity;
    let lastPlayer = null;
    this.activePlayerCells.forEach(p => {
      p.querySelector('.next-btn')?.remove();
      const pid = parseInt(p.dataset.cellId, 10);
      if (pid > lastId) {
        lastId = pid;
        lastPlayer = p;
      }
    });
    if (!lastPlayer) return;
    if (!lastPlayer.querySelector('.next-btn')) {
      const container = lastPlayer.querySelector('.grid-manager-UI-container') || lastPlayer;
      const nextBtn = document.createElement('button');
      nextBtn.className = 'next-btn';
      nextBtn.textContent = 'Next';
      nextBtn.addEventListener('click', () => this.handleNext(lastPlayer));
      container.appendChild(nextBtn);
    }
  }

  createCellPair(parentId) {
    const area = this.computeNextArea();
    const id = this.cellCounter++;
    area.id = id;
    this.createSelectorCell(area, id, parentId);
    this.layoutStack.push(area);
    this.nextHorizontal = !this.nextHorizontal;
  }

  closeSelectorCell(selectorCell) {
    return new Promise(resolve => {
      const id = selectorCell.dataset.cellId;
      const orientation = selectorCell.dataset.orientation;
      if (orientation === 'horizontal') {
        selectorCell.style.left = parseFloat(selectorCell.style.left) + parseFloat(selectorCell.style.width) + '%';
      } else {
        selectorCell.style.top = parseFloat(selectorCell.style.top) + parseFloat(selectorCell.style.height) + '%';
      }
      selectorCell.addEventListener('transitionend', () => {
        const parentId = selectorCell.dataset.parentId;
        if (parentId !== undefined) {
          this.childSelectors.delete(Number(parentId));
        }
        selectorCell.remove();
        this.untrackSelectorCell(id);
        const idx = this.layoutStack.findIndex(a => a.id == id);
        if (idx > 0) {
          const parent = this.layoutStack[idx - 1];
          const child = this.layoutStack[idx];
          if (child.orientation === 'horizontal') {
            parent.width *= 2;
          } else {
            parent.height *= 2;
          }
          this.layoutStack.splice(idx, 1);
          this.nextHorizontal = child.orientation === 'horizontal';
          this.updateCellStyles(parent);
        }
        resolve();
      }, { once: true });
    });
  }

  closeSelectorCellSimple(selectorCell) {
    return new Promise(resolve => {
      const orientation = selectorCell.dataset.orientation;
      if (orientation === 'horizontal') {
        selectorCell.style.left = parseFloat(selectorCell.style.left) + parseFloat(selectorCell.style.width) + '%';
      } else {
        selectorCell.style.top = parseFloat(selectorCell.style.top) + parseFloat(selectorCell.style.height) + '%';
      }
      selectorCell.addEventListener('transitionend', () => {
        const id = selectorCell.dataset.cellId;
        const parentId = selectorCell.dataset.parentId;
        if (parentId !== undefined) this.childSelectors.delete(Number(parentId));
        selectorCell.remove();
        this.untrackSelectorCell(id);
        resolve();
      }, { once: true });
    });
  }

  closePlayerCell(playerCell) {
    return new Promise(resolve => {
      const id = playerCell.dataset.cellId;
      const orientation = playerCell.dataset.orientation;
      const selector = this.getLinkedSelector(id);
      if (selector && id > 0) {
        const selOri = selector.dataset.orientation;
        if (selOri === 'horizontal') {
          selector.style.left = parseFloat(selector.style.left) + parseFloat(selector.style.width) + '%';
        } else {
          selector.style.top = parseFloat(selector.style.top) + parseFloat(selector.style.height) + '%';
        }
      } else if (selector) {
        selector.classList.remove('disabled');
        selector.style.pointerEvents = '';
      }
      if (orientation === 'horizontal') {
        playerCell.style.left = parseFloat(playerCell.style.left) + parseFloat(playerCell.style.width) + '%';
      } else {
        playerCell.style.top = parseFloat(playerCell.style.top) + parseFloat(playerCell.style.height) + '%';
      }
      playerCell.addEventListener('transitionend', () => {
        if (playerCell._dispose) playerCell._dispose();
        const vid = playerCell.querySelector('video');
        if (vid) vid.pause();
        if (playerCell._splitter) playerCell._splitter.remove();
        playerCell.remove();
        this.untrackPlayerCell(id);
        this.updateHighlightState();
        if (selector && id > 0) {
          const pAttr = selector.dataset.parentId;
          if (pAttr !== undefined) this.childSelectors.delete(Number(pAttr));
          selector.remove();
          this.untrackSelectorCell(id);
          const idx = this.layoutStack.findIndex(a => a.id == id);
          if (idx > 0) {
            const parent = this.layoutStack[idx - 1];
            const child = this.layoutStack[idx];
            if (child.orientation === 'horizontal') parent.width *= 2; else parent.height *= 2;
            this.layoutStack.splice(idx, 1);
            this.nextHorizontal = child.orientation === 'horizontal';
            this.updateCellStyles(parent);
          }
        }
        resolve();
      }, { once: true });
    });
  }

  closePlayerCellSimple(playerCell) {
    return new Promise(resolve => {
      const id = playerCell.dataset.cellId;
      const orientation = playerCell.dataset.orientation;
      if (orientation === 'horizontal') {
        playerCell.style.left = parseFloat(playerCell.style.left) + parseFloat(playerCell.style.width) + '%';
      } else {
        playerCell.style.top = parseFloat(playerCell.style.top) + parseFloat(playerCell.style.height) + '%';
      }
      playerCell.addEventListener('transitionend', () => {
        if (playerCell._dispose) playerCell._dispose();
        const vid = playerCell.querySelector('video');
        if (vid) vid.pause();
        if (playerCell._splitter) playerCell._splitter.remove();
        playerCell.remove();
        this.untrackPlayerCell(id);
        this.updateHighlightState();
        resolve();
      }, { once: true });
    });
  }

  async closePlayerAnywhere(playerCell) {
    const id = parseInt(playerCell.dataset.cellId, 10);
    const area = this.layoutStack.find(a => a.id == id);

    await this.closePlayerCellSimple(playerCell);

    let prevArea = area;
    let currentId = id + 1;
    while (true) {
      const nextCell = this.activePlayerCells.get(String(currentId));
      if (!nextCell) break;
      const nextArea = this.layoutStack.find(a => a.id == currentId);
      nextCell.style.left = prevArea.x + '%';
      nextCell.style.top = prevArea.y + '%';
      nextCell.style.width = prevArea.width + '%';
      nextCell.style.height = prevArea.height + '%';
      nextCell.style.zIndex = (currentId - 1) * 2 + 1;
      nextCell.dataset.orientation = prevArea.orientation;
      await new Promise(res => nextCell.addEventListener('transitionend', res, { once: true }));
      this.activePlayerCells.delete(String(currentId));
      nextCell.dataset.cellId = currentId - 1;
      this.activePlayerCells.set(String(currentId - 1), nextCell);
      const childId = this.childSelectors.get(currentId);
      if (childId !== undefined) {
        this.childSelectors.delete(currentId);
        this.childSelectors.set(currentId - 1, childId);
        const childSelector = this.activeSelectorCells.get(String(childId));
        if (childSelector) childSelector.dataset.parentId = currentId - 1;
      }
      prevArea = nextArea;
      currentId++;
    }

    const removed = this.layoutStack.pop();
    this.nextHorizontal = removed.orientation === 'horizontal';
  }

  delay(ms) {
    return new Promise(res => setTimeout(res, ms));
  }

  closePlayerPair(playerCell) {
    return this.closePlayerCell(playerCell);
  }

  async closeChildren(id) {
    const ids = Array.from(this.activePlayerCells.keys())
      .map(Number)
      .filter(pid => pid > id)
      .sort((a, b) => b - a);
    for (const pid of ids) {
      const cell = this.activePlayerCells.get(String(pid));
      if (cell) {
        await this.closePlayerPair(cell);
        await this.delay(300);
      }
    }
  }

  async cascadePromote(id) {
    let playerCell = this.activePlayerCells.get(String(id));
    if (!playerCell) return;

    if (playerCell._splitter) {
      playerCell._splitter.remove();
      playerCell._splitter = null;
    }

    const selfSelector = this.getLinkedSelector(id);
    if (id > 0 && selfSelector) {
      await this.closeSelectorCell(selfSelector);
    } else if (selfSelector) {
      selfSelector.classList.add('disabled');
      selfSelector.style.pointerEvents = 'none';
    }

    while (id > 0) {
      const parentId = id - 1;
      const parentCell = this.activePlayerCells.get(String(parentId));
      const parentSelector = this.getLinkedSelector(parentId);
      const area = this.layoutStack.find(a => a.id == parentId);

      if (area) {
        playerCell.style.left = area.x + '%';
        playerCell.style.top = area.y + '%';
        playerCell.style.width = area.width + '%';
        playerCell.style.height = area.height + '%';
        playerCell.style.zIndex = parentId * 2 + 1;
        playerCell.dataset.orientation = area.orientation;
      }

      await new Promise(res => playerCell.addEventListener('transitionend', res, { once: true }));

      if (parentCell) {
        await this.closePlayerPair(parentCell);
        if (parentId === 0 && parentSelector) {
          parentSelector.classList.add('disabled');
          parentSelector.style.pointerEvents = 'none';
        }
      } else if (parentSelector && parentId > 0) {
        await this.closeSelectorCell(parentSelector);
      } else if (parentSelector && parentId === 0) {
        parentSelector.classList.add('disabled');
        parentSelector.style.pointerEvents = 'none';
      }

      this.activePlayerCells.delete(String(id));
      playerCell.dataset.cellId = parentId;
      this.activePlayerCells.set(String(parentId), playerCell);
      id = parentId;
      await this.delay(100);
    }
  }

  resetLayoutStack(playerCell) {
    const oldId = playerCell.dataset.cellId;
    this.layoutStack.length = 1;
    this.layoutStack[0] = { x: 0, y: 0, width: 100, height: 100, orientation: 'vertical', id: 0 };
    this.nextHorizontal = true;
    this.cellCounter = 1;
    playerCell.dataset.cellId = 0;
    playerCell.dataset.orientation = 'vertical';
    playerCell.style.zIndex = 1;
    this.activePlayerCells.delete(String(oldId));
    this.activePlayerCells.set('0', playerCell);
  }

  async focusPlayerCell(id) {
    const playerCell = this.activePlayerCells.get(String(id));
    if (!playerCell) return;
    await this.closeChildren(id);
    await this.cascadePromote(id);
    this.resetLayoutStack(playerCell);
    this.restoreLastPlayerControls();
  }

  handleFocus(playerCell) {
    const id = parseInt(playerCell.dataset.cellId, 10);
    this.focusPlayerCell(id);
  }

  handleNext(currentPlayer) {
    const parentId = parseInt(currentPlayer.dataset.cellId, 10);
    const maxId = Math.max(...Array.from(this.activePlayerCells.keys()).map(Number));
    if (parentId !== maxId) return;

    const existingId = this.childSelectors.get(parentId);
    if (existingId !== undefined && this.activeSelectorCells.has(String(existingId))) {
      return; // already open
    }
    const nextBtn = currentPlayer.querySelector('.next-btn');
    if (nextBtn) nextBtn.disabled = true;
    this.createCellPair(parentId);
    if (nextBtn) nextBtn.disabled = false;
  }

  async handleClose(playerCell) {
    const id = parseInt(playerCell.dataset.cellId, 10);
    const childId = this.childSelectors.get(id);
    const childSelector = childId !== undefined ? this.activeSelectorCells.get(String(childId)) : null;

    if (childSelector) {
      await this.closeSelectorCell(childSelector);
      return;
    }

    const maxId = Math.max(...Array.from(this.activePlayerCells.keys()).map(Number));
    if (id === maxId) {
      await this.closePlayerCell(playerCell);
    } else {
      await this.closePlayerAnywhere(playerCell);
    }
    this.restoreLastPlayerControls();
  }

  onThumbnailClick(thumb) {
    const selector = thumb.closest('.selector-cell');
    if (!selector) return;
    const id = selector.dataset.cellId;
    selector.classList.add('disabled');
    selector.style.pointerEvents = 'none';
    this.activePlayerCells.forEach(p => {
      p.querySelector('.next-btn')?.remove();
    });
    const area = this.layoutStack.find(a => a.id == id);
    const archive = { file: thumb.dataset.file, archive: thumb.dataset.archive, title: thumb.dataset.title || thumb.textContent };
    const player = this.createPlayerCell(area, id, area.orientation, archive);
    this.addPlayerControls(player);
    this.ensureNextOnLast();
  }

  init() {
    this.initOverallGrid();
    this.createSelectorCell(this.layoutStack[0], this.cellCounter++);
  }
}

export const gridManager = new GridNavigationManager();

document.addEventListener('DOMContentLoaded', () => {
  gridManager.init();
});

export default gridManager;
