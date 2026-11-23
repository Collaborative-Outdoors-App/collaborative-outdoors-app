import { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { calculateTrailProgress } from "../utils/trailProgress";

/**
 * Renders a progress bar measuring how close the user is to the end of a linear trail.
 * 0% = at start, 100% = at end.
 *
 * For linear trails only; returns null for non-linear trails.
 */
export default function TrailProgressBar({
  trail,
  userPosition,
  compact = false,
  style,
}) {
  const progress = useMemo(() => {
    return calculateTrailProgress(trail, userPosition);
  }, [
    trail,
    userPosition?.latitude,
    userPosition?.longitude,
    userPosition?.lat,
    userPosition?.lon,
  ]);

  if (!trail?.linear || !progress) {
    return null;
  }

  const { progressPercent, distanceToEndKm } = progress;

  if (compact) {
    return (
      <View style={[styles.compactContainer, style]}>
        <View style={styles.compactHeaderRow}>
          <Text style={styles.compactTitle}>Trail Progress</Text>
          <Text style={styles.compactPercent}>{progressPercent}%</Text>
        </View>
        <View style={styles.compactTrack}>
          <View
            style={[
              styles.compactFill,
              { width: `${Math.max(0, Math.min(100, progressPercent))}%` },
            ]}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.headerRow}>
        <View style={styles.leftHeader}>
          <Text style={styles.title}>Trail Progress</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Linear Trail</Text>
          </View>
        </View>
        <Text style={styles.percentText}>{progressPercent}%</Text>
      </View>

      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${Math.max(0, Math.min(100, progressPercent))}%` },
          ]}
        />
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.footerLabel}>Start (0%)</Text>
        <Text style={styles.footerRemaining}>
          {distanceToEndKm <= 0.05
            ? "🎉 End reached!"
            : `${distanceToEndKm} km to end`}
        </Text>
        <Text style={styles.footerLabel}>End (100%)</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  leftHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
  },
  badge: {
    backgroundColor: "#dcfce7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    color: "#15803d",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  percentText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#2F5D46",
  },
  track: {
    height: 9,
    backgroundColor: "#e2e8f0",
    borderRadius: 5,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    backgroundColor: "#2F5D46",
    borderRadius: 5,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  footerLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748b",
  },
  footerRemaining: {
    fontSize: 11,
    fontWeight: "600",
    color: "#2F5D46",
  },
  compactContainer: {
    width: "100%",
  },
  compactHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  compactTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ffffff",
    opacity: 0.9,
  },
  compactPercent: {
    fontSize: 12,
    fontWeight: "800",
    color: "#ffffff",
  },
  compactTrack: {
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: 2,
    overflow: "hidden",
  },
  compactFill: {
    height: "100%",
    backgroundColor: "#4ade80",
    borderRadius: 2,
  },
});
