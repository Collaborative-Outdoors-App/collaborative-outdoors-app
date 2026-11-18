import { ScrollView, StyleSheet, Text, View } from 'react-native';
import AuthenticationButtons from '../components/AuthenticationButtons';
import { colors, common } from '../styles/theme';
import { useCurrentUser } from '../auth/useCurrentUser';

function Row({ label, value, last }) {
  return (
    <View style={[styles.row, !last && styles.rowDivider]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export default function EmergencyNotifiedScreen({ navigation, route }) {
  const me = useCurrentUser();
  const params = route.params ?? {};
  const contact = params.contact ?? me.emergencyContact;
  const bpm = params.bpm;

  return (
    <ScrollView style={common.screen} contentContainerStyle={[common.content, styles.center]}>
      <View style={styles.circle}>
        <Text style={styles.check}>✓</Text>
      </View>

      <Text style={styles.title}>Emergency Contact Notified</Text>
      <Text style={styles.text}>
        {contact
          ? `We sent a message to ${contact.name} about ${me.firstName || 'your'} high heart rate.`
          : 'You have no emergency contact on file.'}
      </Text>

      {contact ? (
        <View style={[common.card, styles.card]}>
          <Row label="Contact" value={contact.name} />
          {contact.relationship ? <Row label="Relationship" value={contact.relationship} /> : null}
          <Row label="Sent" value="Just now" />
          <Row label="Includes" value={bpm ? `Heart rate (${bpm} bpm)` : 'Heart rate'} last />
        </View>
      ) : null}

      <View style={styles.actions}>
        <AuthenticationButtons title="Back to Wearable Setup" onPress={() => navigation.navigate('ConnectWearable')} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center' },
  circle: { width: 110, height: 110, borderRadius: 55, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  check: { fontSize: 52, color: '#FFFFFF' },
  title: { fontSize: 22, fontWeight: '700', color: colors.ink, textAlign: 'center' },
  text: { fontSize: 16, lineHeight: 24, color: colors.stone, textAlign: 'center' },
  card: { alignSelf: 'stretch', padding: 0, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 16 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.line },
  label: { fontSize: 15, color: colors.stone },
  value: { fontSize: 15, fontWeight: '600', color: colors.ink },
  actions: { alignSelf: 'stretch' },
});