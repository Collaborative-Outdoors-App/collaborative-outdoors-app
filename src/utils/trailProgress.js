import { getTrailGeometry } from "../constants/trails/geometry";
import { calculateDistanceKm } from "./geo";

/**
 * Stitches an array of segments (from MultiLineString) into a single continuous polyline
 * oriented from targetStart to the end of the trail.
 *
 * OpenStreetMap MultiLineString ways are unordered and may run in either direction.
 * This connects each segment end-to-end starting at targetStart, reversing backward segments
 * so that index 0 is at trail start and the last index is at trail end.
 *
 * @param {Array<Array<[number, number]>>} segments Array of [lon, lat] coordinates per segment
 * @param {[number, number]|null} targetStart [lon, lat] of the trail's starting location
 * @returns {Array<[number, number]>} Continuous array of [lon, lat] coordinates
 */
export function stitchMultiLineString(segments, targetStart) {
  if (!segments || segments.length === 0) return [];
  const remaining = segments.map((s) => [...s]);

  // Find the segment whose start or end is closest to targetStart
  let bestIdx = 0;
  let bestD = Infinity;
  let shouldReverse = false;

  const startPt = targetStart || remaining[0][0];

  for (let i = 0; i < remaining.length; i++) {
    const s = remaining[i];
    const d0 = calculateDistanceKm(s[0][1], s[0][0], startPt[1], startPt[0]);
    const d1 = calculateDistanceKm(
      s[s.length - 1][1],
      s[s.length - 1][0],
      startPt[1],
      startPt[0]
    );
    if (d0 < bestD) {
      bestD = d0;
      bestIdx = i;
      shouldReverse = false;
    }
    if (d1 < bestD) {
      bestD = d1;
      bestIdx = i;
      shouldReverse = true;
    }
  }

  let result = shouldReverse ? remaining[bestIdx].reverse() : remaining[bestIdx];
  remaining.splice(bestIdx, 1);

  // Greedily attach the nearest remaining segment to the growing polyline's tail
  while (remaining.length > 0) {
    const tail = result[result.length - 1];
    let nextIdx = -1;
    let nextRev = false;
    let minD = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const s = remaining[i];
      const d0 = calculateDistanceKm(tail[1], tail[0], s[0][1], s[0][0]);
      const d1 = calculateDistanceKm(
        tail[1],
        tail[0],
        s[s.length - 1][1],
        s[s.length - 1][0]
      );
      if (d0 < minD) {
        minD = d0;
        nextIdx = i;
        nextRev = false;
      }
      if (d1 < minD) {
        minD = d1;
        nextIdx = i;
        nextRev = true;
      }
    }

    if (nextIdx === -1) break;
    const nextSeg = nextRev ? remaining[nextIdx].reverse() : remaining[nextIdx];
    // If the connection gap is practically zero (< 5 meters), skip duplicate seam point
    if (minD < 0.005) {
      result.push(...nextSeg.slice(1));
    } else {
      result.push(...nextSeg);
    }
    remaining.splice(nextIdx, 1);
  }

  return result;
}

/**
 * Extracts a flattened, continuous array of [longitude, latitude] coordinates from trail geometry.
 * Supports both LineString and MultiLineString geometries.
 *
 * @param {Object} geometry GeoJSON Feature or Geometry object
 * @param {[number, number]|null} targetStart Optional [lon, lat] of trail start
 * @returns {Array<[number, number]>} Array of [lon, lat] coordinates
 */
export function getTrailCoordinates(geometry, targetStart) {
  if (!geometry) return [];
  const geom = geometry.geometry || geometry;
  if (!geom || !geom.coordinates) return [];

  if (geom.type === "LineString") {
    return geom.coordinates;
  }
  if (geom.type === "MultiLineString") {
    return stitchMultiLineString(geom.coordinates, targetStart);
  }
  return [];
}

// In-memory cache for preprocessed linear trail polyline and segment lengths
const trailPolylineCache = new Map();

/**
 * Retrieves or builds the oriented polyline for a linear trail, ensuring
 * index 0 is at trail.start and the last index is at the trail's end.
 */
export function getOrientedPolyline(trail) {
  const trailId = String(trail.trailId || trail.id || "");
  if (!trailId) return null;

  if (trailPolylineCache.has(trailId)) {
    return trailPolylineCache.get(trailId);
  }

  const geometry = getTrailGeometry(trailId);
  const targetStart = trail.start ? [trail.start.lon, trail.start.lat] : null;
  let coords = getTrailCoordinates(geometry, targetStart);

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
 * Uses closest-point perpendicular projection along the stitched trail polyline.
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

  const userLat =
    userCoords?.latitude ?? userCoords?.lat ?? userCoords?.coords?.latitude;
  const userLon =
    userCoords?.longitude ?? userCoords?.lon ?? userCoords?.coords?.longitude;

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

  // Find the closest point along the continuous polyline to the user
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
  const progressPercent = Math.min(100, Math.max(0, Math.round(progressFraction * 100)));
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
