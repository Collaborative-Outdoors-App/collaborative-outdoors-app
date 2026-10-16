import { useState, useMemo, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import {
  Map,
  Camera,
  GeoJSONSource,
  Layer,
} from "@maplibre/maplibre-react-native";
import { getTrailGeometry } from "../constants/trails/geometry";
import trailsData from "../constants/trails/trails.json";

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
  const cameraRef = useRef(null);

  // Path geometry for the selected trail
  const selectedGeometry = useMemo(() => {
    if (!selectedTrailId) return null;
    return getTrailGeometry(selectedTrailId);
  }, [selectedTrailId]);

  // Trail start points as a GeoJSON FeatureCollection
  const trailsGeoJSON = useMemo(
    () => ({
      type: "FeatureCollection",
      features: trailsData.map((trail) => ({
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
    []
  );

  // Tapping a marker selects the trail, shows its path, and fits the camera
  const handleTrailPress = (event) => {
    const features = event?.features || event?.nativeEvent?.features;
    if (!features || features.length === 0) return;

    const id = features[0].properties.id;
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

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Map style={styles.map} mapStyle={MAP_STYLE_URL}>
        <Camera ref={cameraRef} initialViewState={INITIAL_VIEW_STATE} />

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});