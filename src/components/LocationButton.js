import { View, TouchableOpacity, StyleSheet } from "react-native";

export default function LocationButton({ onPress, style }) {
  return (
    <TouchableOpacity
      style={[styles.btn, style]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityLabel="Zoom to current location"
    >
      <View style={styles.circle}>
        <View style={styles.dot} />
        <View style={[styles.tick, { top: -4, width: 2, height: 3 }]} />
        <View style={[styles.tick, { bottom: -4, width: 2, height: 3 }]} />
        <View style={[styles.tick, { left: -4, width: 3, height: 2 }]} />
        <View style={[styles.tick, { right: -4, width: 3, height: 2 }]} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    position: "absolute",
    right: 16,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  circle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#2563eb" },
  tick: { position: "absolute", backgroundColor: "#2563eb" },
});
