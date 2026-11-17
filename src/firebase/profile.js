import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuthToken } from './token';


const API_URL = process.env.EXPO_PUBLIC_HIKE_API_URL;
const cacheKey = (uid) => `profile:${uid}`;

async function readCache(uid) {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(uid));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function getProfile(uid) {
  if (!API_URL) return (await readCache(uid)) ?? {};
  try {
    const token = await getAuthToken();
    const res = await fetch(`${API_URL}/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    await AsyncStorage.setItem(cacheKey(uid), JSON.stringify(data));
    return data;
  } catch (e) {
    return readCache(uid);
  }
}

export async function saveProfile(uid, data) {
  if (API_URL) {
    const token = await getAuthToken();
    const res = await fetch(`${API_URL}/profile`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Save failed: HTTP ${res.status} ${text}`);
}
  } else {
    console.warn('EXPO_PUBLIC_API_URL is not set: saving on this phone only');
  }
  const merged = { ...((await readCache(uid)) ?? {}), ...data };
  await AsyncStorage.setItem(cacheKey(uid), JSON.stringify(merged));
  return merged;
}
export const getCachedProfile = readCache;


export async function clearProfileCache(uid) {
  try {
    await AsyncStorage.removeItem(cacheKey(uid));
  } catch {}
}