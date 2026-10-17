import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function TrailDetailsPanel({ trail, onClose, onStartHike }) {
  if (!trail) return null;

  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.title} numberOfLines={1}>{trail.name}</Text>
          {trail.lengthKm ? <Text style={styles.subtitle}>{trail.lengthKm} km</Text> : null}
        </View>
        <TouchableOpacity style={{ padding: 4 }} onPress={onClose}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <TouchableOpacity style={[styles.btn, styles.primaryBtn]} onPress={onStartHike}>
          <Text style={[styles.btnText, { color: "#fff" }]}>Start</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.secondaryBtn]}>
          <Text style={[styles.btnText, { color: "#334155" }]}>Download Offline Map</Text>
        </TouchableOpacity>
      </View>
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
    alignItems: "flex-start",
    marginBottom: 12,
  },
  title: { fontSize: 18, fontWeight: "bold", color: "#0f172a" },
  subtitle: { fontSize: 14, color: "#64748b", marginTop: 2 },
  closeText: { fontSize: 18, color: "#64748b", fontWeight: "bold" },
  row: { flexDirection: "row", gap: 8 },
  btn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  btnText: { fontWeight: "600" },
  primaryBtn: { backgroundColor: "#2F5D46" },
  secondaryBtn: { backgroundColor: "#f1f5f9ff", borderWidth: 1, borderColor: "#cbd5e1" },
});
