import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import AuthenticationButtons from '../components/AuthenticationButtons';
import { colors, common } from '../styles/theme';
import currentUserData from '../constants/currentUser.json';

const wearable = currentUserData.currentUser.wearableDevice;

function Checkbox({ label, checked, onToggle }) {
  return (
    <Pressable onPress={onToggle} accessibilityRole="checkbox" accessibilityState={{ checked }} style={styles.checkRow}>
      <View style={[styles.box, checked && styles.boxOn]}>{checked ? <Text style={styles.tick}>✓</Text> : null}</View>
      <Text style={styles.checkLabel}>{label}</Text>
    </Pressable>
  );
}

// Wireframes 24 (Connect Wearable), 25 (Wearable Connected) and 31 (Lost Connection).
// MOCK: 'idle' -> Connect -> 'connected'. The demo link shows the 'lost' screen.
export default function ConnectWearableScreen({ navigation }) {
  const [status, setStatus] = useState('idle'); // 'idle' | 'connected' | 'lost'
  const [googleFit, setGoogleFit] = useState(true);
  const [appleHealth, setAppleHealth] = useState(false);
  const [shareWithGroup, setShareWithGroup] = useState(true);

  if (status === 'lost') {
    return (
      <ScrollView style={common.screen} contentContainerStyle={[common.content, styles.center]}>
        <Text style={styles.heading}>Wearable</Text>
        <Text style={styles.text}>Lost connection to your wearable</Text>
        <View style={styles.iconBox}><Text style={styles.icon}>⌚</Text></View>
        <Text style={styles.text}>Reconnecting...</Text>
        <Text style={styles.small}>Attempt 2 of 3</Text>
        <View style={styles.track}><View style={[styles.fill, { width: '40%' }]} /></View>
        <View style={styles.actions}>
          <AuthenticationButtons title="Try Again" onPress={() => setStatus('connected')} />
          <AuthenticationButtons title="Continue Without Wearable" variant="secondary" onPress={() => setStatus('idle')} />
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
            <Text style={styles.deviceName}>{wearable.name}</Text>
            <Text style={styles.small}>via {wearable.provider}</Text>
          </View>
          <View style={styles.chip}><Text style={styles.chipText}>Connected</Text></View>
        </View>

        <View style={[common.card, styles.bpmCard]}>
          <Text style={styles.bpm}>{wearable.heartRate}</Text>
          <Text style={styles.bpmUnit}>bpm</Text>
        </View>

        <View style={[common.card, { gap: 14 }]}>
          <View style={styles.row}>
            <Text style={styles.label}>Heart rate access</Text>
            <Text style={styles.value}>Allowed</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Share with group</Text>
            <Switch value={shareWithGroup} onValueChange={setShareWithGroup} trackColor={{ true: colors.primary }} />
          </View>
        </View>

        <AuthenticationButtons title="Disconnect Wearable" variant="secondary" onPress={() => setStatus('idle')} />

        <Pressable onPress={() => setStatus('lost')}>
          <Text style={styles.demo}>Demo: show lost connection</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={common.screen} contentContainerStyle={common.content}>
      <Text style={styles.heading}>Connect Wearable</Text>
      <Text style={styles.text}>Choose where your heart rate comes from</Text>

      <View style={{ gap: 14 }}>
        <Checkbox label="Google Fit" checked={googleFit} onToggle={() => setGoogleFit((v) => !v)} />
        <Checkbox label="Apple Health" checked={appleHealth} onToggle={() => setAppleHealth((v) => !v)} />
      </View>

      <View style={[common.card, styles.row]}>
        <Text style={styles.label}>Share heart rate with group</Text>
        <Switch value={shareWithGroup} onValueChange={setShareWithGroup} trackColor={{ true: colors.primary }} />
      </View>

      <AuthenticationButtons title="Connect" onPress={() => setStatus('connected')} />
      <AuthenticationButtons title="Not Now" variant="secondary" onPress={() => navigation.goBack()} />

      <Pressable onPress={() => setStatus('lost')}>
        <Text style={styles.demo}>Demo: show lost connection</Text>
      </Pressable>
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
  value: { fontSize: 15, fontWeight: '600', color: colors.primary },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  box: { width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, borderColor: colors.stone, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  tick: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  checkLabel: { fontSize: 15, color: colors.ink },
  demo: { textAlign: 'center', fontSize: 13, color: colors.stone, textDecorationLine: 'underline' },
});