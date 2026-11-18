export const MIN_AGE = 16;
export const MAX_AGE = 120;
export const MIN_WEIGHT_LBS = 20;
export const MAX_WEIGHT_LBS = 700;

export const lbsToKg = (lbs) => Math.round(lbs * 0.45359237 * 10) / 10;
export const kgToLbs = (kg) => Math.round(kg / 0.45359237);

export function parseDob(text) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((text || '').trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const date = new Date(y, mo - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null;
  return date;
}

export function ageFromDob(date, today = new Date()) {
  const age = today.getFullYear() - date.getFullYear();
  const hadBirthday =
    today.getMonth() > date.getMonth() ||
    (today.getMonth() === date.getMonth() && today.getDate() >= date.getDate());
  return hadBirthday ? age : age - 1;
}