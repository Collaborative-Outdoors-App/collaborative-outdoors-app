export const STORAGE_KEY = "@outdoorz/offline_trail_maps";
export const MAPTILER_API_KEY = "4UhJpV0jRJOhzjgVw2b0";
export const MAP_STYLE_URL = `https://api.maptiler.com/maps/basic-v2/style.json?key=${MAPTILER_API_KEY}`;

export function getTrailDownloadBounds(trail, padding = 0.008) {
  if (!trail) return null;
  const bbox = trail.bbox;
  if (!bbox) {
    if (!trail.start) return null;
    return [
      Number((trail.start.lon - padding).toFixed(6)),
      Number((trail.start.lat - padding).toFixed(6)),
      Number((trail.start.lon + padding).toFixed(6)),
      Number((trail.start.lat + padding).toFixed(6)),
    ];
  }

  const minLon = Math.min(bbox.west, bbox.east);
  const maxLon = Math.max(bbox.west, bbox.east);
  const minLat = Math.min(bbox.south, bbox.north);
  const maxLat = Math.max(bbox.south, bbox.north);
  const lonPad = Math.max(padding, (maxLon - minLon) * 0.1);
  const latPad = Math.max(padding, (maxLat - minLat) * 0.1);

  return [
    Number((minLon - lonPad).toFixed(6)),
    Number((minLat - latPad).toFixed(6)),
    Number((maxLon + lonPad).toFixed(6)),
    Number((maxLat + latPad).toFixed(6)),
  ];
}

export async function getOfflineTrails() {
  return {};
}

export async function isTrailDownloaded() {
  return false;
}

export async function getDownloadedTrail() {
  return null;
}

export async function downloadTrailMap() {
  throw new Error("Offline map downloads are only supported in the iOS and Android apps.");
}

export async function deleteTrailMap() {
  return {};
}

export async function clearMapCache() {
  throw new Error("Offline map cache management is only supported in the iOS and Android apps.");
}
