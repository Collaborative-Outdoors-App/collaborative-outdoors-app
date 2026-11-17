import { useMemo } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { ACHIEVEMENT_DATA } from "../constants/currentUser";

const GREEN = "#2F5D46";
const GOLD = "#F59E0B";

export default function AchievementUnlockedPopup({
  visible,
  achievement,
  currentIndex = 1,
  totalCount = 1,
  onDismiss,
}) {
  const resolved = useMemo(() => {
    if (!achievement) return null;

    const id = typeof achievement === "string" ? achievement : achievement.id;
    const matched = ACHIEVEMENT_DATA.find((a) => a.id === id);

    const name =
      (typeof achievement === "object" && achievement.name) ||
      matched?.name ||
      (id ? id.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "New Achievement");

    const description =
      (typeof achievement === "object" && achievement.description) ||
      matched?.description ||
      "Congratulations on unlocking a new milestone!";

    const requirement =
      (typeof achievement === "object" && achievement.requirement) ||
      matched?.requirement ||
      null;

    return { id, name, description, requirement };
  }, [achievement]);

  if (!visible || !resolved) return null;

  const hasNext = currentIndex < totalCount;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Top queue badge if multiple achievements */}
          {totalCount > 1 && (
            <View style={styles.queuePill}>
              <Text style={styles.queueText}>
                {currentIndex} of {totalCount}
              </Text>
            </View>
          )}

          {/* Celebration Trophy Icon */}
          <View style={styles.iconContainer}>
            <Text style={styles.trophyEmoji}>🏆</Text>
          </View>

          {/* Badge Label */}
          <Text style={styles.badgeLabel}>ACHIEVEMENT UNLOCKED!</Text>

          {/* Achievement Name */}
          <Text style={styles.title} numberOfLines={2}>
            {resolved.name}
          </Text>

          {/* Description */}
          <Text style={styles.description}>{resolved.description}</Text>

          {/* Action button */}
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.85} onPress={onDismiss}>
            <Text style={styles.actionBtnText}>
              {hasNext ? "Next Achievement →" : "Close"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    zIndex: 9999,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(245, 158, 11, 0.25)",
  },
  queuePill: {
    position: "absolute",
    top: 14,
    right: 16,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  queueText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#B45309",
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#FDE68A",
  },
  trophyEmoji: {
    fontSize: 42,
  },
  badgeLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: GOLD,
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 16,
  },
  milestoneTag: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 20,
  },
  milestoneText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },
  actionBtn: {
    width: "100%",
    backgroundColor: GREEN,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 16,
  },
});

