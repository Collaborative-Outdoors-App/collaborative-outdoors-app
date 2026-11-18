import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, common } from '../styles/theme';

const STEPS = ['Searching for your device…', 'Pairing…', 'Reading heart rate…'];

export default function ConnectingView({ via, onCancel }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <View style={[common.screen, styles.wrap]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.title}>Connecting to {via}</Text>
      <Text style={styles.step}>{STEPS[step]}</Text>
      <Pressable onPress={onCancel} style={styles.cancel}>
        <Text style={styles.cancelText}>Cancel</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 20, fontWeight: '700', color: colors.ink, marginTop: 24 },
  step: { fontSize: 15, color: colors.stone, marginTop: 8 },
  cancel: { marginTop: 32, padding: 12 },
  cancelText: { fontSize: 16, color: colors.stone, textDecorationLine: 'underline' },
});