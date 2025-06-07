
export const activeFilters = {
  speakers: new Set(),
  instrumentals: new Set()
};

export function toggleFilter(type, value) {
  const set = activeFilters[type];
  if (!set) return;

  if (set.has(value)) {
    set.delete(value);
  } else {
    set.add(value);
  }
}
