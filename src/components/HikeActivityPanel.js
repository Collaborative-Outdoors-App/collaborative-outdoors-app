import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function HikeActivityPanel({ trail, onEndHike }) {
  const [seconds, setSeconds] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const distanceKm = 0;

  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.statusDot}>● <Text style={styles.statusText}>Hike Active</Text></Text>
          <Text style={styles.trailName} numberOfLines={1}>{trail?.name || "Active Trail"}</Text>
        </View>
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setIsCollapsed(!isCollapsed)}
        >
          <Text style={styles.toggleText}>{isCollapsed ? "▲ Expand" : "▼ Minimize"}</Text>
        </TouchableOpacity>
      </View>

      {isCollapsed ? (
        <View style={styles.collapsedRow}>
          <Text style={styles.collapsedStat}>⏱ {formatTime(seconds)}</Text>
          <Text style={styles.collapsedStat}>📍 {distanceKm.toFixed(2)} km</Text>
        </View>
      ) : (
        <View style={styles.body}>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Time Elapsed</Text>
              <Text style={styles.statValue}>{formatTime(seconds)}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Distance</Text>
              <Text style={styles.statValue}>{distanceKm.toFixed(2)} km</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Trail Length</Text>
              <Text style={styles.statValue}>{trail?.lengthKm ? `${trail.lengthKm} km` : "--"}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.endButton} onPress={onEndHike}>
            <Text style={styles.endButtonText}>End Hike</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  statusDot: {
    color: "#16a34a",
    fontSize: 12,
    fontWeight: "bold",
  },
  statusText: {
    color: "#16a34a",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  trailName: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#0f172a",
    marginTop: 2,
  },
  toggleButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#f1f5f9",
    borderRadius: 6,
  },
  toggleText: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "600",
  },
  collapsedRow: {
    flexDirection: "row",
    gap: 20,
    marginTop: 8,
  },
  collapsedStat: {
    fontSize: 14,
    color: "#334155",
    fontWeight: "600",
  },
  body: {
    marginTop: 14,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#f8fafc",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 11,
    color: "#64748b",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0f172a",
  },
  endButton: {
    backgroundColor: "#ef4444",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  endButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
});
