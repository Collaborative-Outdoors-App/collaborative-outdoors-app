import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { updateProfile } from 'firebase/auth';
import Button from '../components/Button';
import TextField from '../components/InputTexts';
import Banner from '../components/MessageBanner';
import { auth } from '../firebase/firebaseConfig';
import { authMessage } from '../firebase/authErrors';
import { useAuth } from '../auth/authContext';
import { useCurrentUser } from '../auth/useCurrentUser';
import { toE164 } from '../utils/PhoneNumbers';
import {
  parseDob, ageFromDob, lbsToKg, kgToLbs,
  MIN_AGE, MAX_AGE, MIN_WEIGHT_LBS, MAX_WEIGHT_LBS,
} from '../utils/age';

const GREEN = '#2F5D46';

function Stat({ label, value }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function PersonalDetails({ navigation }) {
  const { user, refreshUser } = useAuth();
  const me = useCurrentUser();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [weight, setWeight] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!me.ready) return;
    setFirstName(me.firstName || '');
    setLastName(me.lastName || '');
    setDob(me.dateOfBirth || '');
    setWeight(me.weightKg ? String(kgToLbs(me.weightKg)) : '');
    setContactName(me.emergencyContact?.name || '');
    setContactPhone(me.emergencyContact?.phone || '');
  }, [me.ready]);

  const fullName = `${firstName} ${lastName}`.trim() || user?.displayName || 'Hiker';
  const initials =
    fullName.split(' ').filter(Boolean).map((p) => p[0]).slice(0, 2).join('').toUpperCase() ||
    (user?.email?.[0] ?? '?').toUpperCase();

  const dobDate = parseDob(dob);
  const age = dobDate ? ageFromDob(dobDate) : null;
  const dobOk = age !== null && age >= MIN_AGE && age <= MAX_AGE;
  const weightLbs = Number(weight.replace(',', '.'));
  const weightOk = weight.trim() !== '' && weightLbs >= MIN_WEIGHT_LBS && weightLbs <= MAX_WEIGHT_LBS;
  const digits = contactPhone.replace(/\D/g, '');
  const phoneOk = digits.length >= 10 && digits.length <= 15;

  const errors = {
    first: submitted && !firstName.trim() ? 'Enter your first name' : '',
    last: submitted && !lastName.trim() ? 'Enter your last name' : '',
    dob: submitted && !dobOk ? 'Enter a valid birth date' : '',
    weight: submitted && !weightOk ? `Enter your weight in lbs (${MIN_WEIGHT_LBS} to ${MAX_WEIGHT_LBS})` : '',
    cName: submitted && !contactName.trim() ? 'Enter your contact name' : '',
    cPhone: submitted && !phoneOk ? 'Enter a valid phone number' : '',
  };

  const handleSave = async () => {
    if (saving) return;
    setSubmitted(true);
    setFormError('');
    if (!firstName.trim() || !lastName.trim() || !dobOk || !weightOk || !contactName.trim() || !phoneOk) return;

    setSaving(true);
    try {
      await me.save({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth: dob.trim(),
        weightKg: lbsToKg(weightLbs),
        emergencyContact: {
          name: contactName.trim(),
          phone: toE164(digits),
          relationship: me.emergencyContact?.relationship || '',
        },
      });
      const newName = `${firstName.trim()} ${lastName.trim()}`;
      if (newName !== (user?.displayName ?? '')) {
        await updateProfile(auth.currentUser, { displayName: newName });
        refreshUser();
      }
      Alert.alert('Details saved', 'Your personal details were updated.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      console.log('SAVE PROFILE ERROR:', e.message);
      setFormError(e.code ? authMessage(e.code) : 'Could not save. You need a connection to save changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{fullName}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        {/* Stats (update live as you type) */}
        <View style={styles.card}>
          <View style={styles.statsRow}>
            <Stat label="Age" value={dobOk ? age : '—'} />
            <View style={styles.divider} />
            <Stat label="Weight" value={weightOk ? `${Math.round(weightLbs)} lbs` : '—'} />
            <View style={styles.divider} />
            <Stat label="Max HR" value={'—'} /> 
          </View>
        </View>

        {/* About you */}
        <View style={styles.card}>
          <TextField label="First Name" value={firstName} onChangeText={setFirstName} error={errors.first} />
          <TextField label="Last Name" value={lastName} onChangeText={setLastName} error={errors.last} />
          <TextField
            label="Date of Birth"
            value={dob}
            onChangeText={setDob}
            placeholder="1999-04-23"
            error={errors.dob}
            autoCapitalize="none"
          />
          <Text style={styles.hint}>Format: YYYY-MM-DD</Text>
          <TextField
            label="Weight (lbs)"
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
            error={errors.weight}
          />
        </View>

        {/* Emergency contact */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Emergency contact</Text>
          <TextField label="Contact Name" value={contactName} onChangeText={setContactName} error={errors.cName} />
          <TextField
            label="Contact Phone Number"
            value={contactPhone}
            onChangeText={setContactPhone}
            keyboardType="phone-pad"
            error={errors.cPhone}
          />
        </View>

        {formError ? <Banner type="error" title="Could not save" text={formError} /> : null}

        <Button title={saving ? 'Saving...' : 'Save Changes'} onPress={handleSave} />
        <Button title="Cancel" onPress={() => navigation.goBack()} style={styles.cancelButton} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F6F5' },
  content: { padding: 20, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 24 },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarText: { color: '#fff', fontSize: 34, fontWeight: '700', letterSpacing: 1 },
  name: { fontSize: 24, fontWeight: '700', color: '#1A1A1A' },
  email: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700', color: GREEN },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  divider: { width: 1, height: 32, backgroundColor: '#E5E7EB' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 8 },
  hint: { fontSize: 12, color: '#6B7280', marginTop: -4, marginBottom: 8 },
  cancelButton: { backgroundColor: '#6B7280' },
});