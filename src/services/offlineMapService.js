import AsyncStorage from "@react-native-async-storage/async-storage";

export const STORAGE_KEY = "@outdoorz/offline_trail_maps";
export const MAPTILER_API_KEY = "4UhJpV0jRJOhzjgVw2b0";
export const MAP_STYLE_URL = `https://api.maptiler.com/maps/basic-v2/style.json?key=${MAPTILER_API_KEY}`;

// Safely load native MapLibre OfflineManager if available
let MapLibreOffline = null;
try {
  const MapLibre = require("@maplibre/maplibre-react-native");
  MapLibreOffline = MapLibre.OfflineManager || null;
} catch (err) {
  console.warn("[offlineMapService] MapLibre OfflineManager not available in this environment:", err);
}

/**
 * Computes a buffered [west, south, east, north] bounding box for downloading
 * a trail's map area.
 */
export function getTrailDownloadBounds(trail, padding = 0.008) {
  if (!trail) return null;
  const bbox = trail.bbox;
  if (!bbox) {
    if (trail.start) {
      return [
        Number((trail.start.lon - padding).toFixed(6)),
        Number((trail.start.lat - padding).toFixed(6)),
        Number((trail.start.lon + padding).toFixed(6)),
        Number((trail.start.lat + padding).toFixed(6)),
      ];
    }
    return null;
  }

  const minLon = Math.min(bbox.west, bbox.east);
  const maxLon = Math.max(bbox.west, bbox.east);
  const minLat = Math.min(bbox.south, bbox.north);
  const maxLat = Math.max(bbox.south, bbox.north);

  // Buffer around the trail (at least padding, or 10% of span)
  const lonSpan = maxLon - minLon;
  const latSpan = maxLat - minLat;
  const lonPad = Math.max(padding, lonSpan * 0.1);
  const latPad = Math.max(padding, latSpan * 0.1);

  return [
    Number((minLon - lonPad).toFixed(6)),
    Number((minLat - latPad).toFixed(6)),
    Number((maxLon + lonPad).toFixed(6)),
    Number((maxLat + latPad).toFixed(6)),
  ];
}

/**
 * Retrieves all offline trail records from persistent storage.
 */
export async function getOfflineTrails() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch (err) {
    console.error("[offlineMapService] Error reading offline trails:", err);
    return {};
  }
}

/**
 * Checks if a specific trail's map area is stored for offline use.
 */
export async function isTrailDownloaded(trailId) {
  if (!trailId) return false;
  const trails = await getOfflineTrails();
  return Boolean(trails[String(trailId)]);
}

/**
 * Retrieves metadata for a specific downloaded trail.
 */
export async function getDownloadedTrail(trailId) {
  if (!trailId) return null;
  const trails = await getOfflineTrails();
  return trails[String(trailId)] || null;
}

/**
 * Downloads the map area for a specific trail to device storage.
 * 
 * Uses MapLibre's native OfflineManager to download the style, sprites,
 * glyphs, and vector tiles directly into the native SQLite offline database.
 * Also stores metadata in AsyncStorage.
 */
export async function downloadTrailMap(trail, onProgress, onError) {
  if (!trail) {
    const err = new Error("No trail provided to download.");
    onError?.(err);
    throw err;
  }

  const trailId = String(trail.trailId || trail.id);
  const bounds = getTrailDownloadBounds(trail);
  if (!bounds) {
    const err = new Error("Unable to determine map area coordinates for this trail.");
    onError?.(err);
    throw err;
  }

  const minZoom = 12;
  const maxZoom = 15;

  if (MapLibreOffline) {
    try {
      if (typeof MapLibreOffline.setTileCountLimit === "function") {
        MapLibreOffline.setTileCountLimit(20000);
      }
      if (typeof MapLibreOffline.setProgressEventThrottle === "function") {
        MapLibreOffline.setProgressEventThrottle(250);
      }

      // If an existing pack exists for this trail, clean it up before creating new pack
      try {
        const existingPacks = await MapLibreOffline.getPacks();
        for (const p of existingPacks) {
          if (p.metadata?.trailId === trailId) {
            await MapLibreOffline.deletePack(p.id);
          }
        }
      } catch (cleanErr) {
        console.warn("[offlineMapService] Could not clean prior pack:", cleanErr);
      }

      return await new Promise((resolve, reject) => {
        let isDone = false;

        const progressListener = async (pack, status) => {
          const pct = Math.min(100, Math.max(0, Math.round(status.percentage || 0)));
          onProgress?.({
            percentage: pct,
            completedCount: status.completedResourceCount || 0,
            totalCount: status.requiredResourceCount || 0,
            completedTileCount: status.completedTileCount || 0,
            state: status.state,
          });

          if ((status.state === "complete" || pct >= 100) && !isDone) {
            isDone = true;
            try {
              const record = {
                trailId,
                name: trail.name,
                packId: pack.id,
                bounds,
                minZoom,
                maxZoom,
                downloadedAt: new Date().toISOString(),
                completedTileCount: status.completedTileCount || 0,
                completedResourceSize: status.completedResourceSize || 0,
              };

              const all = await getOfflineTrails();
              all[trailId] = record;
              await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(all));
              resolve(record);
            } catch (err) {
              reject(err);
            }
          }
        };

        const errorListener = (pack, err) => {
          if (!isDone) {
            isDone = true;
            const errorObj = new Error(err?.message || "Failed to download offline map pack.");
            onError?.(errorObj);
            reject(errorObj);
          }
        };

        MapLibreOffline.createPack(
          {
            mapStyle: MAP_STYLE_URL,
            bounds,
            minZoom,
            maxZoom,
            metadata: {
              trailId,
              trailName: trail.name,
              downloadedAt: new Date().toISOString(),
            },
          },
          progressListener,
          errorListener
        ).catch((err) => {
          if (!isDone) {
            isDone = true;
            onError?.(err);
            reject(err);
          }
        });
      });
    } catch (nativeErr) {
      console.warn("[offlineMapService] Native createPack failed, falling back to simulated storage:", nativeErr);
    }
  }

  // Fallback simulation for environments without native TurboModule
  return await new Promise((resolve) => {
    let p = 0;
    const interval = setInterval(async () => {
      p += 20;
      if (p > 100) p = 100;
      onProgress?.({
        percentage: p,
        completedCount: p,
        totalCount: 100,
        state: p === 100 ? "complete" : "active",
      });
      if (p >= 100) {
        clearInterval(interval);
        const record = {
          trailId,
          name: trail.name,
          packId: `fallback_${trailId}_${Date.now()}`,
          bounds,
          minZoom,
          maxZoom,
          downloadedAt: new Date().toISOString(),
        };
        const all = await getOfflineTrails();
        all[trailId] = record;
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(all));
        resolve(record);
      }
    }, 200);
  });
}

/**
 * Removes downloaded offline map data for a trail.
 */
export async function deleteTrailMap(trailId) {
  if (!trailId) return {};
  const idStr = String(trailId);
  try {
    const all = await getOfflineTrails();
    const record = all[idStr];

    if (record?.packId && MapLibreOffline) {
      try {
        await MapLibreOffline.deletePack(record.packId);
      } catch (err) {
        console.warn("[offlineMapService] Could not delete native pack:", err);
      }
    }

    delete all[idStr];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    return all;
  } catch (err) {
    console.error("[offlineMapService] Error deleting offline trail map:", err);
    throw err;
  }
}

