import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import AuthenticationButtons from '../components/AuthenticationButtons';
import { colors, common } from '../styles/theme';
import { useCurrentUser } from '../auth/useCurrentUser';
import { useWearable } from '../wearable/WearableContext';
import { notifyOverexertion } from '../wearable/Notify';

const COUNTDOWN_SEC = 30;

export default function OverexertionAlertScreen({ navigation, route }) {
  const me = useCurrentUser();
  const { bpm: liveBpm, maxHr } = useWearable();
  const params = route.params ?? {};

  const bpm = params.bpm ?? liveBpm;
  const pctOfMax =
    params.pctOfMax ?? (bpm && maxHr ? Math.round((bpm / maxHr) * 100) : null);
  const contact = me.emergencyContact;
  const hasContact = !!contact?.phone;

  const [left, setLeft] = useState(COUNTDOWN_SEC);
  const doneRef = useRef(false);

  const notifyNow = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    notifyOverexertion({ bpm, maxHr, pctOfMax });
    navigation.replace('EmergencyNotified', { contact, bpm });
  };

  useEffect(() => {
    const id = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (left <= 0 && hasContact) notifyNow();
  }, [left]);

  const imOk = () => {
    doneRef.current = true;
    navigation.goBack();
  };

  return (
    <ScrollView style={common.screen} contentContainerStyle={[common.content, styles.center]}>
      <View style={styles.circle}>
        <Text style={styles.symbol}>!</Text>
      </View>

      <Text style={styles.title}>Your heart rate is high</Text>
      <Text style={styles.text}>
        {bpm ?? '--'} bpm is {pctOfMax ?? '--'}% of your max. Slow down and rest.
      </Text>

      {hasContact ? (
        <Text style={styles.text}>
          {left > 0
            ? `Notifying ${contact.name} in ${left}s unless you tap "I'm OK".`
            : `Notifying ${contact.name}...`}
        </Text>
      ) : (
        <Text style={styles.text}>No emergency contact on file. Add one in your profile.</Text>
      )}

      <View style={styles.actions}>
        <AuthenticationButtons title="I'm OK" onPress={imOk} />
        {hasContact ? (
          <AuthenticationButtons
            title="Notify Emergency Contact Now"
            variant="secondary"
            onPress={notifyNow}
          />
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center' },
  circle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: colors.danger ?? '#C0392B',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  symbol: { fontSize: 56, fontWeight: '700', color: '#FFFFFF' },
  title: { fontSize: 22, fontWeight: '700', color: colors.ink, textAlign: 'center' },
  text: { fontSize: 16, lineHeight: 24, color: colors.stone, textAlign: 'center' },
  actions: { alignSelf: 'stretch', gap: 12, marginTop: 12 },
});