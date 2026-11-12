import { auth } from "../firebase/firebaseConfig";

const API_URL = process.env.EXPO_PUBLIC_HIKE_API_URL;

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

export async function getAchievements() {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_URL}/achievements`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Fetch failed (${response.status}): ${text}`);
  }

  return response.json();
}