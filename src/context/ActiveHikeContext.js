import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { AppState, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LocationManager } from "@maplibre/maplibre-react-native";
import { calculateDistanceKm } from "../utils/geo";

const STORAGE_KEY = "@outdoorz/active_hike";

const ActiveHikeContext = createContext({
  hikeActive: false,
  hikeTrail: null,
  hikeStartTime: null,
  hikeSeconds: 0,
  hikeDistanceKm: 0,
  currentPosition: null,
  activeHikePanel: null,
  isPaused: false,
  startHike: () => {},
  endHike: () => {},
  pauseHike: () => {},
  resumeHike: () => {},
  setActiveHikePanel: () => {},
  setIsPaused: () => {},
});

export function ActiveHikeProvider({ children }) {
  const [hikeActive, setHikeActive] = useState(false);
  const [hikeTrail, setHikeTrail] = useState(null);
  const [hikeStartTime, setHikeStartTime] = useState(null);
  const [hikeSeconds, setHikeSeconds] = useState(0);
  const [hikeDistanceKm, setHikeDistanceKm] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [activeHikePanel, setActiveHikePanel] = useState(null);
  const [isPaused, setIsPausedState] = useState(false);

  // Refs to allow event listeners / background callbacks to access the latest state
  const hikeActiveRef = useRef(false);
  const hikeTrailRef = useRef(null);
  const hikeStartTimeRef = useRef(null);
  const hikeDistanceKmRef = useRef(0);
  const activeHikePanelRef = useRef(null);
  const isPausedRef = useRef(false);
  const lastPositionRef = useRef(null);

  // Keep refs in sync with state
  useEffect(() => {
    hikeActiveRef.current = hikeActive;
  }, [hikeActive]);

  useEffect(() => {
    hikeTrailRef.current = hikeTrail;
  }, [hikeTrail]);

  useEffect(() => {
    hikeStartTimeRef.current = hikeStartTime;
  }, [hikeStartTime]);

  useEffect(() => {
    hikeDistanceKmRef.current = hikeDistanceKm;
  }, [hikeDistanceKm]);

  useEffect(() => {
    activeHikePanelRef.current = activeHikePanel;
  }, [activeHikePanel]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Helper to persist hike to storage
  const persistHikeData = useCallback(async (data) => {
    try {
      if (!data) {
        await AsyncStorage.removeItem(STORAGE_KEY);
      } else {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    } catch (err) {
      console.warn("[ActiveHike] Error writing to storage:", err);
    }
  }, []);

  // Process GPS location update and accumulate distance
  const processNewLocation = useCallback(
    (latitude, longitude) => {
      if (!hikeActiveRef.current || isPausedRef.current) return;
      if (latitude == null || longitude == null) return;

      setCurrentPosition({ latitude, longitude });

      const lastPos = lastPositionRef.current;
      if (!lastPos) {
        lastPositionRef.current = { latitude, longitude, timestamp: Date.now() };
        persistHikeData({
          hikeActive: true,
          hikeTrail: hikeTrailRef.current,
          hikeStartTime: hikeStartTimeRef.current,
          hikeDistanceKm: hikeDistanceKmRef.current,
          activeHikePanel: activeHikePanelRef.current,
          lastPosition: { latitude, longitude, timestamp: Date.now() },
        });
        return;
      }

      const deltaKm = calculateDistanceKm(
        lastPos.latitude,
        lastPos.longitude,
        latitude,
        longitude
      );

      // Filter out micro-jitter (< 3 meters) and impossible teleports (> 100 km)
      if (deltaKm >= 0.003 && deltaKm < 100) {
        setHikeDistanceKm((prev) => {
          const nextDistance = prev + deltaKm;
          hikeDistanceKmRef.current = nextDistance;

          persistHikeData({
            hikeActive: true,
            hikeTrail: hikeTrailRef.current,
            hikeStartTime: hikeStartTimeRef.current,
            hikeDistanceKm: nextDistance,
            activeHikePanel: activeHikePanelRef.current,
            lastPosition: { latitude, longitude, timestamp: Date.now() },
          });

          return nextDistance;
        });

        lastPositionRef.current = { latitude, longitude, timestamp: Date.now() };
      } else if (deltaKm >= 100) {
        // Reset anchor point if there was a massive jump without adding erroneous distance
        lastPositionRef.current = { latitude, longitude, timestamp: Date.now() };
      }
    },
    [persistHikeData]
  );

  // Restore active hike on initial mount if one was saved
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved && mounted) {
          const data = JSON.parse(saved);
          if (data && data.hikeActive && data.hikeStartTime) {
            const now = Date.now();
            const elapsed = Math.floor((now - data.hikeStartTime) / 1000);

            hikeActiveRef.current = true;
            hikeTrailRef.current = data.hikeTrail;
            hikeStartTimeRef.current = data.hikeStartTime;
            hikeDistanceKmRef.current = data.hikeDistanceKm || 0;
            activeHikePanelRef.current = data.activeHikePanel || "activity";
            lastPositionRef.current = data.lastPosition || null;

            setHikeActive(true);
            setHikeTrail(data.hikeTrail);
            setHikeStartTime(data.hikeStartTime);
            setHikeSeconds(Math.max(0, elapsed));
            setHikeDistanceKm(data.hikeDistanceKm || 0);
            setActiveHikePanel(data.activeHikePanel || "activity");

            // Ensure LocationManager is started
            LocationManager?.requestPermissions?.().then((granted) => {
              if (granted) {
                LocationManager?.start?.();
                LocationManager?.getCurrentPosition?.().then((pos) => {
                  if (pos?.coords) {
                    processNewLocation(pos.coords.latitude, pos.coords.longitude);
                  }
                });
              }
            });
          }
        }
      } catch (err) {
        console.warn("[ActiveHike] Error restoring active hike:", err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [processNewLocation]);

  // Persistent location listener: keeps receiving GPS coordinates even when switching screens
  useEffect(() => {
    if (!hikeActive || isPaused) return;

    const handleLocationUpdate = (location) => {
      if (!location?.coords) return;
      const { latitude, longitude, accuracy } = location.coords;
      if (latitude == null || longitude == null) return;
      // Filter out readings with very poor accuracy (> 50m)
      if (typeof accuracy === "number" && accuracy > 50) return;

      processNewLocation(latitude, longitude);
    };

    LocationManager?.addListener?.(handleLocationUpdate);
    return () => {
      LocationManager?.removeListener?.(handleLocationUpdate);
    };
  }, [hikeActive, isPaused, processNewLocation]);

  // Foreground timer: updates elapsed seconds smoothly every second
  useEffect(() => {
    if (!hikeActive || isPaused) return;

    const interval = setInterval(() => {
      if (hikeStartTimeRef.current) {
        const now = Date.now();
        const elapsed = Math.floor((now - hikeStartTimeRef.current) / 1000);
        setHikeSeconds(Math.max(0, elapsed));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [hikeActive, isPaused]);

  // AppState listener: catches background -> foreground transitions
  // Ensures time elapsed and distance calculate accurately when returning from background
  useEffect(() => {
    const subscription = AppState.addEventListener("change", async (nextAppState) => {
      if (nextAppState === "active" && hikeActiveRef.current && !isPausedRef.current) {
        // 1. Immediately update elapsed seconds based on wall-clock time
        if (hikeStartTimeRef.current) {
          const now = Date.now();
          const elapsed = Math.floor((now - hikeStartTimeRef.current) / 1000);
          setHikeSeconds(Math.max(0, elapsed));
        }

        // 2. Immediately query current GPS location to account for movement while in background
        try {
          const pos = await LocationManager?.getCurrentPosition?.();
          if (pos?.coords) {
            const { latitude, longitude, accuracy } = pos.coords;
            if (latitude != null && longitude != null && (accuracy == null || accuracy <= 50)) {
              processNewLocation(latitude, longitude);
            }
          }
        } catch (err) {
          console.warn("[ActiveHike] Error retrieving location on app resume:", err);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [processNewLocation]);

  // Action: Start a new hike
  const startHike = useCallback(
    (trail, initialCoords) => {
      const now = Date.now();
      const initialPos = initialCoords
        ? { latitude: initialCoords.latitude, longitude: initialCoords.longitude, timestamp: now }
        : null;

      hikeActiveRef.current = true;
      hikeTrailRef.current = trail;
      hikeStartTimeRef.current = now;
      hikeDistanceKmRef.current = 0;
      activeHikePanelRef.current = "activity";
      isPausedRef.current = false;
      lastPositionRef.current = initialPos;

      setHikeActive(true);
      setHikeTrail(trail);
      setHikeStartTime(now);
      setHikeSeconds(0);
      setHikeDistanceKm(0);
      setCurrentPosition(initialPos ? { latitude: initialPos.latitude, longitude: initialPos.longitude } : null);
      setActiveHikePanel("activity");
      setIsPausedState(false);

      LocationManager?.start?.();

      persistHikeData({
        hikeActive: true,
        hikeTrail: trail,
        hikeStartTime: now,
        hikeDistanceKm: 0,
        activeHikePanel: "activity",
        lastPosition: initialPos,
      });
    },
    [persistHikeData]
  );

  // Action: End and complete the hike (non-persistent after completion)
  const endHike = useCallback(async () => {
    hikeActiveRef.current = false;
    hikeTrailRef.current = null;
    hikeStartTimeRef.current = null;
    hikeDistanceKmRef.current = 0;
    activeHikePanelRef.current = null;
    isPausedRef.current = false;
    lastPositionRef.current = null;

    setHikeActive(false);
    setHikeTrail(null);
    setHikeStartTime(null);
    setHikeSeconds(0);
    setHikeDistanceKm(0);
    setCurrentPosition(null);
    setActiveHikePanel(null);
    setIsPausedState(false);

    await persistHikeData(null);
  }, [persistHikeData]);

  const pauseHike = useCallback(() => {
    isPausedRef.current = true;
    setIsPausedState(true);
  }, []);

  const resumeHike = useCallback(() => {
    isPausedRef.current = false;
    setIsPausedState(false);
  }, []);

  const setIsPaused = useCallback((paused) => {
    isPausedRef.current = Boolean(paused);
    setIsPausedState(Boolean(paused));
  }, []);

  const value = {
    hikeActive,
    hikeTrail,
    hikeStartTime,
    hikeSeconds,
    hikeDistanceKm,
    currentPosition,
    activeHikePanel,
    isPaused,
    startHike,
    endHike,
    pauseHike,
    resumeHike,
    setActiveHikePanel,
    setIsPaused,
  };

  return (
    <ActiveHikeContext.Provider value={value}>
      {children}
    </ActiveHikeContext.Provider>
  );
}

export function useActiveHike() {
  const context = useContext(ActiveHikeContext);
  if (!context) {
    throw new Error("useActiveHike must be used within an ActiveHikeProvider");
  }
  return context;
}
