import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function HikeActivityPanel({ trail, onEndHike, onMinimize }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  const stats = [
    { label: "Time Elapsed", value: timeStr },
    { label: "Distance", value: "0.00 km" },
    { label: "Trail Length", value: trail?.lengthKm ? `${trail.lengthKm} km` : "--" },
  ];

  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.statusDot}>● <Text style={styles.statusText}>Hike Active</Text></Text>
          <Text style={styles.trailName} numberOfLines={1}>{trail?.name || "Active Trail"}</Text>
        </View>
        <TouchableOpacity style={styles.toggleBtn} onPress={onMinimize}>
          <Text style={styles.toggleText}>▼ Minimize</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        {stats.map(({ label, value }) => (
          <View key={label} style={styles.statBox}>
            <Text style={styles.statLabel}>{label}</Text>
            <Text style={styles.statValue}>{value}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.endBtn} onPress={onEndHike}>
        <Text style={styles.endBtnText}>End Hike</Text>
      </TouchableOpacity>
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
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statusDot: { color: "#16a34a", fontSize: 12, fontWeight: "bold" },
  statusText: { color: "#16a34a", fontSize: 12, fontWeight: "600", textTransform: "uppercase" },
  trailName: { fontSize: 17, fontWeight: "bold", color: "#0f172a", marginTop: 2 },
  toggleBtn: { paddingVertical: 6, paddingHorizontal: 10, backgroundColor: "#f1f5f9", borderRadius: 6 },
  toggleText: { fontSize: 12, color: "#475569", fontWeight: "600" },
  statsRow: { flexDirection: "row", gap: 8, marginVertical: 14 },
  statBox: {
    flex: 1,
    backgroundColor: "#f8fafc",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  statLabel: { fontSize: 11, color: "#64748b", marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: "bold", color: "#0f172a" },
  endBtn: { backgroundColor: "#ef4444", paddingVertical: 12, borderRadius: 8, alignItems: "center" },
  endBtnText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
});
