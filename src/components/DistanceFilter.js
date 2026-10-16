import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

const OPTIONS = [
  { id: "all", label: "All Distances" },
  { id: "short", label: "< 2 km", max: 2 },
  { id: "medium", label: "2 - 5 km", min: 2, max: 5 },
  { id: "long", label: "> 5 km", min: 5 },
];

export default function DistanceFilter({ onFilterChange }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(OPTIONS[0]);

  const handleSelect = (opt) => {
    setSelected(opt);
    setOpen(false);
    onFilterChange(opt);
  };

  const isFiltered = selected.id !== "all";

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.btn, isFiltered && styles.btnActive]}
        onPress={() => setOpen((prev) => !prev)}
      >
        <Text style={[styles.btnText, isFiltered && styles.btnTextActive]}>
          {selected.label} ▾
        </Text>
      </TouchableOpacity>

      {open && (
        <View style={styles.dropdown}>
          {OPTIONS.map((opt) => {
            const isSel = opt.id === selected.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[styles.opt, isSel && styles.optSelected]}
                onPress={() => handleSelect(opt)}
              >
                <Text style={[styles.optText, isSel && styles.optTextSelected]}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: "absolute", top: 106, left: 16, zIndex: 9 },
  btn: {
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  btnActive: { backgroundColor: "#2563eb" },
  btnText: { fontSize: 13, fontWeight: "600", color: "#334155" },
  btnTextActive: { color: "#fff" },
  dropdown: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginTop: 6,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    overflow: "hidden",
  },
  opt: { paddingVertical: 8, paddingHorizontal: 14 },
  optSelected: { backgroundColor: "#eff6ff" },
  optText: { fontSize: 13, color: "#334155" },
  optTextSelected: { color: "#2563eb", fontWeight: "600" },
});
