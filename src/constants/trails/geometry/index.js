import geometries from "./geometries.json";

export const TRAIL_GEOMETRIES = geometries;

export function getTrailGeometry(trailId) {
  if (!trailId) return null;
  return geometries[String(trailId)] || null;
}

export default geometries;
