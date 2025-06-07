
import { activeFilters } from "./activeFilters.js";

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

export function getArchiveStates(globalIndex) {
  const archiveStates = {};

  for (const archive of globalIndex.archives) {
    const archiveId = archive.id;
    let speakerMatches = true;

    for (const speaker of activeFilters.speakers) {
      const segments = globalIndex.speakers[speaker] || [];
      if (!segments.some(s => s.archive === archiveId)) {
        speakerMatches = false;
        break;
      }
    }

    let instruMatch = true;
    if (activeFilters.instrumentals.size > 0) {
      instruMatch = false;

      for (const instru of activeFilters.instrumentals) {
        const instruSegments = globalIndex.instrumentals[instru] || [];
        for (const instruSeg of instruSegments) {
          if (instruSeg.archive !== archiveId) continue;

          for (const speaker of activeFilters.speakers) {
            const speakerSegments = globalIndex.speakers[speaker] || [];
            const match = speakerSegments.some(s =>
              s.archive === archiveId &&
              overlaps(instruSeg.start, instruSeg.end, s.start, s.end)
            );

            if (match) {
              instruMatch = true;
              break;
            }
          }

          if (instruMatch) break;
        }

        if (!instruMatch) break;
      }
    }

    archiveStates[archiveId] = speakerMatches && instruMatch;
  }

  return archiveStates;
}
