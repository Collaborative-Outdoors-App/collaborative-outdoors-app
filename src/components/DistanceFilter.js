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

  const handleSelect = (option) => {
    setSelected(option);
    setOpen(false);
    onFilterChange(option);
  };

  const isFiltered = selected.id !== "all";

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, isFiltered && styles.buttonActive]}
        onPress={() => setOpen(!open)}
      >
        <Text style={[styles.buttonText, isFiltered && styles.buttonTextActive]}>
          {selected.label} ▾
        </Text>
      </TouchableOpacity>

      {open && (
        <View style={styles.dropdown}>
          {OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.id}
              style={[styles.option, opt.id === selected.id && styles.optionSelected]}
              onPress={() => handleSelect(opt)}
            >
              <Text style={[styles.optionText, opt.id === selected.id && styles.optionTextSelected]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 106,
    left: 16,
    zIndex: 9,
  },
  button: {
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
  buttonActive: {
    backgroundColor: "#2563eb",
  },
  buttonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
  },
  buttonTextActive: {
    color: "#fff",
  },
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
  option: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  optionSelected: {
    backgroundColor: "#eff6ff",
  },
  optionText: {
    fontSize: 13,
    color: "#334155",
  },
  optionTextSelected: {
    color: "#2563eb",
    fontWeight: "600",
  },
});
