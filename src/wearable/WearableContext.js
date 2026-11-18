import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useCurrentUser } from '../auth/useCurrentUser';
import { parseDob, ageFromDob } from '../utils/age';
import { navigationRef } from '../utils/navigationRef';
import { createSimulator } from '../wearable/HeartRateSource';
import { createMonitor, maxHeartRate } from '../wearable/Overexertion';

const DEVICE_NAME = 'Simulated Fitbit Charge 6';
const MAX_ATTEMPTS = 3;
const RETRY_MS = 2500;

const WearableContext = createContext(null);

export function WearableProvider({ children }) {
  const me = useCurrentUser();
  const dob = me.dateOfBirth ? parseDob(me.dateOfBirth) : null;
  const age = dob ? ageFromDob(dob) : 30;
  const maxHr = maxHeartRate(age);

  const [status, setStatus] = useState('disconnected');
  const [device, setDevice] = useState(null);
  const [bpm, setBpm] = useState(null);
  const [shareWithGroup, setShareWithGroup] = useState(true);
  const [heartRateAccess, setHeartRateAccessState] = useState(true);
  const [attempt, setAttempt] = useState(0);

  const sourceRef = useRef(null);
  const monitorRef = useRef(null);
  const samplesRef = useRef([]);
  const timersRef = useRef([]);
  const linkUpRef = useRef(true);
  const viaRef = useRef('Simulator');

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  const stopSource = () => {
    sourceRef.current?.stop();
    sourceRef.current = null;
  };

  const startSource = useCallback(() => {
    stopSource();
    monitorRef.current = createMonitor({
      maxHr,
      onAlert: (info) => {
        if (navigationRef.isReady()) {
          navigationRef.navigate('OverexertionAlert', {
            self: true,
            bpm: info.bpm,
            pctOfMax: info.pctOfMax,
          });
        }
      },
    });
    sourceRef.current = createSimulator({
      maxHr,
      onSample: (value, ts) => {
        samplesRef.current.push({ bpm: value, ts });
        setBpm(value);
        monitorRef.current?.push(value, ts);
      },
    });
    sourceRef.current.start();
    setStatus('connected');
    setAttempt(0);
  }, [maxHr]);

  const connect = useCallback(
    (via = 'Simulator') => {
      if (!heartRateAccess) return;
      clearTimers();
      viaRef.current = via;
      linkUpRef.current = true;
      samplesRef.current = [];
      setStatus('connecting');
      timersRef.current.push(
        setTimeout(() => {
          setDevice({ name: DEVICE_NAME, via });
          startSource();
        }, 3000)
      );
    },
    [startSource, heartRateAccess]
  );

  const disconnect = useCallback(() => {
    clearTimers();
    stopSource();
    setStatus('disconnected');
    setDevice(null);
    setBpm(null);
    setAttempt(0);
  }, []);

  const setHeartRateAccess = useCallback(
    (allowed) => {
      setHeartRateAccessState(allowed);
      if (!allowed) disconnect();
    },
    [disconnect]
  );

  const runReconnect = useCallback(() => {
    clearTimers();
    setStatus('lost');
    let n = 0;
    const step = () => {
      n += 1;
      setAttempt(n);
      timersRef.current.push(
        setTimeout(() => {
          if (linkUpRef.current) {
            startSource();
          } else if (n < MAX_ATTEMPTS) {
            step();
          }
        }, RETRY_MS)
      );
    };
    step();
  }, [startSource]);

  const simulateLoss = useCallback(() => {
    if (status !== 'connected') return;
    stopSource();
    linkUpRef.current = false;
    runReconnect();
  }, [status, runReconnect]);

  const retry = useCallback(() => {
    linkUpRef.current = true;
    runReconnect();
  }, [runReconnect]);

  const setActivity = useCallback((mode) => sourceRef.current?.setMode(mode), []);

  const getSummary = useCallback(() => {
    const s = samplesRef.current;
    if (!s.length) return null;
    const values = s.map((x) => x.bpm);
    return {
      startedAt: new Date(s[0].ts).toISOString(),
      durationSec: Math.round((s[s.length - 1].ts - s[0].ts) / 1000),
      avgHr: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
      maxHr: Math.max(...values),
      secondsAboveThreshold: s.filter((x) => x.bpm / maxHr >= 0.85).length,
    };
  }, [maxHr]);

  useEffect(
    () => () => {
      clearTimers();
      stopSource();
    },
    []
  );

  const value = {
    status, device, bpm, maxHr,
    shareWithGroup, setShareWithGroup,
    heartRateAccess, setHeartRateAccess,
    attempt, maxAttempts: MAX_ATTEMPTS,
    connect, disconnect, simulateLoss, retry, setActivity, getSummary,
  };

  return <WearableContext.Provider value={value}>{children}</WearableContext.Provider>;
}

export const useWearable = () => useContext(WearableContext);