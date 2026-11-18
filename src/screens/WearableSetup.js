import { Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useState } from 'react';
import AuthenticationButtons from '../components/AuthenticationButtons';
import { colors, common } from '../styles/theme';
import { useWearable } from '../wearable/WearableContext';
import ConnectingView from '../screens/ConnectingView';

function Checkbox({ label, checked, onToggle }) {
  return (
    <Pressable onPress={onToggle} accessibilityRole="checkbox" accessibilityState={{ checked }} style={styles.checkRow}>
      <View style={[styles.box, checked && styles.boxOn]}>{checked ? <Text style={styles.tick}>✓</Text> : null}</View>
      <Text style={styles.checkLabel}>{label}</Text>
    </Pressable>
  );
}

export default function ConnectWearableScreen({ navigation }) {
  const {
    status, device, bpm, shareWithGroup, setShareWithGroup,
    heartRateAccess, setHeartRateAccess,
    attempt, maxAttempts, connect, disconnect, simulateLoss, retry, setActivity,
  } = useWearable();
  const [source, setSource] = useState(
    Platform.OS === 'ios' ? 'Apple Health' : 'Health Connect'
  );

  if (status === 'connecting') {
    return <ConnectingView via={source} onCancel={disconnect} />;
  }

  if (status === 'lost') {
    return (
      <ScrollView style={common.screen} contentContainerStyle={[common.content, styles.center]}>
        <Text style={styles.heading}>Wearable</Text>
        <Text style={styles.text}>Lost connection to your wearable</Text>
        <View style={styles.iconBox}><Text style={styles.icon}>⌚</Text></View>
        <Text style={styles.text}>Reconnecting...</Text>
        <Text style={styles.small}>Attempt {Math.max(attempt, 1)} of {maxAttempts}</Text>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${(Math.max(attempt, 1) / maxAttempts) * 100}%` }]} />
        </View>
        <View style={styles.actions}>
          <AuthenticationButtons title="Try Again" onPress={retry} />
          <AuthenticationButtons
            title="Continue Without Wearable"
            variant="secondary"
            onPress={() => {
              disconnect();
              navigation.goBack();
            }}
          />
        </View>
      </ScrollView>
    );
  }

  if (status === 'connected') {
    return (
      <ScrollView style={common.screen} contentContainerStyle={common.content}>
        <Text style={styles.heading}>Wearable</Text>

        <View style={[common.card, styles.deviceRow]}>
          <View style={styles.iconBoxSmall}><Text style={styles.iconSmall}>⌚</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.deviceName}>{device?.name}</Text>
            <Text style={styles.small}>via {device?.via}</Text>
          </View>
          <View style={styles.chip}><Text style={styles.chipText}>Connected</Text></View>
        </View>

        <View style={[common.card, styles.bpmCard]}>
          <Text style={styles.bpm}>{bpm ?? '--'}</Text>
          <Text style={styles.bpmUnit}>bpm</Text>
        </View>

        <View style={[common.card, { gap: 14 }]}>
          <View style={styles.row}>
            <Text style={styles.label}>Heart rate access</Text>
            <Switch value={heartRateAccess} onValueChange={setHeartRateAccess} trackColor={{ true: colors.primary }} />
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Share with group</Text>
            <Switch value={shareWithGroup} onValueChange={setShareWithGroup} trackColor={{ true: colors.primary }} />
          </View>
        </View>

        <AuthenticationButtons title="Disconnect Wearable" variant="secondary" onPress={disconnect} />

        <Pressable onPress={simulateLoss}>
          <Text style={styles.demo}>Demo: show lost connection</Text>
        </Pressable>
        <Pressable onPress={() => setActivity('danger')}>
          <Text style={styles.demo}>Demo: simulate overexertion</Text>
        </Pressable>
        <Pressable onPress={() => setActivity('rest')}>
          <Text style={styles.demo}>Demo: back to resting</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={common.screen} contentContainerStyle={common.content}>
      <Text style={styles.heading}>Connect Wearable</Text>
      <Text style={styles.text}>Choose where your heart rate comes from</Text>

      <View style={{ gap: 14 }}>
        <Checkbox
          label="Health Connect (Android)"
          checked={source === 'Health Connect'}
          onToggle={() => setSource('Health Connect')}
        />
        <Checkbox
          label="Apple Health (iPhone)"
          checked={source === 'Apple Health'}
          onToggle={() => setSource('Apple Health')}
        />
      </View>

      <View style={[common.card, { gap: 14 }]}>
        <View style={styles.row}>
          <Text style={styles.label}>Allow heart rate access</Text>
          <Switch value={heartRateAccess} onValueChange={setHeartRateAccess} trackColor={{ true: colors.primary }} />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Share heart rate with group</Text>
          <Switch value={shareWithGroup} onValueChange={setShareWithGroup} trackColor={{ true: colors.primary }} />
        </View>
      </View>

      {!heartRateAccess ? (
        <Text style={styles.small}>Turn on heart rate access to connect.</Text>
      ) : null}

      <AuthenticationButtons title="Connect" onPress={() => heartRateAccess && connect(source)} />
      <AuthenticationButtons title="Not Now" variant="secondary" onPress={() => navigation.goBack()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center' },
  heading: { fontSize: 22, fontWeight: '700', color: colors.ink },
  text: { fontSize: 15, color: colors.stone },
  small: { fontSize: 13, color: colors.stone },
  actions: { alignSelf: 'stretch', gap: 12, marginTop: 12 },
  iconBox: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 40 },
  track: { alignSelf: 'stretch', height: 8, borderRadius: 4, backgroundColor: colors.line, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.primary },
  deviceRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconBoxSmall: { width: 48, height: 48, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  iconSmall: { fontSize: 24 },
  deviceName: { fontSize: 16, fontWeight: '600', color: colors.ink },
  chip: { paddingHorizontal: 10, height: 26, borderRadius: 13, backgroundColor: colors.primarySoft, justifyContent: 'center' },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.primary },
  bpmCard: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 8, paddingVertical: 24 },
  bpm: { fontSize: 56, fontWeight: '700', color: colors.ink },
  bpmUnit: { fontSize: 18, color: colors.stone },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  label: { flex: 1, fontSize: 15, color: colors.ink },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  box: { width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, borderColor: colors.stone, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  tick: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  checkLabel: { fontSize: 15, color: colors.ink },
  demo: { textAlign: 'center', fontSize: 13, color: colors.stone, textDecorationLine: 'underline' },
});