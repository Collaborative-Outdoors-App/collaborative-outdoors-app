import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, common } from '../styles/theme';
import { CURRENT_USER as currentUserData } from '../constants/currentUser';

const currentUser = currentUserData.currentUser;

function Radio({ label, selected, onSelect }) {
  return (
    <Pressable onPress={onSelect} accessibilityRole="radio" accessibilityState={{ selected }} style={styles.radioRow}>
      <View style={[styles.radio, selected && styles.radioOn]}>{selected ? <View style={styles.dot} /> : null}</View>
      <Text style={styles.radioLabel}>{label}</Text>
    </Pressable>
  );
}

export default function MFASettings() {
  const [enabled, setEnabled] = useState(currentUser.twoStepEnabled);

  return (
    <ScrollView style={common.screen} contentContainerStyle={[common.content, styles.center]}>
      <Text style={styles.heading}>Connected Verification Methods</Text>

      <View style={[common.card, styles.method]}>
        <Text style={styles.methodLabel}>Number</Text>
        <Text style={styles.methodValue}>{currentUser.mfa.phoneNumber}</Text>
      </View>

      <View style={[common.card, styles.method]}>
        <Text style={styles.methodLabel}>Google Authenticator</Text>
        <View style={styles.qr}><Text style={styles.qrText}>QR</Text></View>
        <Text style={styles.key}>{currentUser.mfa.authenticatorKey}</Text>
        <View style={styles.track}><View style={styles.fill} /></View>
        <Text style={styles.small}>refreshes in 30 seconds</Text>
      </View>

      <View style={styles.radios}>
        <Radio label="Enable MFA" selected={enabled} onSelect={() => setEnabled(true)} />
        <Radio label="Disable MFA" selected={!enabled} onSelect={() => setEnabled(false)} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'stretch' },
  heading: { fontSize: 18, fontWeight: '700', color: colors.ink, textAlign: 'center' },
  method: { alignItems: 'center', gap: 10 },
  methodLabel: { fontSize: 13, fontWeight: '600', color: colors.stone },
  methodValue: { fontSize: 18, fontWeight: '600', color: colors.ink },
  qr: { width: 140, height: 140, borderRadius: 12, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  qrText: { fontSize: 28, fontWeight: '700', color: colors.stone },
  key: { fontSize: 15, letterSpacing: 1, color: colors.ink },
  track: { alignSelf: 'stretch', height: 8, borderRadius: 4, backgroundColor: colors.line, overflow: 'hidden' },
  fill: { width: '60%', height: '100%', backgroundColor: colors.primary },
  small: { fontSize: 13, color: colors.stone },
  radios: { gap: 14, paddingHorizontal: 8 },
  radioRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: colors.stone, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: colors.primary },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary },
  radioLabel: { fontSize: 15, color: colors.ink },
});