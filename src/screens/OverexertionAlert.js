export default function OverexertionAlertScreen({ navigation, route }) {
  const params = route.params ?? {};
  const member = params.member ?? elevatedMember;

  if (params.self) {
    return (
      <ScrollView style={common.screen} contentContainerStyle={[common.content, styles.center]}>
        <View style={styles.circle}>
          <Text style={styles.symbol}>!</Text>
        </View>

        <Text style={styles.title}>Your heart rate is high</Text>
        <Text style={styles.text}>
          {params.bpm} bpm is {params.pctOfMax}% of your max. Slow down and rest. Your group and emergency contact are being alerted.
        </Text>

        <View style={styles.actions}>
          <AuthenticationButtons title="I'm OK" onPress={() => navigation.goBack()} />
        </View>
      </ScrollView>
    );
  }

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