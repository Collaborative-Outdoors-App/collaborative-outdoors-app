import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, Keyboard, TouchableOpacity, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  Map,
  Camera,
  GeoJSONSource,
  Layer,
  UserLocation,
  LocationManager,
  useCurrentPosition,
  Marker,
} from "@maplibre/maplibre-react-native";
import { getTrailGeometry } from "../constants/trails/geometry";
import trailsData from "../constants/trails/trails.json";
import TrailDetailsPanel from "../components/TrailDetailsPanel";
import TrailSearchBar from "../components/TrailSearchBar";
import DistanceFilter from "../components/DistanceFilter";
import HikeActivityPanel from "../components/HikeActivityPanel";
import GroupVitalsPanel from "../components/GroupVitalsPanel";
import LocationButton from "../components/LocationButton";
import HikeSummaryPopup from "../components/HikeSummaryPopup";
import AchievementUnlockedPopup from "../components/AchievementUnlockedPopup";
import { saveHike } from "../services/saveHikeService";
import { calculateDistanceKm } from "../utils/geo";

const MAPTILER_API_KEY = "4UhJpV0jRJOhzjgVw2b0";
const MAP_STYLE_URL = `https://api.maptiler.com/maps/basic-v2/style.json?key=${MAPTILER_API_KEY}`;
const INITIAL_VIEW_STATE = { center: [trailsData[0].start.lon, trailsData[0].start.lat], zoom: 12 };
const FIT_BOUNDS_PADDING = { top: 110, bottom: 200, left: 60, right: 60 };

// Hoisted layer styles to avoid recreating objects each render (MapLibre performance)
const LINE_LAYOUT = { "line-cap": "round", "line-join": "round" };
const CASING_PAINT = { "line-color": "#ffffff", "line-width": 8, "line-opacity": 0.9 };
const LINE_PAINT = { "line-color": "#ea580c", "line-width": 5, "line-opacity": 0.95 };

const HIKE_PANEL_BTNS = [
  { key: "activity", label: "⏱ Activity" },
  { key: "vitals", label: "❤️ Vitals" },
];

export default function TrailSearchScreen() {
  const navigation = useNavigation();
  const [selectedTrailId, setSelectedTrailId] = useState(null);
  const [distanceFilter, setDistanceFilter] = useState(null);
  const [hikeActive, setHikeActive] = useState(false);
  const [activeHikePanel, setActiveHikePanel] = useState(null);
  const [hikeSeconds, setHikeSeconds] = useState(0);
  const [hikeDistanceKm, setHikeDistanceKm] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [achievementQueue, setAchievementQueue] = useState([]);
  const [totalUnlockedCount, setTotalUnlockedCount] = useState(0);
  const [currentZoom, setCurrentZoom] = useState(INITIAL_VIEW_STATE.zoom);
  const [saveStatus, setSaveStatus] = useState("idle"); // "idle" | "saving" | "saved" | "error"
  const cameraRef = useRef(null);
  const lastHikePositionRef = useRef(null);
  const currentPosition = useCurrentPosition();

  useEffect(() => {
    LocationManager.requestPermissions().then((granted) => {
      if (granted) LocationManager.start();
    });
  }, []);

  // Distance calculation based on user movement during an active hike
  useEffect(() => {
    if (!hikeActive || showSummary || !currentPosition?.coords) return;

    const { latitude, longitude, accuracy } = currentPosition.coords;
    if (latitude == null || longitude == null) return;

    // Filter out very poor accuracy readings (> 50m)
    if (typeof accuracy === "number" && accuracy > 50) return;

    if (!lastHikePositionRef.current) {
      lastHikePositionRef.current = { latitude, longitude };
      return;
    }

    const deltaKm = calculateDistanceKm(
      lastHikePositionRef.current.latitude,
      lastHikePositionRef.current.longitude,
      latitude,
      longitude
    );

    // Filter out micro GPS jitter (< 3 meters) and unreasonable jumps (> 500 meters)
    if (deltaKm >= 0.003 && deltaKm < 0.5) {
      setHikeDistanceKm((prev) => prev + deltaKm);
      lastHikePositionRef.current = { latitude, longitude };
    } else if (deltaKm >= 0.5) {
      lastHikePositionRef.current = { latitude, longitude };
    }
  }, [currentPosition, hikeActive, showSummary]);

  // Timer pauses while the summary popup is showing
  useEffect(() => {
    if (!hikeActive || showSummary) return;
    const timer = setInterval(() => setHikeSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [hikeActive, showSummary]);

  const handleEndHike = useCallback(async () => {
    setShowSummary(true);

    if (saveStatus === "saving" || saveStatus === "saved") return; // ignore double taps

    setSaveStatus("saving");
    try {
      const response = await saveHike({ seconds: hikeSeconds, distanceKm: hikeDistanceKm });
      const earnedAchievements = response?.newAchievements ?? [];

      console.log("SAVED!");
      console.log("Earned achievements:", earnedAchievements);

      if (Array.isArray(earnedAchievements) && earnedAchievements.length > 0) {
        setAchievementQueue(earnedAchievements);
        setTotalUnlockedCount(earnedAchievements.length);
      }

      setSaveStatus("saved");
    } catch (err) {
      console.warn("Failed to save hike:", err.message);
      setSaveStatus("error");
    }
  }, [hikeSeconds, hikeDistanceKm, saveStatus]);

  const handleDismissAchievement = useCallback(() => {
    setAchievementQueue((prev) => prev.slice(1));
  }, []);

  // Called from the popup: reset everything and go home
  const handleReturnHome = useCallback(() => {
    setShowSummary(false);
    setHikeActive(false);
    setSelectedTrailId(null);
    setActiveHikePanel(null);
    setHikeSeconds(0);
    setHikeDistanceKm(0);
    setAchievementQueue([]);
    setTotalUnlockedCount(0);
    lastHikePositionRef.current = null;
    navigation.navigate("Home");
  }, [navigation]);

  const handleZoomToUserLocation = async () => {
    let coords = currentPosition?.coords || (await LocationManager.getCurrentPosition())?.coords;
    if (!coords && (await LocationManager.requestPermissions())) {
      LocationManager.start();
      coords = (await LocationManager.getCurrentPosition())?.coords;
    }
    if (coords && cameraRef.current) {
      cameraRef.current.flyTo({ center: [coords.longitude, coords.latitude], zoom: 15, duration: 1000 });
    }
  };

  const bottomOffset = hikeActive
    ? activeHikePanel === "vitals" ? 315 : activeHikePanel === "activity" ? 220 : 24
    : selectedTrailId ? 140 : 24;

  const filteredTrails = useMemo(() => {
    if (!distanceFilter || distanceFilter.id === "all") return trailsData;
    return trailsData.filter((t) => {
      const len = t.lengthKm ?? 0;
      return (distanceFilter.min == null || len >= distanceFilter.min) &&
             (distanceFilter.max == null || len <= distanceFilter.max);
    });
  }, [distanceFilter]);

  const selectedTrail = useMemo(
    () => (selectedTrailId ? trailsData.find((t) => String(t.trailId) === String(selectedTrailId)) : null),
    [selectedTrailId]
  );

  const selectedGeometry = useMemo(
    () => (selectedTrail ? getTrailGeometry(selectedTrail.trailId) : null),
    [selectedTrail]
  );

  const visibleTrails = useMemo(() => {
    return hikeActive ? (selectedTrail ? [selectedTrail] : []) : filteredTrails;
  }, [hikeActive, selectedTrail, filteredTrails]);

  const handleSelectTrail = (id) => {
    setSelectedTrailId(id);
    const trail = trailsData.find((t) => String(t.trailId) === String(id));
    if (trail?.bbox && cameraRef.current) {
      cameraRef.current.fitBounds(
        [trail.bbox.west, trail.bbox.south, trail.bbox.east, trail.bbox.north],
        { padding: FIT_BOUNDS_PADDING, duration: 900 }
      );
    }
  };

  const handleRegionDidChange = useCallback((event) => {
    const zoom = event?.nativeEvent?.zoom ?? event?.zoom;
    if (typeof zoom === "number") {
      setCurrentZoom(zoom);
    }
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      {!hikeActive && (
        <>
          <TrailSearchBar onSelectTrail={handleSelectTrail} trails={filteredTrails} />
          <DistanceFilter onFilterChange={setDistanceFilter} />
        </>
      )}
      <Map
        style={styles.map}
        mapStyle={MAP_STYLE_URL}
        onRegionDidChange={handleRegionDidChange}
        onPress={Keyboard.dismiss}
      >
        <Camera ref={cameraRef} initialViewState={INITIAL_VIEW_STATE} />
        <UserLocation animated />

        {selectedGeometry && (
          <GeoJSONSource id="selected-trail-path-source" data={selectedGeometry}>
            <Layer id="trail-path-casing" type="line" layout={LINE_LAYOUT} paint={CASING_PAINT} />
            <Layer id="trail-path-line" type="line" layout={LINE_LAYOUT} paint={LINE_PAINT} />
          </GeoJSONSource>
        )}

        {visibleTrails.map((trail) => {
          const isSelected = String(trail.trailId) === String(selectedTrailId);
          // Show label if:
          // 1. This trail is selected (always show active selection's label)
          // 2. No trail is selected AND zoomed in (hide when another trail has details displayed or when zoomed out)
          const showLabel = isSelected || (!selectedTrailId && currentZoom >= 12.5);

          return (
            <Marker
              key={String(trail.trailId)}
              id={`marker-${trail.trailId}`}
              lngLat={[trail.start.lon, trail.start.lat]}
              anchor="center"
              onPress={() => handleSelectTrail(trail.trailId)}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleSelectTrail(trail.trailId)}
                style={styles.markerContainer}
              >
                <View style={[styles.markerGlow, isSelected && styles.markerGlowSelected]}>
                  <View style={[styles.markerDot, isSelected && styles.markerDotSelected]} />
                </View>
                {showLabel && (
                  <View style={[styles.markerLabelBox, isSelected && styles.markerLabelBoxSelected]}>
                    <Text
                      style={[styles.markerLabelText, isSelected && styles.markerLabelTextSelected]}
                      numberOfLines={1}
                    >
                      {trail.name}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </Marker>
          );
        })}
      </Map>

      <LocationButton onPress={handleZoomToUserLocation} style={{ bottom: bottomOffset }} />

      {hikeActive && (
        <View style={[styles.hikeButtonsRow, { bottom: bottomOffset }]}>
          {HIKE_PANEL_BTNS.map(({ key, label }) => {
            const isActive = activeHikePanel === key;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.hikeButton, isActive && styles.hikeButtonActive]}
                onPress={() => setActiveHikePanel(isActive ? null : key)}
              >
                <Text style={[styles.hikeButtonText, isActive && styles.hikeButtonTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {hikeActive ? (
        <>
          {activeHikePanel === "activity" && (
            <HikeActivityPanel
              trail={selectedTrail}
              seconds={hikeSeconds}
              distanceKm={hikeDistanceKm}
              onEndHike={handleEndHike}
              onMinimize={() => setActiveHikePanel(null)}
            />
          )}
          {activeHikePanel === "vitals" && (
            <GroupVitalsPanel onMinimize={() => setActiveHikePanel(null)} />
          )}
        </>
      ) : (
        <TrailDetailsPanel
          trail={selectedTrail}
          onClose={() => setSelectedTrailId(null)}
          onStartHike={() => {
            setHikeActive(true);
            setActiveHikePanel("activity");
            setHikeSeconds(0);
            setHikeDistanceKm(0);
            setAchievementQueue([]);
            setTotalUnlockedCount(0);
            lastHikePositionRef.current = currentPosition?.coords
              ? {
                  latitude: currentPosition.coords.latitude,
                  longitude: currentPosition.coords.longitude,
                }
              : null;
          }}
        />
      )}

      <HikeSummaryPopup
        visible={showSummary}
        trail={selectedTrail}
        seconds={hikeSeconds}
        distanceKm={hikeDistanceKm}
        onReturnHome={handleReturnHome}
      />

      <AchievementUnlockedPopup
        visible={achievementQueue.length > 0}
        achievement={achievementQueue[0]}
        currentIndex={totalUnlockedCount - achievementQueue.length + 1}
        totalCount={totalUnlockedCount}
        onDismiss={handleDismissAchievement}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  hikeButtonsRow: {
    position: "absolute",
    left: 16,
    flexDirection: "row",
    gap: 8,
    zIndex: 10,
  },
  hikeButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  hikeButtonActive: { backgroundColor: "#0f172a" },
  hikeButtonText: { fontSize: 13, fontWeight: "700", color: "#334155" },
  hikeButtonTextActive: { color: "#ffffff" },
  markerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  markerGlow: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(37, 99, 235, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  markerGlowSelected: {
    backgroundColor: "rgba(234, 88, 12, 0.25)",
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  markerDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#2563eb",
    borderWidth: 2.5,
    borderColor: "#ffffff",
  },
  markerDotSelected: {
    backgroundColor: "#ea580c",
  },
  markerLabelBox: {
    marginTop: 3,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: "#cbd5e1",
    maxWidth: 140,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  markerLabelBoxSelected: {
    backgroundColor: "#0f172a",
    borderColor: "#0f172a",
  },
  markerLabelText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#0f172a",
    textAlign: "center",
  },
  markerLabelTextSelected: {
    color: "#ffffff",
  },
});