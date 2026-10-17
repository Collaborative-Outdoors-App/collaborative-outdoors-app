import { useState, useMemo } from "react";
import { View, TextInput, Text, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import trailsData from "../constants/trails/trails.json";

export default function TrailSearchBar({ onSelectTrail, trails = trailsData }) {
  const [query, setQuery] = useState("");

  const filteredTrails = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? trails.filter((t) => t.name.toLowerCase().includes(q)) : [];
  }, [query, trails]);

  const handleSelect = (trailId) => {
    setQuery("");
    onSelectTrail(trailId);
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Search trails..."
        placeholderTextColor="#94a3b8"
        value={query}
        onChangeText={setQuery}
      />
      {filteredTrails.length > 0 && (
        <FlatList
          style={styles.dropdown}
          data={filteredTrails}
          keyExtractor={(item) => String(item.trailId)}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.item} onPress={() => handleSelect(item.trailId)}>
              <Text style={styles.itemText}>{item.name}</Text>
              {item.lengthKm ? <Text style={styles.itemSubtext}>{item.lengthKm} km</Text> : null}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const shadow = {
  backgroundColor: "#fff",
  borderRadius: 8,
  elevation: 4,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
};

const styles = StyleSheet.create({
  container: { position: "absolute", top: 50, left: 16, right: 16, zIndex: 10 },
  input: { ...shadow, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16, color: "#0f172a" },
  dropdown: { ...shadow, marginTop: 4, maxHeight: 200 },
  item: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e2e8f0",
  },
  itemText: { fontSize: 15, color: "#0f172a", fontWeight: "500" },
  itemSubtext: { fontSize: 12, color: "#64748b", marginTop: 2 },
});
