import { StyleSheet } from 'react-native';

export const colors = {
  primary: '#2F5D46',
  primarySoft: '#E3EDE6',
  canvas: '#F6F5F0',
  surface: '#FFFFFF',
  ink: '#1B2420',
  stone: '#5E6863',
  line: '#E4E2DA',
  warning: '#C9822B',
  warningSoft: '#FBF0DF',
  warningInk: '#8A4E0B',
  danger: '#B5402F',
  dangerSoft: '#FBE7E3',
};

export const statusStyles = {
  normal: { label: 'Normal', bg: colors.primarySoft, fg: colors.primary },
  elevated: { label: 'Elevated', bg: colors.warningSoft, fg: colors.warningInk },
  off: { label: 'Off', bg: '#EFEDE6', fg: colors.stone },
};

export const mineHeader = {
  headerStyle: { backgroundColor: colors.canvas },
  headerShadowVisible: false,
  headerTintColor: colors.ink,
  headerTitleStyle: { fontWeight: '600' },
  headerBackButtonDisplayMode: 'minimal',
};

export const common = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: 24, paddingBottom: 40, gap: 16 },
  title: { fontSize: 28, fontWeight: '700', color: colors.ink },
  subtitle: { fontSize: 16, lineHeight: 24, color: colors.stone },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 20,
    padding: 16,
  },
  label: { fontSize: 13, fontWeight: '600', color: colors.stone },
  section: { marginTop: 12, fontSize: 13, fontWeight: '600', letterSpacing: 0.8, color: colors.stone },
  linkText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  demoText: { fontSize: 13, color: colors.stone, textDecorationLine: 'underline', textAlign: 'center' },
  center: { alignItems: 'center' },
});
