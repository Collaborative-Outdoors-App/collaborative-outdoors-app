import { auth } from "../firebase/firebaseConfig";

const API_URL = process.env.EXPO_PUBLIC_HIKE_API_URL;

// Current time in the format the API expects: YYYY-MM-DDTHH:MM:SSZ (UTC, no milliseconds)
const nowUtc = () => new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

/** Save a finished hike for the signed-in user. */
export async function saveHike({ seconds, distanceKm }) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not signed in");

  const response = await fetch(`${API_URL}/hikes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": uid, // the Lambda reads the uid from this header
    },
    body: JSON.stringify({
      endTime: nowUtc(),
      // API requires a positive whole number of minutes
      durationMins: Math.max(1, Math.round(seconds / 60)),
      distanceKm: Math.round(distanceKm * 100) / 100,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Save failed (${response.status}): ${text}`);
  }
  return response.json();
}

/** Fetch the signed-in user's hikes and totals for the last `days` days. */
export async function getHikes(days = 30) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not signed in");

  const response = await fetch(`${API_URL}/hikes?days=${days}`, {
    headers: { "x-user-id": uid },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Fetch failed (${response.status}): ${text}`);
  }
  return response.json();
}