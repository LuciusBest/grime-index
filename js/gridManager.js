const activeSelectorCells = new Map();
const activePlayerCells = new Map();
let cellCounter = 0;
const layoutStack = [{ x: 0, y: 0, width: 100, height: 100 }];
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

function computeNextArea() {
    const parent = layoutStack[layoutStack.length - 1];
    const area = {};
    if (nextHorizontal) {
        area.width = parent.width / 2;
        area.height = parent.height;
        area.x = parent.x + parent.width - area.width;
        area.y = parent.y;
    } else {
        area.width = parent.width;
        area.height = parent.height / 2;
        area.x = parent.x;
        area.y = parent.y + parent.height - area.height;
    }
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
    cell.style.left = area.x + '%';
    cell.style.top = area.y + '%';
    cell.style.width = area.width + '%';
    cell.style.height = area.height + '%';
    cell.textContent = text;

    const backBtn = document.createElement('button');
    backBtn.className = 'return-btn';
    backBtn.textContent = 'Back';
    backBtn.addEventListener('click', () => closePlayerCell(cell));
    cell.appendChild(backBtn);

    const nextBtn = document.createElement('button');
    nextBtn.className = 'next-btn';
    nextBtn.textContent = 'Next';
    nextBtn.addEventListener('click', () => handleNext(cell));
    cell.appendChild(nextBtn);

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

function replaceCell(oldCell, newCell) {
    const grid = document.getElementById('overall-grid');
    if (grid && oldCell && newCell) {
        grid.replaceChild(newCell, oldCell);
    }
}

function createCellPair() {
    const area = computeNextArea();
    const id = cellCounter++;
    const selector = createSelectorCell(area, id);
    const player = createPlayerCell(area, id, nextHorizontal ? 'horizontal' : 'vertical');
    selector.classList.add('disabled');
    selector.style.pointerEvents = 'none';
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
    const area = layoutStack[layoutStack.length - 1];
    createPlayerCell(area, id, 'vertical', thumb.textContent);
}

document.addEventListener('DOMContentLoaded', () => {
    initOverallGrid();
    createSelectorCell(layoutStack[0], cellCounter++);
});
