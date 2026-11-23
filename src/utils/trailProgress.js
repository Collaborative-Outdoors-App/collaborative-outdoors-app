import { getTrailGeometry } from "../constants/trails/geometry";
import { calculateDistanceKm } from "./geo";

/**
 * Extracts a flattened array of [longitude, latitude] coordinates from trail geometry.
 * Supports both LineString and MultiLineString geometries.
 *
 * @param {Object} geometry GeoJSON Feature or Geometry object
 * @returns {Array<[number, number]>} Array of [lon, lat] coordinates
 */
export function getTrailCoordinates(geometry) {
  if (!geometry) return [];
  const geom = geometry.geometry || geometry;
  if (!geom || !geom.coordinates) return [];

  if (geom.type === "LineString") {
    return geom.coordinates;
  }
  if (geom.type === "MultiLineString") {
    // Flatten array of line segments
    const flat = [];
    for (const segment of geom.coordinates) {
      if (Array.isArray(segment)) {
        flat.push(...segment);
      }
    }
    return flat;
  }
  return [];
}

// In-memory cache for preprocessed linear trail polyline and segment lengths
const trailPolylineCache = new Map();

/**
 * Retrieves or builds the oriented polyline for a linear trail, ensuring
 * index 0 is at trail.start and the last index is at the trail's end.
 */
function getOrientedPolyline(trail) {
  const trailId = String(trail.trailId || trail.id || "");
  if (!trailId) return null;

  if (trailPolylineCache.has(trailId)) {
    return trailPolylineCache.get(trailId);
  }

  const geometry = getTrailGeometry(trailId);
  let coords = getTrailCoordinates(geometry);

  if (!coords || coords.length < 2) {
    return null;
  }

  // Ensure polyline starts at trail.start
  const startLat = trail.start?.lat;
  const startLon = trail.start?.lon;

  if (startLat != null && startLon != null) {
    const distToFirst = calculateDistanceKm(startLat, startLon, coords[0][1], coords[0][0]);
    const distToLast = calculateDistanceKm(
      startLat,
      startLon,
      coords[coords.length - 1][1],
      coords[coords.length - 1][0]
    );

    if (distToLast < distToFirst) {
      coords = [...coords].reverse();
    }
  }

  // Precompute segment lengths and cumulative distances
  const segmentLengths = [];
  const cumulativeDistances = [0];
  let totalLengthKm = 0;

  for (let i = 0; i < coords.length - 1; i++) {
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const d = calculateDistanceKm(p1[1], p1[0], p2[1], p2[0]);
    segmentLengths.push(d);
    totalLengthKm += d;
    cumulativeDistances.push(totalLengthKm);
  }

  const polylineData = {
    coords,
    segmentLengths,
    cumulativeDistances,
    totalLengthKm: totalLengthKm > 0 ? totalLengthKm : (trail.lengthKm || 1),
    startPoint: { latitude: coords[0][1], longitude: coords[0][0] },
    endPoint: {
      latitude: coords[coords.length - 1][1],
      longitude: coords[coords.length - 1][0],
    },
  };

  trailPolylineCache.set(trailId, polylineData);
  return polylineData;
}

/**
 * Calculates how close the user is to the end of a linear trail.
 *
 * 0% progress means user is at the start.
 * 100% progress means user is at the end.
 *
 * Uses closest-point perpendicular projection along the trail polyline.
 *
 * @param {Object} trail Trail metadata object (must have linear === true)
 * @param {Object|null} userCoords User coordinates { latitude, longitude } or null
 * @returns {Object|null} Progress object or null if trail is not linear
 */
export function calculateTrailProgress(trail, userCoords) {
  if (!trail || !trail.linear) {
    return null;
  }

  const polyline = getOrientedPolyline(trail);

  // If no polyline geometry found, fallback to trail.lengthKm
  if (!polyline) {
    return {
      isLinear: true,
      progressPercent: 0,
      progressFraction: 0,
      distanceFromStartKm: 0,
      distanceToEndKm: trail.lengthKm || 0,
      totalLengthKm: trail.lengthKm || 0,
      startPoint: trail.start
        ? { latitude: trail.start.lat, longitude: trail.start.lon }
        : null,
      endPoint: null,
    };
  }

  const { coords, segmentLengths, cumulativeDistances, totalLengthKm, startPoint, endPoint } =
    polyline;

  const userLat = userCoords?.latitude ?? userCoords?.lat;
  const userLon = userCoords?.longitude ?? userCoords?.lon;

  // If user location is not yet available, default to start (0%)
  if (userLat == null || userLon == null) {
    return {
      isLinear: true,
      progressPercent: 0,
      progressFraction: 0,
      distanceFromStartKm: 0,
      distanceToEndKm: Number(totalLengthKm.toFixed(2)),
      totalLengthKm: Number(totalLengthKm.toFixed(2)),
      startPoint,
      endPoint,
    };
  }

  // Find the closest point along the polyline to the user
  let minDistanceSq = Infinity;
  let bestDistAlongKm = 0;

  for (let i = 0; i < coords.length - 1; i++) {
    const lon1 = coords[i][0];
    const lat1 = coords[i][1];
    const lon2 = coords[i + 1][0];
    const lat2 = coords[i + 1][1];

    const midLat = (lat1 + lat2) / 2;
    const rad = (midLat * Math.PI) / 180;
    const latScale = 110.57; // km per degree lat
    const lonScale = 111.32 * Math.cos(rad); // km per degree lon

    const dx = (lon2 - lon1) * lonScale;
    const dy = (lat2 - lat1) * latScale;
    const segLenSq = dx * dx + dy * dy;

    const ux = (userLon - lon1) * lonScale;
    const uy = (userLat - lat1) * latScale;

    let t = 0;
    if (segLenSq > 1e-12) {
      t = (ux * dx + uy * dy) / segLenSq;
      t = Math.max(0, Math.min(1, t));
    }

    const projX = t * dx;
    const projY = t * dy;
    const distSq = (ux - projX) * (ux - projX) + (uy - projY) * (uy - projY);

    if (distSq < minDistanceSq) {
      minDistanceSq = distSq;
      const segKm = segmentLengths[i];
      bestDistAlongKm = cumulativeDistances[i] + t * segKm;
    }
  }

  const progressFraction = Math.max(0, Math.min(1, bestDistAlongKm / totalLengthKm));
  const progressPercent = Math.round(progressFraction * 100);
  const distanceToEndKm = Math.max(0, totalLengthKm - bestDistAlongKm);

  return {
    isLinear: true,
    progressPercent,
    progressFraction,
    distanceFromStartKm: Number(bestDistAlongKm.toFixed(2)),
    distanceToEndKm: Number(distanceToEndKm.toFixed(2)),
    totalLengthKm: Number(totalLengthKm.toFixed(2)),
    startPoint,
    endPoint,
  };
}
