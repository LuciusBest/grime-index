// JS à placer dans un fichier lié ou en bas du <body>
document.addEventListener("DOMContentLoaded", () => {
  const filtersContainer = document.getElementById("filters_container");
  let isOpen = false;

  filtersContainer.addEventListener("click", () => {
    isOpen = !isOpen;
    filtersContainer.style.left = isOpen ? "50%" : "98.5%";
  });
});
