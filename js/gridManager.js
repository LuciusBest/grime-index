import { buildThumbnail } from './buildThumbnail.js';
import { initVideoShader } from './videoShader.js';

const activeSelectorCells = new Map();
const activePlayerCells = new Map();
// Map parent player id -> child selector id
const childSelectors = new Map();
let cellCounter = 0;
const layoutStack = [{ x: 0, y: 0, width: 100, height: 100, orientation: 'vertical', id: 0 }];
let nextHorizontal = true;
let highlightedPlayerCell = null;

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

function updateHighlightState(targetCell = highlightedPlayerCell) {
    if (!targetCell || !activePlayerCells.has(String(targetCell.dataset.cellId))) {
        let latestId = -Infinity;
        activePlayerCells.forEach((cell, key) => {
            const pid = parseInt(key, 10);
            if (pid > latestId) {
                latestId = pid;
                targetCell = cell;
            }
        });
    }
    highlightedPlayerCell = targetCell || null;
    activePlayerCells.forEach(cell => {
        const video = cell.querySelector('video');
        if (cell === highlightedPlayerCell) {
            cell.classList.add('highlighted-player-cell');
            if (video) video.muted = false;
        } else {
            cell.classList.remove('highlighted-player-cell');
            if (video) video.muted = true;
        }
    });
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
        grid.appendChild(splitter);
        console.log('Splitter inserted for player', id);
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

    grid.appendChild(cell);
    if (splitter) cell._splitter = splitter;
    trackPlayerCell(id, cell);
    cell.addEventListener('click', () => updateHighlightState(cell));

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
    updateHighlightState(cell);
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

    const focusBtn = document.createElement('button');
    focusBtn.className = 'focus-btn';
    focusBtn.textContent = 'Focus';
    focusBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleFocus(playerCell);
    });
    uiLayer.appendChild(focusBtn);
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
    const childSelector =
        childId !== undefined ? activeSelectorCells.get(String(childId)) : null;

    if (childSelector) {
        // Step 1: close only the child selector and keep the player open
        closeSelectorCell(childSelector).then(() => {
            restoreLastPlayerControls();
        });
        return;
    }

    closePlayerCell(playerCell).then(() => {
        restoreLastPlayerControls();
    });
}


function closePlayerCell(playerCell) {
    return new Promise(resolve => {
        const id = playerCell.dataset.cellId;
        const orientation = playerCell.dataset.orientation;
        const selector = getLinkedSelector(id);
        if (selector && id > 0) {
            const selOri = selector.dataset.orientation;
            if (selOri === "horizontal") {
                selector.style.left = (parseFloat(selector.style.left) + parseFloat(selector.style.width)) + "%";
            } else {
                selector.style.top = (parseFloat(selector.style.top) + parseFloat(selector.style.height)) + "%";
            }
        } else if (selector) {
            selector.classList.remove("disabled");
            selector.style.pointerEvents = "";
        }
        if (orientation === "horizontal") {
            playerCell.style.left = (parseFloat(playerCell.style.left) + parseFloat(playerCell.style.width)) + "%";
        } else {
            playerCell.style.top = (parseFloat(playerCell.style.top) + parseFloat(playerCell.style.height)) + "%";
        }
        playerCell.addEventListener("transitionend", () => {
            if (playerCell._dispose) playerCell._dispose();
            const vid = playerCell.querySelector("video");
            if (vid) vid.pause();
            if (playerCell._splitter) playerCell._splitter.remove();
            playerCell.remove();
            untrackPlayerCell(id);
            updateHighlightState();
            if (selector && id > 0) {
                const pAttr = selector.dataset.parentId;
                if (pAttr !== undefined) childSelectors.delete(Number(pAttr));
                selector.remove();
                untrackSelectorCell(id);
                const idx = layoutStack.findIndex(a => a.id == id);
                if (idx > 0) {
                    const parent = layoutStack[idx - 1];
                    const child = layoutStack[idx];
                    if (child.orientation === "horizontal") parent.width *= 2; else parent.height *= 2;
                    layoutStack.splice(idx, 1);
                    nextHorizontal = child.orientation === "horizontal";
                    updateCellStyles(parent);
                }
            }
            resolve();
        }, { once: true });
    });
}

function delay(ms) {
    return new Promise(res => setTimeout(res, ms));
}
function closePlayerPair(playerCell) {
    return closePlayerCell(playerCell);
}

async function closeChildren(id) {
    const ids = Array.from(activePlayerCells.keys())
        .map(Number)
        .filter(pid => pid > id)
        .sort((a, b) => b - a);
    for (const pid of ids) {
        const cell = activePlayerCells.get(String(pid));
        if (cell) {
            await closePlayerPair(cell);
            await delay(300);
        }
    }
}

async function cascadePromote(id) {
    let playerCell = activePlayerCells.get(String(id));
    if (!playerCell) return;
    if (playerCell._splitter) {
        playerCell._splitter.remove();
        playerCell._splitter = null;
    }
    const selfSelector = getLinkedSelector(id);
    if (id > 0 && selfSelector) {
        const parentIdAttr = selfSelector.dataset.parentId;
        if (parentIdAttr !== undefined) {
            childSelectors.delete(Number(parentIdAttr));
        }
        selfSelector.remove();
        untrackSelectorCell(id);
        const idx = layoutStack.findIndex(a => a.id == id);
        if (idx > 0) {
            const parent = layoutStack[idx - 1];
            const child = layoutStack[idx];
            if (child.orientation === 'horizontal') {
                parent.width *= 2;
            } else {
                parent.height *= 2;
            }
            layoutStack.splice(idx, 1);
            nextHorizontal = child.orientation === 'horizontal';
            updateCellStyles(parent);
        }
        await delay(300);
    }
    while (id > 0) {
        const parentId = id - 1;
        const parentCell = activePlayerCells.get(String(parentId));
        const parentSelector = getLinkedSelector(parentId);
        const area = layoutStack.find(a => a.id == parentId);
        if (parentSelector && parentId > 0) {
            const orient = parentSelector.dataset.orientation;
            if (orient === "horizontal") {
                parentSelector.style.left = (parseFloat(parentSelector.style.left) + parseFloat(parentSelector.style.width)) + "%";
            } else {
                parentSelector.style.top = (parseFloat(parentSelector.style.top) + parseFloat(parentSelector.style.height)) + "%";
            }
        } else if (parentSelector && parentId === 0) {
            parentSelector.classList.add("disabled");
            parentSelector.style.pointerEvents = "none";
        }
        if (area) {
            playerCell.style.left = area.x + "%";
            playerCell.style.top = area.y + "%";
            playerCell.style.width = area.width + "%";
            playerCell.style.height = area.height + "%";
            playerCell.style.zIndex = parentId * 2 + 1;
            playerCell.dataset.orientation = area.orientation;
        }
        await new Promise(res => playerCell.addEventListener("transitionend", res, { once: true }));
        if (parentCell) {
            if (parentCell._dispose) parentCell._dispose();
            const vid = parentCell.querySelector("video");
            if (vid) vid.pause();
            if (parentCell._splitter) parentCell._splitter.remove();
            parentCell.remove();
            untrackPlayerCell(parentId);
        }
        if (parentSelector && parentId > 0) {
            const pAttr = parentSelector.dataset.parentId;
            if (pAttr !== undefined) childSelectors.delete(Number(pAttr));
            parentSelector.remove();
            untrackSelectorCell(parentId);
            const idx = layoutStack.findIndex(a => a.id == parentId);
            if (idx > 0) {
                const parent = layoutStack[idx - 1];
                const child = layoutStack[idx];
                if (child.orientation === "horizontal") parent.width *= 2; else parent.height *= 2;
                layoutStack.splice(idx, 1);
                nextHorizontal = child.orientation === "horizontal";
                updateCellStyles(parent);
            }
        }
        activePlayerCells.delete(String(id));
        playerCell.dataset.cellId = parentId;
        activePlayerCells.set(String(parentId), playerCell);
        id = parentId;
    }
}

function resetLayoutStack(playerCell) {
    const oldId = playerCell.dataset.cellId;
    layoutStack.length = 1;
    layoutStack[0] = { x: 0, y: 0, width: 100, height: 100, orientation: 'vertical', id: 0 };
    nextHorizontal = true;
    cellCounter = 1;
    playerCell.dataset.cellId = 0;
    playerCell.dataset.orientation = 'vertical';
    playerCell.style.zIndex = 1;
    activePlayerCells.delete(String(oldId));
    activePlayerCells.set('0', playerCell);
}

async function focusPlayerCell(id) {
    const playerCell = activePlayerCells.get(String(id));
    if (!playerCell) return;
    await closeChildren(id);
    await cascadePromote(id);
    resetLayoutStack(playerCell);
    restoreLastPlayerControls();
}

function handleFocus(playerCell) {
    const id = parseInt(playerCell.dataset.cellId, 10);
    focusPlayerCell(id);
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
