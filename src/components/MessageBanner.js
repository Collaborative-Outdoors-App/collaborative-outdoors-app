import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../styles/theme';

const tones = {
  error: { bg: colors.dangerSoft, fg: colors.danger },
  success: { bg: colors.primarySoft, fg: colors.primary },
  warning: { bg: colors.warningSoft, fg: colors.warningInk },
  info: { bg: '#EFEDE6', fg: colors.ink },
};

export default function Banner({ type = 'info', title, text }) {
  const tone = tones[type];
  return (
    <View style={[styles.box, { backgroundColor: tone.bg }]} accessibilityRole="alert">
      {title ? <Text style={[styles.title, { color: tone.fg }]}>{title}</Text> : null}
      {text ? <Text style={[styles.text, { color: tone.fg }]}>{text}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { padding: 14, borderRadius: 14, gap: 2 },
  title: { fontSize: 15, fontWeight: '700' },
  text: { fontSize: 14, lineHeight: 20 },
});