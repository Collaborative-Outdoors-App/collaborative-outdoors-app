import { auth } from "../firebase/firebaseConfig";

const API_URL = process.env.EXPO_PUBLIC_HIKE_API_URL;

// Current time in the format the API expects: YYYY-MM-DDTHH:MM:SSZ
const nowUtc = () => new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

// Get Firebase JWT token for API Gateway authentication.
const getAuthHeaders = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");

  const token = await user.getIdToken();

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

/** Save a finished hike for the signed-in user. */
export async function saveHike({ seconds, distanceKm }) {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_URL}/hikes`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      endTime: nowUtc(),
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

/**
 * Fetch the signed-in user's hikes and daily totals.
 *
 * @param {number} days - Number of calendar days to retrieve.
 * @param {string} metric - "distance" or "hiking_time".
 * @param {string} tz - User's IANA timezone.
 */
export async function getHikes(
  days = 30,
  metric = "distance",
  tz = Intl.DateTimeFormat().resolvedOptions().timeZone
) {
  const headers = await getAuthHeaders();

  const params = new URLSearchParams({
    metric,
    days: String(days),
    tz,
  });

  const response = await fetch(`${API_URL}/hikes?${params.toString()}`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Fetch failed (${response.status}): ${text}`);
  }

  return response.json();
}
