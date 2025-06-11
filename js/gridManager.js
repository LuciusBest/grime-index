const activeSelectorCells = new Map();
const activePlayerCells = new Map();
let cellCounter = 0;
const layoutStack = [{ x: 0, y: 0, width: 100, height: 100, orientation: 'vertical', id: 0 }];
let nextHorizontal = true;

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

function createSelectorCell(area, id) {
    const grid = document.getElementById('overall-grid');
    const cell = document.createElement('div');
    cell.className = 'selector-cell';
    cell.dataset.cellId = id;
    cell.style.zIndex = id * 2;
    cell.style.left = area.x + '%';
    cell.style.top = area.y + '%';
    cell.style.width = area.width + '%';
    cell.style.height = area.height + '%';
    trackSelectorCell(id, cell);

    const selectorGrid = document.createElement('div');
    selectorGrid.className = 'selector-grid';

    for (let i = 1; i <= 9; i++) {
        const placeholder = document.createElement('div');
        placeholder.className = 'thumbnail-cell';
        placeholder.textContent = `Cell ${i}`;
        placeholder.addEventListener('click', () => onThumbnailClick(placeholder));
        selectorGrid.appendChild(placeholder);
    }

    cell.appendChild(selectorGrid);
    grid.appendChild(cell);
    return cell;
}

function createPlayerCell(area, id, orientation, text = `Player ${id}`) {
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
    cell.textContent = text;

    grid.appendChild(cell);
    trackPlayerCell(id, cell);

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

function addPlayerControls(playerCell) {
    const backBtn = document.createElement('button');
    backBtn.className = 'return-btn';
    backBtn.textContent = 'Back';
    backBtn.addEventListener('click', () => closePlayerCell(playerCell));
    playerCell.appendChild(backBtn);

    const nextBtn = document.createElement('button');
    nextBtn.className = 'next-btn';
    nextBtn.textContent = 'Next';
    nextBtn.addEventListener('click', () => handleNext(playerCell));
    playerCell.appendChild(nextBtn);
}

function replaceCell(oldCell, newCell) {
    const grid = document.getElementById('overall-grid');
    if (grid && oldCell && newCell) {
        grid.replaceChild(newCell, oldCell);
    }
}

function createCellPair() {
    const area = computeNextArea();
    const id = cellCounter++;
    area.id = id;
    createSelectorCell(area, id);
    layoutStack.push(area);
    nextHorizontal = !nextHorizontal;
}

function closePlayerCell(playerCell) {
    const id = playerCell.dataset.cellId;
    const orientation = playerCell.dataset.orientation;
    if (orientation === 'horizontal') {
        playerCell.style.left = (parseFloat(playerCell.style.left) + parseFloat(playerCell.style.width)) + '%';
    } else {
        playerCell.style.top = (parseFloat(playerCell.style.top) + parseFloat(playerCell.style.height)) + '%';
    }
    playerCell.addEventListener('transitionend', () => {
        playerCell.remove();
        untrackPlayerCell(id);
        const selector = getLinkedSelector(id);
        if (selector) {
            selector.classList.remove('disabled');
            selector.style.pointerEvents = '';
            console.log(`Selector ${id} re-enabled`);
        }
    }, { once: true });
}

function handleNext(currentPlayer) {
    createCellPair();
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
    const player = createPlayerCell(area, id, area.orientation, thumb.textContent);
    addPlayerControls(player);
}

document.addEventListener('DOMContentLoaded', () => {
    initOverallGrid();
    createSelectorCell(layoutStack[0], cellCounter++);
});
