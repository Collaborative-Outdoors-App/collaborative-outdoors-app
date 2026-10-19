import { ScrollView, StyleSheet, Text, View } from 'react-native';
import AuthenticationButtons from '../components/AuthenticationButtons';
import { colors, common } from '../styles/theme';
import { CURRENT_USER as currentUserData } from '../constants/currentUser';
import { GROUPS as groupsData } from '../constants/groups';

const currentUser = currentUserData.currentUser;
const activeGroup = groupsData.groups.find((g) => g.groupId === currentUser.groupIds[0]);
const elevatedMember = activeGroup.members.find((m) => m.status === 'elevated') ?? activeGroup.members[0];

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export default function HealthDetails({ navigation, route }) {
  const member = route.params?.member ?? elevatedMember;
  const sharing = member.heartRate !== null;

  return (
    <ScrollView style={common.screen} contentContainerStyle={common.content}>
      <Text style={styles.heading}>Health Details</Text>
      <Text style={styles.name}>{member.firstName} {member.lastName}</Text>

      {sharing ? (
        <>
          <View style={styles.bpmRow}>
            <Text style={styles.bpm}>{member.heartRate}</Text>
            <Text style={styles.bpmUnit}>bpm</Text>
          </View>
          <Text style={styles.label}>{member.percentOfMax}% of max heart rate</Text>

          <View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${member.percentOfMax}%` }]} />
            </View>
            <View style={styles.scale}>
              <Text style={styles.small}>0</Text>
              <Text style={styles.small}>max</Text>
            </View>
          </View>

          <View style={[common.card, { gap: 14 }]}>
            <Row label="Above limit for" value="2 min 40 s" />
            <Row label="Limit" value="148 bpm" />
            <Row label="Last update" value="10 seconds ago" />
          </View>

          <AuthenticationButtons title="Notify emergency contact" onPress={() => navigation.navigate('EmergencyNotified', { member })} />
        </>
      ) : (
        <View style={[common.card, { gap: 6 }]}>
          <Text style={styles.value}>Not sharing heart rate</Text>
          <Text style={styles.label}>This member has turned off heart rate sharing, so no live data is available.</Text>
        </View>
      )}

      <AuthenticationButtons title="Dismiss" variant="secondary" onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}/>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 22, fontWeight: '700', color: colors.ink },
  name: { fontSize: 16, color: colors.stone },
  bpmRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  bpm: { fontSize: 56, fontWeight: '700', color: colors.ink },
  bpmUnit: { fontSize: 18, color: colors.stone },
  track: { height: 12, borderRadius: 6, backgroundColor: colors.line, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.warning },
  scale: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  small: { fontSize: 13, color: colors.stone },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 15, color: colors.stone },
  value: { fontSize: 15, fontWeight: '600', color: colors.ink },
});