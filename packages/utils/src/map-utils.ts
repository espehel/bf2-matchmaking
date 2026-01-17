export function formatServerMapName(mapName: string) {
  return mapName
    .split('_')
    .map((w) => w[0].toUpperCase().concat(w.slice(1)))
    .join(' ');
}
