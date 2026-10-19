import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import AuthenticationButtons from '../components/AuthenticationButtons';
import TextField from '../components/InputTexts';
import { colors, common } from '../styles/theme';
import { CURRENT_USER as currentUserData } from '../constants/currentUser';

const currentUser = currentUserData.currentUser;
const contact = currentUser.emergencyContacts[0];

function ToggleRow({ label, value, onValueChange, last }) {
  return (
    <View style={[styles.row, !last && styles.rowDivider]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ true: colors.primary }} />
    </View>
  );
}

export default function AccountDetails({ navigation }) {
  const [fullName, setFullName] = useState(`${currentUser.firstName} ${currentUser.lastName}`);
  const [contactName, setContactName] = useState(`${contact.firstName} ${contact.lastName}`);
  const [contactPhone, setContactPhone] = useState(contact.phoneNumber);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [shareHeartRate, setShareHeartRate] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  const nameError = submitted && !fullName.trim() ? 'Enter your full name' : '';

  const handleSave = () => {
    setSubmitted(true);
    if (!fullName.trim()) return;
    Alert.alert('Details saved', 'Your personal details were updated.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <KeyboardAvoidingView style={common.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={common.content} keyboardShouldPersistTaps="handled">
        <View style={[common.card, styles.profile]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{currentUser.firstName[0]}{currentUser.lastName[0]}</Text>
          </View>
          <View>
            <Text style={styles.name}>{fullName}</Text>
            <Text style={styles.email}>{currentUser.email}</Text>
          </View>
        </View>

        <TextField label="Full Name" value={fullName} onChangeText={setFullName} error={nameError} />
        <TextField label="Emergency Contact Name" value={contactName} onChangeText={setContactName} />
        <TextField
          label="Emergency Contact Phone Number"
          value={contactPhone}
          onChangeText={setContactPhone}
          keyboardType="phone-pad"
        />

        <View style={[common.card, styles.group]}>
          <ToggleRow label="Enable Push Notifications" value={pushEnabled} onValueChange={setPushEnabled} />
          <ToggleRow label="Share Heart Rate With Group" value={shareHeartRate} onValueChange={setShareHeartRate} last />
        </View>

        <AuthenticationButtons title="Save Changes" onPress={handleSave} />
        <AuthenticationButtons title="Cancel" variant="ghost" onPress={() => navigation.goBack()} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 17, fontWeight: '700', color: colors.primary },
  name: { fontSize: 17, fontWeight: '600', color: colors.ink },
  email: { marginTop: 2, fontSize: 14, color: colors.stone },
  group: { padding: 0, overflow: 'hidden' },
  row: { minHeight: 56, paddingHorizontal: 18, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.line },
  rowLabel: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.ink },
});