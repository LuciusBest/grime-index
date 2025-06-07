// Sélection aléatoire + synchronisation vidéo + data archive
const videoElement = document.getElementById("background-video");
const sourceElement = videoElement.querySelector("source");

const videoList = [
  {
    file: "videos/Archive_001_LoganSama_JME_NewhamGenerals.mp4",
    archive: "ARCHIVE_001_data.json"
  },
  {
    file: "videos/Archive_003_LoganSama_Skepta_JME_Jammer_Frisco_Shorty.mp4",
    archive: "ARCHIVE_003_data.json"
  },
  {
    file: "videos/Archive_007_TempaT_Skepta_JME_LoganSama.mp4",
    archive: "ARCHIVE_007_data.json"
  }
];

const randomIndex = Math.floor(Math.random() * videoList.length);
const selected = videoList[randomIndex];

// Mettre à jour la source vidéo
sourceElement.src = selected.file;
videoElement.load();
console.log("🔗 Chargement vidéo depuis :", sourceElement.src);

// Créer ou mettre à jour la balise #active-archive
let archiveScript = document.getElementById("active-archive");
if (!archiveScript) {
  archiveScript = document.createElement("script");
  archiveScript.id = "active-archive";
  document.body.appendChild(archiveScript);
}
archiveScript.setAttribute("data-archive", selected.archive);

// Log pour debug
console.log(`🎬 Vidéo : ${selected.file}`);
console.log(`📁 Data : data/${selected.archive}`);

// Export : fonction pour charger les données JSON associées
export function loadActiveArchiveData() {
  const archivePath = selected.archive;
  return fetch(`data/${archivePath}`).then((res) => {
    if (!res.ok) throw new Error(`❌ Erreur de chargement : ${archivePath}`);
    return res.json();
  });
}
