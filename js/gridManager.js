const activeSelectorCells = new Map();
const activePlayerCells = new Map();
let cellCounter = 0;

function trackSelectorCell(id, cell) {
    activeSelectorCells.set(id, cell);
    console.log(`Selector added at ${id}`);
}

function untrackSelectorCell(id) {
    activeSelectorCells.delete(id);
}

function trackPlayerCell(id, cell) {
    activePlayerCells.set(id, cell);
    console.log(`Player opened at slot ${id}`);
}

function untrackPlayerCell(id) {
    activePlayerCells.delete(id);
}

function getLinkedSelector(id) {
    return activeSelectorCells.get(id);
}

function initOverallGrid() {
    const grid = document.getElementById('overall-grid');
    grid.innerHTML = '';
    return grid;
}

function addSelectorCell() {
    const grid = document.getElementById('overall-grid');
    const cell = document.createElement('div');
    const id = cellCounter++;
    cell.className = 'selector-cell';
    cell.dataset.cellId = id;
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

function addPlayerCell(text, id) {
    const grid = document.getElementById('overall-grid');
    const cell = document.createElement('div');
    cell.className = 'player-cell';
    cell.dataset.cellId = id;
    cell.textContent = text;

    const backBtn = document.createElement('button');
    backBtn.className = 'return-btn';
    backBtn.textContent = 'Back';
    backBtn.addEventListener('click', () => closePlayerCell(cell));
    cell.appendChild(backBtn);

    grid.appendChild(cell);
    trackPlayerCell(id, cell);
    // allow CSS transition
    requestAnimationFrame(() => {
        cell.style.top = '0';
    });
    return cell;
}

function replaceCell(oldCell, newCell) {
    const grid = document.getElementById('overall-grid');
    if (grid && oldCell && newCell) {
        grid.replaceChild(newCell, oldCell);
    }
}

function closePlayerCell(playerCell) {
    const id = playerCell.dataset.cellId;
    playerCell.style.top = '100%';
    playerCell.addEventListener('transitionend', () => {
        playerCell.remove();
        untrackPlayerCell(id);
        const selector = getLinkedSelector(id);
        if (selector) selector.classList.remove('disabled');
    }, { once: true });
}

function onThumbnailClick(thumb) {
    const selector = thumb.closest('.selector-cell');
    if (!selector) return;
    const id = selector.dataset.cellId;
    selector.classList.add('disabled');
    addPlayerCell(thumb.textContent, id);
}

document.addEventListener('DOMContentLoaded', () => {
    initOverallGrid();
    addSelectorCell();
});
