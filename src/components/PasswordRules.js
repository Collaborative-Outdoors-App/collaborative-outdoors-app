import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../styles/theme';

export function isPasswordValid(password) {
  return password.length >= 8 && /\d/.test(password) && /[^A-Za-z0-9]/.test(password);
}

export default function PasswordRules({ password }) {
  const rules = [
    { text: 'At least 8 characters', ok: password.length >= 8 },
    { text: 'Contains a number', ok: /\d/.test(password) },
    { text: 'Contains a special character', ok: /[^A-Za-z0-9]/.test(password) },
  ];
  return (
    <View style={styles.list}>
      {rules.map((r) => (
        <Text key={r.text} style={[styles.rule, r.ok && styles.ok]}>
          {r.ok ? '✓' : '○'}  {r.text}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 4 },
  rule: { fontSize: 14, color: colors.stone },
  ok: { color: colors.primary },
});
