import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../styles/theme';

const items = [
  { label: 'Home', route: 'Home' },
  { label: 'Trails', route: 'TrailSearch' },
  { label: 'Groups', route: 'Groups' },
  { label: 'Account', route: 'Profile' },
];

export default function BottomNav({ navigation, active }) {
  return (
    <View style={styles.bar}>
      {items.map((item) => {
        const isActive = item.route === active;
        return (
          <Pressable
            key={item.route}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            onPress={() => !isActive && navigation.replace(item.route)}
            style={styles.item}
          >
            <View style={[styles.indicator, isActive && styles.indicatorOn]} />
            <Text style={[styles.label, isActive && styles.labelOn]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingBottom: 20,
  },
  item: { flex: 1, alignItems: 'center', gap: 8, paddingBottom: 6 },
  indicator: { width: 28, height: 3, borderRadius: 2, backgroundColor: 'transparent' },
  indicatorOn: { backgroundColor: colors.primary },
  label: { fontSize: 13, fontWeight: '500', color: colors.stone },
  labelOn: { fontWeight: '700', color: colors.primary },
});
