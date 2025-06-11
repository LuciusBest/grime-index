export function configureGrid(container, type = 'landing') {
  if (!container) return;
  let columns = 2;
  switch (type) {
    case 'landing':
      columns = 2;
      break;
    case 'selector':
      columns = 3;
      break;
    // other types can override columns here
    default:
      columns = 2;
  }
  container.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
  container.style.gridAutoRows = '1fr';
}
