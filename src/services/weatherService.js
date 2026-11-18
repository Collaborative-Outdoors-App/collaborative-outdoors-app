// OpenWeather One Call API 4.0 configuration
export const OPENWEATHER_API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_KEY;

export const ONE_CALL_API_URL = "https://api.openweathermap.org/data/4.0/onecall/current";

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
 * If internet is not available or the API is not callable, returns { unavailable: true }.
 *
 * @param {number} lat - Trail start latitude
 * @param {number} lon - Trail start longitude
 * @returns {Promise<{ temp?: number, condition?: string, icon?: string, unavailable: boolean }>}
 */
export async function getTrailWeather(lat, lon) {
  if (lat == null || lon == null) {
    return { unavailable: true };
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
      return { unavailable: true };
    }

    const data = await res.json();
    // One Call API 4.0 returns { data: [ { temp, weather: [...] } ] }
    // Also supports legacy formats ({ current: { temp, ... } } or { main: { temp, ... } })
    const entry = Array.isArray(data?.data) ? data.data[0] : (data?.current || data);
    const tempRaw = entry?.temp ?? entry?.main?.temp;
    const weatherObj = entry?.weather?.[0] || data?.weather?.[0];
    const condition = weatherObj?.main || weatherObj?.description;

    if (tempRaw == null || !condition) {
      return { unavailable: true };
    }

    return {
      temp: Math.round(tempRaw),
      condition,
      icon: getWeatherEmoji(condition),
      unavailable: false,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    // Network error, offline, or request aborted
    return { unavailable: true };
  }
}
