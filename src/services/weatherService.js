// OpenWeather One Call API 4.0 configuration
export const OPENWEATHER_API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_KEY;

export const ONE_CALL_API_URL = "https://api.openweathermap.org/data/4.0/onecall/current";

// In-memory weather cache: key -> { timestamp, data }
const weatherCache = new Map();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const ERROR_CACHE_TTL_MS = 60 * 1000; // 1 minute backoff for rate limits

/**
 * Maps a weather condition string to an appropriate emoji icon.
 */
export function getWeatherEmoji(condition = "") {
  const c = condition.toLowerCase();
  if (c.includes("clear") || c.includes("sun")) return "☀️";
  if (c.includes("cloud") || c.includes("overcast")) return "⛅";
  if (c.includes("rain") || c.includes("drizzle") || c.includes("shower")) return "🌧️";
  if (c.includes("thunder") || c.includes("storm")) return "⛈️";
  if (c.includes("snow") || c.includes("flurr") || c.includes("ice")) return "❄️";
  if (c.includes("mist") || c.includes("fog") || c.includes("haze")) return "🌫️";
  if (c.includes("wind")) return "💨";
  return "🌤️";
}

/**
 * Fetches current weather conditions (temperature, weather condition) for a trail's
 * start coordinates using OpenWeather One Call API 4.0.
 *
 * Results are cached for 15 minutes to avoid redundant API requests.
 *
 * @param {number} lat - Trail start latitude
 * @param {number} lon - Trail start longitude
 * @param {boolean} [forceRefresh=false] - If true, bypasses the cache
 * @returns {Promise<{ temp?: number, condition?: string, icon?: string, unavailable: boolean }>}
 */
export async function getTrailWeather(lat, lon, forceRefresh = false) {
  if (lat == null || lon == null) {
    return { unavailable: true };
  }

  const cacheKey = `${Number(lat).toFixed(3)},${Number(lon).toFixed(3)}`;
  const now = Date.now();
  const cached = weatherCache.get(cacheKey);

  if (!forceRefresh && cached) {
    const ttl = cached.data?.unavailable ? ERROR_CACHE_TTL_MS : CACHE_TTL_MS;
    if (now - cached.timestamp < ttl) {
      return cached.data;
    }
  }

  const url = `${ONE_CALL_API_URL}?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_API_KEY}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(
        `[weatherService] One Call API 4.0 returned status ${res.status} (${res.statusText}).`
      );
      const unavailableResult = { unavailable: true };
      // Back off to prevent hammering rate limits
      weatherCache.set(cacheKey, { timestamp: now, data: unavailableResult });
      return unavailableResult;
    }

    const data = await res.json();
    // One Call API 4.0 returns { data: [ { temp, weather: [...] } ] }
    // Also supports legacy formats ({ current: { temp, ... } } or { main: { temp, ... } })
    const entry = Array.isArray(data?.data) ? data.data[0] : (data?.current || data);
    const tempRaw = entry?.temp ?? entry?.main?.temp;
    const weatherObj = entry?.weather?.[0] || data?.weather?.[0];
    const condition = weatherObj?.main || weatherObj?.description;

    if (tempRaw == null || !condition) {
      const unavailableResult = { unavailable: true };
      weatherCache.set(cacheKey, { timestamp: now, data: unavailableResult });
      return unavailableResult;
    }

    const result = {
      temp: Math.round(tempRaw),
      condition,
      icon: getWeatherEmoji(condition),
      unavailable: false,
    };

    weatherCache.set(cacheKey, { timestamp: now, data: result });
    return result;
  } catch (err) {
    clearTimeout(timeoutId);
    // Network error, offline, or request aborted
    const unavailableResult = { unavailable: true };
    weatherCache.set(cacheKey, { timestamp: now, data: unavailableResult });
    return unavailableResult;
  }
}
