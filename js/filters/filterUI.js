
import { toggleFilter, activeFilters } from "./activeFilters.js";
import { getArchiveStates } from "./filterManager.js";

export function setupFilterUI(globalIndex) {
  const table = document.querySelector(".global-index-table");
  if (!table) return;

  table.querySelectorAll("tbody tr").forEach(row => {
    const [speakerCell, instruCell, archiveCell] = row.children;

    const speaker = speakerCell.textContent.trim();
    const instru = instruCell.textContent.trim();
    const archiveTitle = archiveCell.textContent.trim();

    if (speaker) {
      speakerCell.style.cursor = "pointer";
      speakerCell.onclick = () => {
        toggleFilter("speakers", speaker);
        updateArchiveDisplay(globalIndex);
        updateButtonStates(globalIndex);
      };
    }

    if (instru) {
      instruCell.style.cursor = "pointer";
      instruCell.onclick = () => {
        toggleFilter("instrumentals", instru);
        updateArchiveDisplay(globalIndex);
        updateButtonStates(globalIndex);
      };
    }

    if (archiveCell) {
      archiveCell.style.cursor = "pointer";
      archiveCell.onclick = () => {
        alert(`Naviguer vers ${archiveTitle}...`);
      };
    }
  });

  const resetBtn = document.getElementById("reset-filters-button");
  resetBtn.addEventListener("click", () => {
    activeFilters.speakers.clear();
    activeFilters.instrumentals.clear();
    updateArchiveDisplay(globalIndex);
    updateButtonStates(globalIndex);
  });

  updateButtonStates(globalIndex);
}

function updateArchiveDisplay(globalIndex) {
  const table = document.querySelector(".global-index-table");
  const states = getArchiveStates(globalIndex);

  table.querySelectorAll("tbody tr").forEach(row => {
    const archiveTitle = row.children[2]?.textContent.trim();
    const archive = globalIndex.archives.find(a => a.title === archiveTitle);
    if (!archive) return;

    const active = states[archive.id];
    row.style.opacity = active ? 1 : 0.3;
  });
}

function updateButtonStates(globalIndex) {
  const states = getArchiveStates(globalIndex);
  const activeArchives = Object.entries(states)
    .filter(([_, isActive]) => isActive)
    .map(([id, _]) => id);

  document.querySelectorAll(".global-index-table tbody tr").forEach(row => {
    const [speakerCell, instruCell, archiveCell] = row.children;
    const speaker = speakerCell.textContent.trim();
    const instru = instruCell.textContent.trim();
    const archiveTitle = archiveCell.textContent.trim();
    const archive = globalIndex.archives.find(a => a.title === archiveTitle);

    const isActive = archive && activeArchives.includes(archive.id);
    row.style.opacity = isActive ? 1 : 0.3;

    if (activeFilters.speakers.has(speaker)) {
      speakerCell.style.backgroundColor = "#FFD700";
    } else {
      const matches = (globalIndex.speakers[speaker] || []).some(seg => activeArchives.includes(seg.archive));
      speakerCell.style.backgroundColor = matches ? "" : "#444";
    }

    if (activeFilters.instrumentals.has(instru)) {
      instruCell.style.backgroundColor = "#FFD700";
    } else {
      const matches = (globalIndex.instrumentals[instru] || []).some(seg => activeArchives.includes(seg.archive));
      instruCell.style.backgroundColor = matches ? "" : "#444";
    }
  });
}
