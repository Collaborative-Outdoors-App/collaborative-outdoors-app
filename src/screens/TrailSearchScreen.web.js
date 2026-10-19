import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  getVersion,
  Map as MapLibreMap,
  NavigationControl,
  ScaleControl,
  setWorkerUrl,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { getTrailGeometry } from "../constants/trails/geometry";
import trailsData from "../constants/trails/trails.json";
import TrailDetailsPanel from "../components/TrailDetailsPanel";
import TrailSearchBar from "../components/TrailSearchBar";
import DistanceFilter from "../components/DistanceFilter";
import HikeActivityPanel from "../components/HikeActivityPanel";
import GroupVitalsPanel from "../components/GroupVitalsPanel";
import LocationButton from "../components/LocationButton";
import HikeSummaryPopup from "../components/HikeSummaryPopup";
import "./TrailSearchScreen.web.css";

const MAPTILER_API_KEY = "4UhJpV0jRJOhzjgVw2b0";
const MAP_STYLE_URL = `https://api.maptiler.com/maps/basic-v2/style.json?key=${MAPTILER_API_KEY}`;
const EMPTY_FEATURE_COLLECTION = { type: "FeatureCollection", features: [] };
setWorkerUrl(`https://unpkg.com/maplibre-gl@${getVersion()}/dist/maplibre-gl-worker.mjs`);
const HIKE_PANEL_BTNS = [
  { key: "activity", label: "⏱ Activity" },
  { key: "vitals", label: "❤️ Vitals" },
];

function getTrailFeatures(trails) {
  return {
    type: "FeatureCollection",
    features: trails.map((trail) => ({
      type: "Feature",
      id: String(trail.trailId),
      geometry: { type: "Point", coordinates: [trail.start.lon, trail.start.lat] },
      properties: { id: String(trail.trailId), name: trail.name },
    })),
  };
}

export default function TrailSearchScreen() {
  const navigation = useNavigation();
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const mapDataRef = useRef({ trails: EMPTY_FEATURE_COLLECTION, geometry: EMPTY_FEATURE_COLLECTION });
  const onSelectTrailRef = useRef(null);
  const [selectedTrailId, setSelectedTrailId] = useState(null);
  const [distanceFilter, setDistanceFilter] = useState(null);
  const [hikeActive, setHikeActive] = useState(false);
  const [activeHikePanel, setActiveHikePanel] = useState(null);
  const [hikeSeconds, setHikeSeconds] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [locationError, setLocationError] = useState(null);

  const filteredTrails = useMemo(() => {
    if (!distanceFilter || distanceFilter.id === "all") return trailsData;
    return trailsData.filter((trail) => {
      const length = trail.lengthKm ?? 0;
      return (distanceFilter.min == null || length >= distanceFilter.min) &&
        (distanceFilter.max == null || length <= distanceFilter.max);
    });
  }, [distanceFilter]);

  const selectedTrail = useMemo(
    () => (selectedTrailId
      ? trailsData.find((trail) => String(trail.trailId) === String(selectedTrailId))
      : null),
    [selectedTrailId],
  );
  const selectedGeometry = useMemo(
    () => (selectedTrail ? getTrailGeometry(selectedTrail.trailId) : null),
    [selectedTrail],
  );
  const visibleTrails = hikeActive
    ? (selectedTrail ? [selectedTrail] : [])
    : filteredTrails;

  mapDataRef.current = {
    trails: getTrailFeatures(visibleTrails),
    geometry: selectedGeometry || EMPTY_FEATURE_COLLECTION,
  };

  const handleSelectTrail = useCallback((id) => {
    setSelectedTrailId(id);
    const trail = trailsData.find((item) => String(item.trailId) === String(id));
    if (trail?.bbox && mapRef.current) {
      mapRef.current.fitBounds(
        [[trail.bbox.west, trail.bbox.south], [trail.bbox.east, trail.bbox.north]],
        { padding: { top: 150, bottom: 210, left: 60, right: 60 }, duration: 900 },
      );
    }
  }, []);
  onSelectTrailRef.current = handleSelectTrail;

  useEffect(() => {
    if (!mapContainerRef.current) return undefined;

    const initialTrail = trailsData[0];
    const map = new MapLibreMap({
      container: mapContainerRef.current,
      style: MAP_STYLE_URL,
      center: [initialTrail.start.lon, initialTrail.start.lat],
      zoom: 12,
      attributionControl: true,
    });
    mapRef.current = map;
    let styleLoaded = false;

    map.addControl(new NavigationControl(), "top-right");
    map.addControl(new ScaleControl({ unit: "metric" }));
    map.on("load", () => {
      map.addSource("trails", { type: "geojson", data: mapDataRef.current.trails });
      map.addSource("selected-trail", { type: "geojson", data: mapDataRef.current.geometry });
      map.addLayer({
        id: "selected-trail-casing",
        type: "line",
        source: "selected-trail",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#ffffff", "line-width": 8, "line-opacity": 0.9 },
      });
      map.addLayer({
        id: "selected-trail-line",
        type: "line",
        source: "selected-trail",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#ea580c", "line-width": 5, "line-opacity": 0.95 },
      });
      map.addLayer({
        id: "trail-points",
        type: "circle",
        source: "trails",
        paint: {
          "circle-radius": 8,
          "circle-color": "#2563eb",
          "circle-stroke-width": 2.5,
          "circle-stroke-color": "#ffffff",
        },
      });
      map.addLayer({
        id: "trail-labels",
        type: "symbol",
        source: "trails",
        layout: {
          "text-field": ["get", "name"],
          "text-size": 12,
          "text-offset": [0, 1.3],
          "text-anchor": "top",
          "text-allow-overlap": false,
        },
        paint: {
          "text-color": "#0f172a",
          "text-halo-color": "#ffffff",
          "text-halo-width": 1.5,
        },
      });
      styleLoaded = true;
      setMapError(null);
      map.resize();
    });
    map.on("click", "trail-points", (event) => {
      const trailId = event.features?.[0]?.properties?.id;
      if (trailId != null) onSelectTrailRef.current?.(trailId);
    });
    map.on("mouseenter", "trail-points", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "trail-points", () => {
      map.getCanvas().style.cursor = "";
    });
    map.on("error", (event) => {
      if (!styleLoaded && event.error) {
        setMapError("The map could not be loaded. Check your connection and try again.");
      }
    });

    return () => {
      mapRef.current = null;
      map.remove();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const trailsSource = map?.getSource("trails");
    const geometrySource = map?.getSource("selected-trail");
    if (trailsSource && geometrySource) {
      trailsSource.setData(mapDataRef.current.trails);
      geometrySource.setData(mapDataRef.current.geometry);
    }
  }, [visibleTrails, selectedGeometry]);

  useEffect(() => {
    if (!hikeActive || showSummary) return undefined;
    const timer = setInterval(() => setHikeSeconds((seconds) => seconds + 1), 1000);
    return () => clearInterval(timer);
  }, [hikeActive, showSummary]);

  const handleZoomToUserLocation = useCallback(() => {
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError("Location is not available in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        mapRef.current?.flyTo({
          center: [coords.longitude, coords.latitude],
          zoom: 15,
          duration: 1000,
        });
      },
      () => setLocationError("Could not get your location. Check your browser permissions."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  const handleReturnHome = useCallback(() => {
    setShowSummary(false);
    setHikeActive(false);
    setSelectedTrailId(null);
    setActiveHikePanel(null);
    setHikeSeconds(0);
    navigation.navigate("Home");
  }, [navigation]);

  const bottomOffset = hikeActive
    ? activeHikePanel === "vitals" ? 315 : activeHikePanel === "activity" ? 220 : 24
    : selectedTrailId ? 140 : 24;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <div ref={mapContainerRef} className="trail-map-web" />
      {mapError && (
        <View style={styles.mapMessage}>
          <Text style={styles.mapMessageText}>{mapError}</Text>
        </View>
      )}

      {!hikeActive && (
        <>
          <TrailSearchBar onSelectTrail={handleSelectTrail} trails={filteredTrails} />
          <DistanceFilter onFilterChange={setDistanceFilter} />
        </>
      )}

      <LocationButton onPress={handleZoomToUserLocation} style={{ bottom: bottomOffset }} />
      {locationError && (
        <View style={[styles.locationMessage, { bottom: bottomOffset + 54 }]}>
          <Text style={styles.locationMessageText}>{locationError}</Text>
        </View>
      )}

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
              onEndHike={() => setShowSummary(true)}
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

      <HikeSummaryPopup
        visible={showSummary}
        trail={selectedTrail}
        seconds={hikeSeconds}
        distanceKm={0}
        onReturnHome={handleReturnHome}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, position: "relative", overflow: "hidden" },
  mapMessage: {
    position: "absolute",
    top: 165,
    left: 20,
    right: 20,
    zIndex: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  mapMessageText: { color: "#991b1b", textAlign: "center" },
  locationMessage: {
    position: "absolute",
    right: 70,
    maxWidth: 260,
    zIndex: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  locationMessageText: { color: "#334155", fontSize: 13 },
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
