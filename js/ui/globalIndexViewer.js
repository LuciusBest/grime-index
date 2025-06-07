// js/globalIndexViewer.js

export function displayGlobalIndex(globalIndex) {
  const indexContent = document.querySelector(".index-content");

  // Créer un tableau
  const table = document.createElement("table");
  table.classList.add("global-index-table");

  // En-tête
  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th>Speakers</th>
      <th>Instrumentals</th>
      <th>Archives</th>
    </tr>
  `;
  table.appendChild(thead);

  // Corps
  const tbody = document.createElement("tbody");

  const speakerKeys = Object.keys(globalIndex.speakers);
  const instruKeys = Object.keys(globalIndex.instrumentals);
  const archiveTitles = globalIndex.archives.map(a => a.title);

  const maxLength = Math.max(speakerKeys.length, instruKeys.length, archiveTitles.length);

  for (let i = 0; i < maxLength; i++) {
    const row = document.createElement("tr");
    const speaker = speakerKeys[i] || "";
    const instru = instruKeys[i] || "";
    const archive = archiveTitles[i] || "";

    row.innerHTML = `
      <td>${speaker}</td>
      <td>${instru}</td>
      <td>${archive}</td>
    `;
    tbody.appendChild(row);
  }

  table.appendChild(tbody);
  indexContent.innerHTML = "";
  indexContent.appendChild(table);
}
