import { initOverallGrid } from './overallGrid.js';

const archives = [
  {
    file: 'videos/Archive_001_LoganSama_JME_NewhamGenerals.mp4',
    archive: 'ARCHIVE_001_data.json',
  },
  {
    file: 'videos/Archive_002_DDoubleE_Footsie_LoganSama.mp4',
    archive: 'ARCHIVE_002_data.json',
  },
  {
    file: 'videos/Archive_003_LoganSama_Skepta_JME_Jammer_Frisco_Shorty.mp4',
    archive: 'ARCHIVE_003_data.json',
  },
  {
    file: 'videos/Archive_007_TempaT_Skepta_JME_LoganSama.mp4',
    archive: 'ARCHIVE_007_data.json',
  },
];

document.addEventListener('DOMContentLoaded', () => {
  initOverallGrid(archives);
});
