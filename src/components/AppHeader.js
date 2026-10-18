// src/components/AppHeader.js
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AppHeader({ navigation, back }) {
  const insets = useSafeAreaInsets();

  if (!back) return null; // nothing to show on the first screen

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <Pressable
        onPress={navigation.goBack}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        style={styles.backButton}
      >
        <Text style={styles.backText}>‹</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  backText: {
    color: '#2F5D46',
    fontSize: 30,
    lineHeight: 32,
    marginTop: -2,
    marginRight: 2,
  },
});