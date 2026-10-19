import { ScrollView, StyleSheet, Text, View } from 'react-native';
import AuthenticationButtons from '../components/AuthenticationButtons';
import { colors, common } from '../styles/theme';
import { CURRENT_USER as currentUserData } from '../constants/currentUser';
import { GROUPS as groupsData } from '../constants/groups';

const currentUser = currentUserData.currentUser;
const activeGroup = groupsData.groups.find((g) => g.groupId === currentUser.groupIds[0]);

const elevatedMember = activeGroup.members.find((m) => m.status === 'elevated') ?? activeGroup.members[0];

export default function OverexertionAlertScreen({ navigation, route }) {
  const member = route.params?.member ?? elevatedMember;

  return (
    <ScrollView style={common.screen} contentContainerStyle={[common.content, styles.center]}>
      <View style={styles.circle}>
        <Text style={styles.symbol}>!</Text>
      </View>

      <Text style={styles.title}>{member.firstName} {member.lastName} needs to slow down</Text>
      <Text style={styles.text}>
        Heart rate is {member.heartRate ?? 158} bpm, above 85% of their max for more than 2 minutes.
      </Text>

      <View style={styles.actions}>
        <AuthenticationButtons
          title="View Health Details"
          onPress={() => navigation.navigate('HealthDetails', { member })}
        />
        <AuthenticationButtons
          title="Dismiss"
          variant="secondary"
          onPress={() => navigation.navigate('TrailSearch')}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center' },
  circle: { width: 110, height: 110, borderRadius: 55, backgroundColor: colors.warningSoft, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  symbol: { fontSize: 52, fontWeight: '700', color: colors.warningInk },
  title: { fontSize: 22, fontWeight: '700', color: colors.ink, textAlign: 'center' },
  text: { fontSize: 16, lineHeight: 24, color: colors.stone, textAlign: 'center' },
  actions: { alignSelf: 'stretch', gap: 12, marginTop: 16 },
});