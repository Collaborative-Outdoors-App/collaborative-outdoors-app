import { View, TouchableOpacity, StyleSheet } from "react-native";

export default function LocationButton({ onPress, style }) {
  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityLabel="Zoom to current location"
    >
      <View style={styles.iconCircle}>
        <View style={styles.iconDot} />
        <View style={[styles.tick, styles.tickTop]} />
        <View style={[styles.tick, styles.tickBottom]} />
        <View style={[styles.tick, styles.tickLeft]} />
        <View style={[styles.tick, styles.tickRight]} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    right: 16,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  iconCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
  },
  iconDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#2563eb",
  },
  tick: {
    position: "absolute",
    backgroundColor: "#2563eb",
  },
  tickTop: {
    top: -4,
    width: 2,
    height: 3,
  },
  tickBottom: {
    bottom: -4,
    width: 2,
    height: 3,
  },
  tickLeft: {
    left: -4,
    width: 3,
    height: 2,
  },
  tickRight: {
    right: -4,
    width: 3,
    height: 2,
  },
});
