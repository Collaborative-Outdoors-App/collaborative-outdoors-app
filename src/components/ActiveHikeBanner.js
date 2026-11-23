import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useActiveHike } from "../context/ActiveHikeContext";
import { navigationRef } from "../utils/navigationRef";

const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};

export default function ActiveHikeBanner() {
  const { hikeActive, hikeTrail, hikeSeconds, hikeDistanceKm } = useActiveHike();
  const [currentRoute, setCurrentRoute] = useState("");
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const updateRoute = () => {
      if (navigationRef.isReady()) {
        const route = navigationRef.getCurrentRoute();
        setCurrentRoute(route?.name || "");
      }
    };

    updateRoute();
    const unsubscribe = navigationRef.addListener("state", updateRoute);
    return unsubscribe;
  }, []);

  // Hide banner if no hike is active or if user is already on TrailSearch screen
  if (!hikeActive || currentRoute === "TrailSearch") {
    return null;
  }

  const handlePress = () => {
    if (navigationRef.isReady()) {
      navigationRef.navigate("TrailSearch");
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handlePress}
      style={[styles.banner, { top: insets.top + 6 }]}
      accessibilityRole="button"
      accessibilityLabel={`Active hike in progress: ${hikeTrail?.name || "Trail"}. Tap to return.`}
    >
      <View style={styles.left}>
        <View style={styles.dot} />
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {hikeTrail?.name || "Active Hike"}
          </Text>
          <Text style={styles.stats}>
            ⏱ {formatTime(hikeSeconds)}  •  📍 {hikeDistanceKm.toFixed(2)} km
          </Text>
        </View>
      </View>
      <View style={styles.resumePill}>
        <Text style={styles.resumeText}>Resume ›</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    left: 14,
    right: 14,
    zIndex: 999,
    backgroundColor: "#2F5D46",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  left: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#4ade80",
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
  stats: {
    fontSize: 12,
    color: "#e2e8f0",
    marginTop: 2,
    fontWeight: "500",
  },
  resumePill: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  resumeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
  },
});
