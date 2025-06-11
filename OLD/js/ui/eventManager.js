import { loadActiveArchiveData } from "../data/dataLinker.js";

const video = document.getElementById("background-video");
let archiveData = {};
let previousInstrumental = null;
let hasActivatedOnce = false;
let colorIndex = 0;

// Liste des couleurs finales à alterner
const baseColors = ["#39FF14", "#00FFFF"]; // Vert néon, Bleu électrique

loadActiveArchiveData()
  .then((data) => {
    archiveData = data;

    video.addEventListener("timeupdate", () => {
      const currentTime = video.currentTime;

      const currentInstrumental = (archiveData.instrumentals || []).find(
        (inst) => currentTime >= inst.start && currentTime <= inst.end
      );

      if (
        currentInstrumental &&
        currentInstrumental.start !== previousInstrumental
      ) {
        if (hasActivatedOnce) {
          runFullFlashSequence();
        } else {
          hasActivatedOnce = true;
        }

        previousInstrumental = currentInstrumental.start;
      }
    });
  })
  .catch((err) => {
    console.error("Erreur lors du chargement de l'archive :", err);
  });

function runFullFlashSequence() {
  const vert = "#39f664";
  const rouge = "#FF073A";
  const blanc = "#FFFFFF";
  const bleu = "#00FFFF";

  const sequence = [
    vert,
    blanc,
    rouge,
    blanc,
    vert,
    blanc,
    baseColors[colorIndex]
  ];

  let i = 0;

  const step = () => {
    document.body.style.transition = "background-color 0.05s ease";
    document.body.style.backgroundColor = sequence[i];
    i++;
    if (i < sequence.length) {
      setTimeout(step, 50);
    }
  };

  step();

  colorIndex = (colorIndex + 1) % baseColors.length; // alterner entre vert/bleu pour la prochaine fois
}
