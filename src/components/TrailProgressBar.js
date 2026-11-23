import { useMemo, useRef } from "react";
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
  distanceKm = 0,
  compact = false,
  style,
}) {
  const displayPercentRef = useRef(0);
  const lastTrailIdRef = useRef(trail?.trailId || trail?.id);

  const trailId = trail?.trailId || trail?.id;
  if (lastTrailIdRef.current !== trailId) {
    lastTrailIdRef.current = trailId;
    displayPercentRef.current = 0;
  }

  const userLat =
    userPosition?.latitude ?? userPosition?.lat ?? userPosition?.coords?.latitude;
  const userLon =
    userPosition?.longitude ?? userPosition?.lon ?? userPosition?.coords?.longitude;

  const normalizedUserPos = useMemo(() => {
    if (userLat == null || userLon == null) return null;
    return { latitude: userLat, longitude: userLon };
  }, [userLat, userLon]);

  const progress = useMemo(() => {
    return calculateTrailProgress(trail, normalizedUserPos);
  }, [trail, normalizedUserPos]);

  if (!trail?.linear) {
    return null;
  }

  const lengthKm = trail?.lengthKm || 0;
  const safeDistance =
    typeof distanceKm === "number" && !isNaN(distanceKm) && distanceKm > 0
      ? distanceKm
      : 0;

  // Determine raw percentage: use projection if available, otherwise distance-based fallback
  const rawPercent =
    progress && normalizedUserPos
      ? progress.progressPercent
      : lengthKm > 0
      ? Math.min(100, Math.round((safeDistance / lengthKm) * 100))
      : 0;

  // Anti-flicker smoothing:
  // - Immediately advance forward as the user makes progress along the trail.
  // - Absorb minor GPS horizontal jitter (1-3%) so progress doesn't decrease or bounce.
  // - Allow downward adjustment only if user genuinely retreats (> 4% backwards).
  if (rawPercent > displayPercentRef.current) {
    displayPercentRef.current = rawPercent;
  } else if (rawPercent < displayPercentRef.current - 4) {
    displayPercentRef.current = rawPercent;
  }

  const progressPercent = Math.min(100, Math.max(0, displayPercentRef.current));

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
        <Text style={styles.title}>Trail Progress</Text>
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
  title: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
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
