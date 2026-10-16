import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, Keyboard, TouchableOpacity, Text } from "react-native";
import {
  Map,
  Camera,
  GeoJSONSource,
  Layer,
  UserLocation,
  LocationManager,
  useCurrentPosition,
} from "@maplibre/maplibre-react-native";
import { getTrailGeometry } from "../constants/trails/geometry";
import trailsData from "../constants/trails/trails.json";
import TrailDetailsPanel from "../components/TrailDetailsPanel";
import TrailSearchBar from "../components/TrailSearchBar";
import DistanceFilter from "../components/DistanceFilter";
import HikeActivityPanel from "../components/HikeActivityPanel";
import GroupVitalsPanel from "../components/GroupVitalsPanel";
import LocationButton from "../components/LocationButton";

const MAPTILER_API_KEY = "4UhJpV0jRJOhzjgVw2b0";
const MAP_STYLE_URL = `https://api.maptiler.com/maps/basic-v2/style.json?key=${MAPTILER_API_KEY}`;
const INITIAL_VIEW_STATE = { center: [trailsData[0].start.lon, trailsData[0].start.lat], zoom: 12 };
const FIT_BOUNDS_PADDING = { top: 110, bottom: 200, left: 60, right: 60 };

// Hoisted layer styles to avoid recreating objects each render (MapLibre performance)
const LINE_LAYOUT = { "line-cap": "round", "line-join": "round" };
const CASING_PAINT = { "line-color": "#ffffff", "line-width": 8, "line-opacity": 0.9 };
const LINE_PAINT = { "line-color": "#ea580c", "line-width": 5, "line-opacity": 0.95 };
const GLOW_PAINT = { "circle-radius": 13, "circle-color": "#2563eb", "circle-opacity": 0.2 };
const POINT_PAINT = {
  "circle-radius": 7,
  "circle-color": "#2563eb",
  "circle-stroke-width": 2.5,
  "circle-stroke-color": "#ffffff",
};
const LABEL_LAYOUT = {
  "text-field": ["get", "name"],
  "text-size": 12,
  "text-offset": [0, 1.3],
  "text-anchor": "top",
  "text-allow-overlap": false,
};
const LABEL_PAINT = { "text-color": "#0f172a", "text-halo-color": "#ffffff", "text-halo-width": 1.5 };

const HIKE_PANEL_BTNS = [
  { key: "activity", label: "⏱ Activity" },
  { key: "vitals", label: "❤️ Vitals" },
];

export default function TrailSearchScreen() {
  const [selectedTrailId, setSelectedTrailId] = useState(null);
  const [distanceFilter, setDistanceFilter] = useState(null);
  const [hikeActive, setHikeActive] = useState(false);
  const [activeHikePanel, setActiveHikePanel] = useState(null);
  const [hikeSeconds, setHikeSeconds] = useState(0);
  const cameraRef = useRef(null);
  const currentPosition = useCurrentPosition();

  useEffect(() => {
    LocationManager.requestPermissions().then((granted) => {
      if (granted) LocationManager.start();
    });
  }, []);

  useEffect(() => {
    if (!hikeActive) return;
    const timer = setInterval(() => setHikeSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [hikeActive]);

  const endHike = useCallback(() => {
    setHikeActive(false);
    setSelectedTrailId(null);
    setActiveHikePanel(null);
    setHikeSeconds(0);
  }, []);

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

  const trailsGeoJSON = useMemo(() => {
    const list = hikeActive ? (selectedTrail ? [selectedTrail] : []) : filteredTrails;
    return {
      type: "FeatureCollection",
      features: list.map((trail) => ({
        type: "Feature",
        id: trail.trailId,
        geometry: { type: "Point", coordinates: [trail.start.lon, trail.start.lat] },
        properties: { id: trail.trailId, name: trail.name },
      })),
    };
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

  const handleTrailPress = (event) => {
    if (hikeActive) return;
    const feat = event?.features?.[0] || event?.nativeEvent?.features?.[0];
    if (feat) handleSelectTrail(feat.properties.id);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      {!hikeActive && (
        <>
          <TrailSearchBar onSelectTrail={handleSelectTrail} trails={filteredTrails} />
          <DistanceFilter onFilterChange={setDistanceFilter} />
        </>
      )}
      <Map style={styles.map} mapStyle={MAP_STYLE_URL} onPress={Keyboard.dismiss}>
        <Camera ref={cameraRef} initialViewState={INITIAL_VIEW_STATE} />
        <UserLocation animated />

        {selectedGeometry && (
          <GeoJSONSource id="selected-trail-path-source" data={selectedGeometry}>
            <Layer id="trail-path-casing" type="line" layout={LINE_LAYOUT} paint={CASING_PAINT} />
            <Layer id="trail-path-line" type="line" layout={LINE_LAYOUT} paint={LINE_PAINT} />
          </GeoJSONSource>
        )}

        <GeoJSONSource id="trails-source" data={trailsGeoJSON} onPress={handleTrailPress}>
          <Layer id="trails-glow" type="circle" paint={GLOW_PAINT} />
          <Layer id="trails-point" type="circle" paint={POINT_PAINT} />
          <Layer id="trails-label" type="symbol" layout={LABEL_LAYOUT} paint={LABEL_PAINT} />
        </GeoJSONSource>
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
              onEndHike={endHike}
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
          }}
        />
      )}
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
});