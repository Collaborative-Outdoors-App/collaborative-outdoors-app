import { useState, useMemo, useRef, useEffect } from "react";
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
// Lighter style: swap "basic-v2" for another MapTiler style ID if you prefer
const MAP_STYLE_URL = `https://api.maptiler.com/maps/basic-v2/style.json?key=${MAPTILER_API_KEY}`;

// Hoisted so it isn't recreated on every render
const INITIAL_VIEW_STATE = {
  center: [trailsData[0].start.lon, trailsData[0].start.lat],
  zoom: 12,
};

export default function TrailSearchScreen() {
  const [selectedTrailId, setSelectedTrailId] = useState(null);
  const [distanceFilter, setDistanceFilter] = useState(null);
  const [hikeActive, setHikeActive] = useState(false);
  const [activeHikePanel, setActiveHikePanel] = useState(null);
  const cameraRef = useRef(null);
  const currentPosition = useCurrentPosition();

  useEffect(() => {
    LocationManager.requestPermissions().then((granted) => {
      if (granted) {
        LocationManager.start();
      }
    });
  }, []);

  const handleZoomToUserLocation = async () => {
    let coords = currentPosition?.coords;
    if (!coords) {
      const pos = await LocationManager.getCurrentPosition();
      coords = pos?.coords;
    }
    if (!coords) {
      const granted = await LocationManager.requestPermissions();
      if (granted) {
        LocationManager.start();
        const pos = await LocationManager.getCurrentPosition();
        coords = pos?.coords;
      }
    }
    if (coords && cameraRef.current) {
      cameraRef.current.flyTo({
        center: [coords.longitude, coords.latitude],
        zoom: 15,
        duration: 1000,
      });
    }
  };

  const locationButtonBottom = hikeActive
    ? activeHikePanel === "vitals"
      ? 315
      : activeHikePanel === "activity"
      ? 220
      : 24
    : selectedTrailId
    ? 140
    : 24;

  const hikeButtonsBottom = locationButtonBottom;

  const filteredTrails = useMemo(() => {
    if (!distanceFilter || distanceFilter.id === "all") return trailsData;
    return trailsData.filter((t) => {
      const len = t.lengthKm ?? 0;
      if (distanceFilter.min != null && len < distanceFilter.min) return false;
      if (distanceFilter.max != null && len > distanceFilter.max) return false;
      return true;
    });
  }, [distanceFilter]);

  const selectedTrail = useMemo(() => {
    if (!selectedTrailId) return null;
    return trailsData.find((t) => String(t.trailId) === String(selectedTrailId));
  }, [selectedTrailId]);

  // Path geometry for the selected trail
  const selectedGeometry = useMemo(() => {
    if (!selectedTrail) return null;
    return getTrailGeometry(selectedTrail.trailId);
  }, [selectedTrail]);

  // Only render the active trail when on an active hike
  const displayTrails = useMemo(() => {
    if (hikeActive) {
      return selectedTrail ? [selectedTrail] : [];
    }
    return filteredTrails;
  }, [hikeActive, selectedTrail, filteredTrails]);

  // Trail start points as a GeoJSON FeatureCollection
  const trailsGeoJSON = useMemo(
    () => ({
      type: "FeatureCollection",
      features: displayTrails.map((trail) => ({
        type: "Feature",
        id: trail.trailId,
        geometry: {
          type: "Point",
          coordinates: [trail.start.lon, trail.start.lat],
        },
        properties: {
          id: trail.trailId,
          name: trail.name,
        },
      })),
    }),
    [displayTrails]
  );

  const handleSelectTrail = (id) => {
    setSelectedTrailId(id);

    const trailItem = trailsData.find((t) => String(t.trailId) === String(id));
    if (trailItem?.bbox && cameraRef.current) {
      cameraRef.current.fitBounds(
        [
          trailItem.bbox.west,
          trailItem.bbox.south,
          trailItem.bbox.east,
          trailItem.bbox.north,
        ],
        {
          padding: { top: 110, bottom: 200, left: 60, right: 60 },
          duration: 900,
        }
      );
    }
  };

  // Tapping a marker selects the trail, shows its path, and fits the camera
  const handleTrailPress = (event) => {
    if (hikeActive) return;
    const features = event?.features || event?.nativeEvent?.features;
    if (!features || features.length === 0) return;
    handleSelectTrail(features[0].properties.id);
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
      <Map style={styles.map} mapStyle={MAP_STYLE_URL} onPress={() => Keyboard.dismiss()}>
        <Camera ref={cameraRef} initialViewState={INITIAL_VIEW_STATE} />
        <UserLocation animated />

        {/* Selected trail path */}
        {selectedGeometry && (
          <GeoJSONSource id="selected-trail-path-source" data={selectedGeometry}>
            <Layer
              id="trail-path-casing"
              type="line"
              layout={{ "line-cap": "round", "line-join": "round" }}
              paint={{
                "line-color": "#ffffff",
                "line-width": 8,
                "line-opacity": 0.9,
              }}
            />
            <Layer
              id="trail-path-line"
              type="line"
              layout={{ "line-cap": "round", "line-join": "round" }}
              paint={{
                "line-color": "#ea580c",
                "line-width": 5,
                "line-opacity": 0.95,
              }}
            />
          </GeoJSONSource>
        )}

        {/* Trail markers */}
        <GeoJSONSource
          id="trails-source"
          data={trailsGeoJSON}
          onPress={handleTrailPress}
        >
          <Layer
            id="trails-glow"
            type="circle"
            paint={{
              "circle-radius": 13,
              "circle-color": "#2563eb",
              "circle-opacity": 0.2,
            }}
          />
          <Layer
            id="trails-point"
            type="circle"
            paint={{
              "circle-radius": 7,
              "circle-color": "#2563eb",
              "circle-stroke-width": 2.5,
              "circle-stroke-color": "#ffffff",
            }}
          />
          <Layer
            id="trails-label"
            type="symbol"
            layout={{
              "text-field": ["get", "name"],
              "text-size": 12,
              "text-offset": [0, 1.3],
              "text-anchor": "top",
              "text-allow-overlap": false,
            }}
            paint={{
              "text-color": "#0f172a",
              "text-halo-color": "#ffffff",
              "text-halo-width": 1.5,
            }}
          />
        </GeoJSONSource>
      </Map>
      <LocationButton
        onPress={handleZoomToUserLocation}
        style={{ bottom: locationButtonBottom }}
      />
      {hikeActive && (
        <View style={[styles.hikeButtonsRow, { bottom: hikeButtonsBottom }]}>
          <TouchableOpacity
            style={[
              styles.hikeButton,
              activeHikePanel === "activity" && styles.hikeButtonActive,
            ]}
            onPress={() =>
              setActiveHikePanel(
                activeHikePanel === "activity" ? null : "activity"
              )
            }
          >
            <Text
              style={[
                styles.hikeButtonText,
                activeHikePanel === "activity" && styles.hikeButtonTextActive,
              ]}
            >
              ⏱ Activity
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.hikeButton,
              activeHikePanel === "vitals" && styles.hikeButtonActive,
            ]}
            onPress={() =>
              setActiveHikePanel(activeHikePanel === "vitals" ? null : "vitals")
            }
          >
            <Text
              style={[
                styles.hikeButtonText,
                activeHikePanel === "vitals" && styles.hikeButtonTextActive,
              ]}
            >
              ❤️ Vitals
            </Text>
          </TouchableOpacity>
        </View>
      )}
      {hikeActive ? (
        <>
          {activeHikePanel === "activity" && (
            <HikeActivityPanel
              trail={selectedTrail}
              onEndHike={() => {
                setHikeActive(false);
                setSelectedTrailId(null);
                setActiveHikePanel(null);
              }}
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
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  hikeButtonActive: {
    backgroundColor: "#0f172a",
  },
  hikeButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
  },
  hikeButtonTextActive: {
    color: "#ffffff",
  },
});