import { buildThumbnail } from './buildThumbnail.js';
import { initVideoShader } from './videoShader.js';

const activeSelectorCells = new Map();
const activePlayerCells = new Map();
// Map parent player id -> child selector id
const childSelectors = new Map();
let cellCounter = 0;
const layoutStack = [{ x: 0, y: 0, width: 100, height: 100, orientation: 'vertical', id: 0 }];
let nextHorizontal = true;

const archives = [
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

function trackSelectorCell(id, cell) {
    activeSelectorCells.set(String(id), cell);
    console.log(`Selector added at ${id}`);
}

function untrackSelectorCell(id) {
    activeSelectorCells.delete(String(id));
}

function trackPlayerCell(id, cell) {
    activePlayerCells.set(String(id), cell);
    console.log(`Player opened at slot ${id}`);
}

function untrackPlayerCell(id) {
    activePlayerCells.delete(String(id));
}

function getLinkedSelector(id) {
    return activeSelectorCells.get(String(id));
}

function updateCellStyles(area) {
    const selector = getLinkedSelector(area.id);
    const player = activePlayerCells.get(String(area.id));
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

function computeNextArea() {
    const parent = layoutStack[layoutStack.length - 1];
    const area = {};
    if (nextHorizontal) {
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
    updateCellStyles(parent);
    return area;
}

function initOverallGrid() {
    const grid = document.getElementById('overall-grid');
    grid.innerHTML = '';
    return grid;
}

function createSelectorCell(area, id, parentId = null) {
    const grid = document.getElementById('overall-grid');
    const cell = document.createElement('div');
    cell.className = 'selector-cell';
    cell.dataset.cellId = id;
    cell.dataset.orientation = area.orientation;
    if (parentId !== null) {
        cell.dataset.parentId = parentId;
        childSelectors.set(parentId, id);
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
    trackSelectorCell(id, cell);

    const selectorGrid = document.createElement('div');
    selectorGrid.className = 'selector-grid';
    cell.appendChild(selectorGrid);

    grid.appendChild(cell);

    archives.forEach(arch => {
        const thumb = buildThumbnail(arch, selectorGrid);
        thumb.dataset.file = arch.file;
        thumb.dataset.archive = arch.archive;
        thumb.dataset.title = arch.archive;
        thumb.addEventListener('click', () => onThumbnailClick(thumb));
    });

    return cell;
}

function createPlayerCell(area, id, orientation, archive) {
    const grid = document.getElementById('overall-grid');
    const cell = document.createElement('div');
    cell.className = 'player-cell';
    cell.dataset.cellId = id;
    cell.dataset.orientation = orientation;
    cell.style.zIndex = id * 2 + 1;
    cell.style.left = area.x + '%';
    cell.style.top = area.y + '%';
    cell.style.width = area.width + '%';
    cell.style.height = area.height + '%';

    let splitter = null;
    if (activePlayerCells.size > 0) {
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
        splitter.style.zIndex = cell.style.zIndex;
        grid.appendChild(splitter);
    }

    const videoLayer = document.createElement('div');
    videoLayer.className = 'video-background-layer';
    const uiLayer = document.createElement('div');
    uiLayer.className = 'ui-foreground-layer';

    const video = document.createElement('video');
    video.src = archive.file;
    video.crossOrigin = 'anonymous';
    video.autoplay = true;
    video.loop = true;
    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    videoLayer.appendChild(video);
    videoLayer.appendChild(canvas);
    cell.appendChild(videoLayer);
    cell.appendChild(uiLayer);

    grid.appendChild(cell);
    if (splitter) cell._splitter = splitter;
    trackPlayerCell(id, cell);

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
    return cell;
}

function addPlayerControls(playerCell, uiLayer) {
    const backBtn = document.createElement('button');
    backBtn.className = 'return-btn';
    backBtn.textContent = 'Back';
    backBtn.addEventListener('click', () => handleBack(playerCell));
    uiLayer.appendChild(backBtn);

    const nextBtn = document.createElement('button');
    nextBtn.className = 'next-btn';
    nextBtn.textContent = 'Next';
    nextBtn.addEventListener('click', () => handleNext(playerCell));
    uiLayer.appendChild(nextBtn);
}

function restoreLastPlayerControls() {
    if (activePlayerCells.size === 0) return;
    let lastId = -Infinity;
    let lastPlayer = null;
    activePlayerCells.forEach(p => {
        const pid = parseInt(p.dataset.cellId, 10);
        if (pid > lastId) {
            lastId = pid;
            lastPlayer = p;
        }
    });
    if (!lastPlayer) return;
    const uiLayer = lastPlayer.querySelector('.ui-foreground-layer');
    if (!uiLayer.querySelector('.return-btn')) {
        addPlayerControls(lastPlayer, uiLayer);
    }
}

function replaceCell(oldCell, newCell) {
    const grid = document.getElementById('overall-grid');
    if (grid && oldCell && newCell) {
        grid.replaceChild(newCell, oldCell);
    }
}

function createCellPair(parentId) {
    const area = computeNextArea();
    const id = cellCounter++;
    area.id = id;
    createSelectorCell(area, id, parentId);
    layoutStack.push(area);
    nextHorizontal = !nextHorizontal;
}
function closeSelectorCell(selectorCell) {
    return new Promise(resolve => {
        const id = selectorCell.dataset.cellId;
        const orientation = selectorCell.dataset.orientation;
        if (orientation === "horizontal") {
            selectorCell.style.left = (parseFloat(selectorCell.style.left) + parseFloat(selectorCell.style.width)) + "%";
        } else {
            selectorCell.style.top = (parseFloat(selectorCell.style.top) + parseFloat(selectorCell.style.height)) + "%";
        }
        selectorCell.addEventListener("transitionend", () => {
            const parentId = selectorCell.dataset.parentId;
            if (parentId !== undefined) {
                childSelectors.delete(Number(parentId));
            }
            selectorCell.remove();
            untrackSelectorCell(id);
            const idx = layoutStack.findIndex(a => a.id == id);
            if (idx > 0) {
                const parent = layoutStack[idx - 1];
                const child = layoutStack[idx];
                if (child.orientation === "horizontal") {
                    parent.width *= 2;
                } else {
                    parent.height *= 2;
                }
                layoutStack.splice(idx, 1);
                nextHorizontal = child.orientation === "horizontal";
                updateCellStyles(parent);
            }
            resolve();
        }, { once: true });
    });
}

function handleBack(playerCell) {
    const id = parseInt(playerCell.dataset.cellId, 10);
    const childId = childSelectors.get(id);
    const childSelector = childId !== undefined ? activeSelectorCells.get(String(childId)) : null;
    const parentSelector = getLinkedSelector(id);
    const afterClose = () => {
        if (parentSelector) {
            parentSelector.classList.remove('disabled');
            parentSelector.style.pointerEvents = '';
        }
        restoreLastPlayerControls();
    };
    const closePlayer = () => closePlayerCell(playerCell).then(afterClose);
    if (childSelector) {
        closeSelectorCell(childSelector).then(closePlayer);
    } else {
        closePlayer();
    }
}


function closePlayerCell(playerCell) {
    return new Promise(resolve => {
        const id = playerCell.dataset.cellId;
        const orientation = playerCell.dataset.orientation;
        if (orientation === 'horizontal') {
            playerCell.style.left = (parseFloat(playerCell.style.left) + parseFloat(playerCell.style.width)) + '%';
        } else {
            playerCell.style.top = (parseFloat(playerCell.style.top) + parseFloat(playerCell.style.height)) + '%';
        }
        playerCell.addEventListener('transitionend', () => {
            if (playerCell._dispose) {
                playerCell._dispose();
            }
            const vid = playerCell.querySelector('video');
            if (vid) vid.pause();
            if (playerCell._splitter) {
                playerCell._splitter.remove();
            }
            playerCell.remove();
            untrackPlayerCell(id);
            const selector = getLinkedSelector(id);
            if (selector) {
                selector.classList.remove('disabled');
                selector.style.pointerEvents = '';
                console.log(`Selector ${id} re-enabled`);
            }
            resolve();
        }, { once: true });
    });
}

function handleNext(currentPlayer) {
    const parentId = parseInt(currentPlayer.dataset.cellId, 10);
    const existingId = childSelectors.get(parentId);
    if (existingId !== undefined && activeSelectorCells.has(String(existingId))) {
        return; // already open
    }
    const nextBtn = currentPlayer.querySelector('.next-btn');
    if (nextBtn) nextBtn.disabled = true;
    createCellPair(parentId);
    if (nextBtn) nextBtn.disabled = false;
}

function onThumbnailClick(thumb) {
    const selector = thumb.closest('.selector-cell');
    if (!selector) return;
    const id = selector.dataset.cellId;
    selector.classList.add('disabled');
    selector.style.pointerEvents = 'none';
    activePlayerCells.forEach(p => {
        p.querySelector('.return-btn')?.remove();
        p.querySelector('.next-btn')?.remove();
    });
    const area = layoutStack.find(a => a.id == id);
    const archive = { file: thumb.dataset.file, archive: thumb.dataset.archive, title: thumb.dataset.title || thumb.textContent };
    const player = createPlayerCell(area, id, area.orientation, archive);
    const uiLayer = player.querySelector('.ui-foreground-layer');
    addPlayerControls(player, uiLayer);
}

document.addEventListener('DOMContentLoaded', () => {
    initOverallGrid();
    createSelectorCell(layoutStack[0], cellCounter++);
});
