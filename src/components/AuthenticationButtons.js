import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../styles/theme';

const variants = {
  primary: { bg: colors.primary, fg: '#FFFFFF', border: colors.primary },
  secondary: { bg: colors.surface, fg: colors.ink, border: '#D5D2C7' },
  danger: { bg: colors.danger, fg: '#FFFFFF', border: colors.danger },
  ghost: { bg: 'transparent', fg: colors.stone, border: 'transparent' },
};

export default function ActionButton({ title, onPress, variant = 'primary', loading = false, disabled = false, style }) {
  const v = variants[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={loading || disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: v.bg, borderColor: v.border },
        (pressed || loading || disabled) && styles.dim,
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={v.fg} /> : <Text style={[styles.text, { color: v.fg }]}>{title}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { height: 52, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  dim: { opacity: 0.6 },
  text: { fontSize: 16, fontWeight: '600' },
});
