import { ScrollView, StyleSheet, Text, View } from 'react-native';
import AuthenticationButtons from '../components/AuthenticationButtons';
import { colors, common } from '../styles/theme';
import { CURRENT_USER as currentUserData } from '../constants/currentUser';
import { GROUPS as groupsData } from '../constants/groups';

const currentUser = currentUserData.currentUser;
const activeGroup = groupsData.groups.find((g) => g.groupId === currentUser.groupIds[0]);
const elevatedMember = activeGroup.members.find((m) => m.status === 'elevated') ?? activeGroup.members[0];

function Row({ label, value, last }) {
  return (
    <View style={[styles.row, !last && styles.rowDivider]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export default function EmergencyNotifiedScreen({ navigation, route }) {
  const member = route.params?.member ?? elevatedMember;
  const contact = member.emergencyContacts?.[0] ?? currentUser.emergencyContacts[0];

  return (
    <ScrollView style={common.screen} contentContainerStyle={[common.content, styles.center]}>
      <View style={styles.circle}>
        <Text style={styles.check}>✓</Text>
      </View>

      <Text style={styles.title}>Emergency Contact Notified</Text>
      <Text style={styles.text}>
        We sent a message to the emergency contact for {member.firstName} {member.lastName}.
      </Text>

      <View style={[common.card, styles.card]}>
        <Row label="Contact" value={`${contact.firstName} ${contact.lastName}`} />
        <Row label="Sent" value="Just now" />
        <Row label="Includes" value="Last Known Location" last />
      </View>

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