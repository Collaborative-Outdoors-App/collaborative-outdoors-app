export const THRESHOLD_PCT = 0.85;
export const SUSTAIN_SEC = 10;
export const COOLDOWN_SEC = 60;

export const maxHeartRate = (age) => Math.round(208 - 0.7 * age);

export function createMonitor({ maxHr, onAlert }) {
  let aboveSince = null;
  let lastAlertAt = 0;

  return {
    push(bpm, ts) {
      if (bpm / maxHr >= THRESHOLD_PCT) {
        if (aboveSince === null) aboveSince = ts;
        const sustained = ts - aboveSince >= SUSTAIN_SEC * 1000;
        const cooledDown = ts - lastAlertAt >= COOLDOWN_SEC * 1000;
        if (sustained && cooledDown) {
          lastAlertAt = ts;
          onAlert({
            bpm,
            maxHr,
            pctOfMax: Math.round((bpm / maxHr) * 100),
            at: new Date(ts).toISOString(),
          });
        }
      } else {
        aboveSince = null;
      }
    },
  };
}