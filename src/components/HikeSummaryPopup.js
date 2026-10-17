import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";

const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};

export default function HikeSummaryPopup({
  visible,
  trail,
  seconds = 0,
  distanceKm = 0, // placeholder until distance tracking exists
  onReturnHome,
}) {
  const stats = [
    { label: "Time Elapsed", value: formatTime(seconds) },
    { label: "Distance Travelled", value: `${distanceKm.toFixed(2)} km` },
    { label: "Trail Length", value: trail?.lengthKm ? `${trail.lengthKm} km` : "--" },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.emoji}>🏁</Text>
          <Text style={styles.title}>Hike Complete!</Text>
          <Text style={styles.trailName} numberOfLines={2}>
            {trail?.name || "Your Hike"}
          </Text>

          <View style={styles.statsList}>
            {stats.map(({ label, value }) => (
              <View key={label} style={styles.statRow}>
                <Text style={styles.statLabel}>{label}</Text>
                <Text style={styles.statValue}>{value}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.homeBtn} onPress={onReturnHome}>
            <Text style={styles.homeBtnText}>Return to home</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  emoji: { fontSize: 40, marginBottom: 4 },
  title: { fontSize: 22, fontWeight: "bold", color: "#0f172a" },
  trailName: { fontSize: 14, color: "#64748b", marginTop: 4, textAlign: "center" },
  statsList: { width: "100%", marginVertical: 20, gap: 8 },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  statLabel: { fontSize: 13, color: "#64748b" },
  statValue: { fontSize: 16, fontWeight: "bold", color: "#0f172a" },
  homeBtn: {
    width: "100%",
    backgroundColor: "#2F5D46",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  homeBtnText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
});