import { useMemo } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useCurrentUser } from "../auth/useCurrentUser";
import { CURRENT_USER } from "../constants/currentUser";
import { parseDob, ageFromDob } from "../utils/age";

const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};

/**
 * Calculates estimated calories burned during a hike based on distance, age, and weight.
 *
 * @param {Object} params
 * @param {number} params.distanceKm - Distance travelled in kilometers
 * @param {number} params.age - User's age in years
 * @param {number} params.weightKg - User's weight in kilograms
 * @returns {number} Estimated calories burned (kcal)
 */
export function calculateCaloriesBurned({ distanceKm = 0, age = 30, weightKg = 70 }) {
  const safeDistance = typeof distanceKm === "number" && !isNaN(distanceKm) && distanceKm > 0 ? distanceKm : 0;
  const safeWeight = typeof weightKg === "number" && !isNaN(weightKg) && weightKg > 0 ? weightKg : 70;
  const safeAge = typeof age === "number" && !isNaN(age) && age > 0 ? age : 30;

  if (safeDistance === 0) return 0;

  // Base hiking energy cost (~0.95 kcal/kg/km on outdoor trail terrain)
  // Age factor accounts for metabolic changes over time (~0.2% per year from baseline age 20)
  const ageFactor = Math.max(0.8, Math.min(1.15, 1.0 - (safeAge - 20) * 0.002));
  const calories = safeDistance * safeWeight * 0.95 * ageFactor;

  return Math.round(calories);
}

export default function HikeSummaryPopup({
  visible,
  trail,
  seconds = 0,
  distanceKm = 0,
  caloriesBurned,
  age: propAge,
  weight: propWeight,
  weightKg: propWeightKg,
  isCheckingAchievements = false,
  checkingAchievements = false,
  disabled = false,
  onReturnHome,
}) {
  const isChecking = isCheckingAchievements || checkingAchievements || disabled;
  const me = useCurrentUser();

  // Resolve user weight (prop -> auth profile -> mock user -> standard default)
  const userWeight =
    propWeightKg ??
    propWeight ??
    me?.weightKg ??
    CURRENT_USER?.currentUser?.weightKg ??
    70;

  // Resolve user age (prop -> auth profile DOB -> mock user DOB -> default 30)
  const resolvedAge = useMemo(() => {
    if (typeof propAge === "number" && !isNaN(propAge) && propAge > 0) return propAge;
    const dobString = me?.dateOfBirth || CURRENT_USER?.currentUser?.dateOfBirth;
    if (dobString) {
      const parsed = parseDob(dobString);
      if (parsed) return ageFromDob(parsed);
    }
    return 30;
  }, [propAge, me?.dateOfBirth]);

  const estimatedCalories = useMemo(() => {
    if (typeof caloriesBurned === "number" && !isNaN(caloriesBurned)) {
      return caloriesBurned;
    }
    return calculateCaloriesBurned({
      distanceKm,
      age: resolvedAge,
      weightKg: userWeight,
    });
  }, [caloriesBurned, distanceKm, resolvedAge, userWeight]);

  const safeDistance = typeof distanceKm === "number" && !isNaN(distanceKm) ? distanceKm : 0;
  const stats = [
    { label: "Time Elapsed", value: formatTime(seconds) },
    { label: "Distance Travelled", value: `${safeDistance.toFixed(2)} km` },
    { label: "Trail Length", value: trail?.lengthKm ? `${trail.lengthKm} km` : "--" },
    {
      label: "Estimated Calories Burned",
      value: `${estimatedCalories} kcal`,
    },
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

          <TouchableOpacity
            style={[styles.homeBtn, isChecking && styles.homeBtnDisabled]}
            onPress={onReturnHome}
            disabled={isChecking}
            activeOpacity={0.8}
          >
            {isChecking ? (
              <View style={styles.btnLoadingRow}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.homeBtnText}>Checking achievements...</Text>
              </View>
            ) : (
              <Text style={styles.homeBtnText}>Return to home</Text>
            )}
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
    justifyContent: "center",
  },
  homeBtnDisabled: {
    backgroundColor: "#94a3b8",
    opacity: 0.85,
  },
  btnLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  homeBtnText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
});