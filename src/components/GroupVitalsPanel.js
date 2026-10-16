import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";

const INITIAL_MEMBERS = [
  { id: "u1", code: "M1", name: "Member 1 (You)", bpm: 118, condition: "Normal" },
  { id: "u2", code: "M2", name: "Member 2", bpm: 112, condition: "Normal" },
  { id: "u3", code: "M3", name: "Member 3", bpm: 154, condition: "Overexerted" },
  { id: "u4", code: "M4", name: "Member 4", bpm: 98, condition: "Normal" },
  { id: "u5", code: "M5", name: "Member 5", bpm: 108, condition: "Normal" },
];

export default function GroupVitalsPanel({ onMinimize }) {
  const [members, setMembers] = useState(INITIAL_MEMBERS);

  useEffect(() => {
    const interval = setInterval(() => {
      setMembers((prev) =>
        prev.map((m) => {
          const delta = Math.floor(Math.random() * 3) - 1;
          const newBpm = Math.max(80, Math.min(150, m.bpm + delta));
          return { ...m, bpm: newBpm };
        })
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.statusDot}>
            ● <Text style={styles.statusText}>Live Vitals</Text>
          </Text>
          <Text style={styles.panelTitle}>Group Members ({members.length})</Text>
        </View>
        <TouchableOpacity style={styles.toggleButton} onPress={onMinimize}>
          <Text style={styles.toggleText}>▼ Minimize</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {members.map((member) => (
          <View key={member.id} style={styles.card}>
            <View style={styles.leftSection}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{member.code}</Text>
              </View>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.heartRate}>Heart rate {member.bpm} bpm</Text>
              </View>
            </View>
            <Text style={styles.condition}>{member.condition}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
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
    marginBottom: 12,
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
  panelTitle: {
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
  list: {
    maxHeight: 210,
  },
  listContent: {
    gap: 8,
    paddingBottom: 4,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#E2ECE6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E3F30",
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  heartRate: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 2,
  },
  condition: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E3F30",
    marginLeft: 12,
  },
});
