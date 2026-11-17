const MODE_TARGET = { rest: 0.35, hiking: 0.6, climb: 0.75, danger: 0.92 };
const TICK_MS = 1000;

export function createSimulator({ maxHr, onSample }) {
  let mode = 'rest';
  let bpm = 70;
  let timer = null;

  const tick = () => {
    const target = maxHr * MODE_TARGET[mode];
    bpm += (target - bpm) * 0.25 + (Math.random() * 4 - 2);
    onSample(Math.round(bpm), Date.now());
  };

  return {
    start() {
      if (timer) return;
      tick();
      timer = setInterval(tick, TICK_MS);
    },
    stop() {
      clearInterval(timer);
      timer = null;
    },
    setMode(next) {
      if (MODE_TARGET[next]) mode = next;
    },
  };
}