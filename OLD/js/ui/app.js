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
    file: 'videos/Archive_004_ThatsNotMe_All-StarRemix_LiveOnToddlaT.mp4',
    archive: 'ARCHIVE_004_data.json',
  },
  {
    file: 'videos/Archive_005_KeepinItGrimy_Sessions_feat_MerkyAce_MIK_Ego.mp4',
    archive: 'ARCHIVE_005_data.json',
  },
  {
    file: 'videos/Archive_006_LoganSama_MerkyACE_Footsie_TKO_ShifMan_on_Kiss_Sept_5th_2011.mp4',
    archive: 'ARCHIVE_006_data.json',
  },
  {
    file: 'videos/Archive_007_TempaT_Skepta_JME_LoganSama.mp4',
    archive: 'ARCHIVE_007_data.json',
  },
  {
    file: 'videos/Archive_008_Scrufizzer_2Face_Teeza_15th_November_2011.mp4',
    archive: 'ARCHIVE_008_data.json',
  },
  {
    file: 'videos/Archive_009_Trilla_crew_Crib_Session_Part_2TimWestwoodTV.mp4',
    archive: 'ARCHIVE_009_data.json',
  },
];

document.addEventListener('DOMContentLoaded', () => {
  initOverallGrid(archives);
});
