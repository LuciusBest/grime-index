function initOverallGrid() {
    const grid = document.getElementById('overall-grid');
    grid.innerHTML = '';
    return grid;
}

function addSelectorCell() {
    const grid = document.getElementById('overall-grid');
    const cell = document.createElement('div');
    cell.className = 'selector-cell';

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

function addPlayerCell(text) {
    const grid = document.getElementById('overall-grid');
    const cell = document.createElement('div');
    cell.className = 'player-cell';
    cell.textContent = text;
    grid.appendChild(cell);
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

function onThumbnailClick(thumb) {
    const selector = thumb.closest('.selector-cell');
    if (!selector) return;
    selector.classList.add('disabled');
    addPlayerCell(thumb.textContent);
}

document.addEventListener('DOMContentLoaded', () => {
    initOverallGrid();
    addSelectorCell();
});
