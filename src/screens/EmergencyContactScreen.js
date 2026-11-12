import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import { auth } from '../firebase/firebaseConfig';
import { useAuth } from '../auth/authContext';
import ActionButton from '../components/AuthenticationButtons';
import Banner from '../components/MessageBanner';
import TextField from '../components/InputTexts';
import { common } from '../styles/theme';
import { toE164 } from '../utils/PhoneNumbers';

export default function EmergencyContactScreen({ navigation, route }) {
  const { saveMyProfile } = useAuth();
  const { dateOfBirth, weightKg, firstName, lastName } = route.params ?? {};
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [relationship, setRelationship] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const digits = contactPhone.replace(/\D/g, '');
  const phoneOk = digits.length >= 10 && digits.length <= 15;
  const errors = {
    name: submitted && !contactName.trim() ? 'Enter your contact name' : '',
    phone: submitted && !phoneOk ? 'Enter a valid phone number' : '',
  };

  const handleSave = async () => {
    if (loading) return;
    setSubmitted(true);
    setFormError('');
    if (!contactName.trim() || !phoneOk) return;
    if (!dateOfBirth || !weightKg) {
      navigation.navigate('AboutYou');
      return;
    }

    setLoading(true);
    try {
      const [fallbackFirst = '', ...rest] = (auth.currentUser.displayName || '').split(' ');
      const first = (firstName ?? fallbackFirst).trim();
      const last = (lastName ?? rest.join(' ')).trim();

      await saveMyProfile({
        ...(first ? { firstName: first } : {}),
        ...(last ? { lastName: last } : {}),
        dateOfBirth,
        weightKg,
        emergencyContact: {
          name: contactName.trim(),
          phone: toE164(digits),
          relationship: relationship.trim(),
        },
        onboardingComplete: true,
      });
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } catch (e) {
      console.log('SAVE PROFILE ERROR:', e.message);
      setFormError('Could not save. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={common.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={common.content} keyboardShouldPersistTaps='handled'>
        <Text style={common.title}>Emergency contact</Text>
        <Text style={common.subtitle}>
          Step 2 of 2. We will notify this person if you or your group need help on a hike.
        </Text>

        {formError ? <Banner type='error' title='Could not save' text={formError} /> : null}

        <TextField label='Contact name' value={contactName} onChangeText={setContactName} placeholder='Full name' error={errors.name} />
        <TextField
          label='Phone number'
          value={contactPhone}
          onChangeText={setContactPhone}
          placeholder='416 555 0123'
          error={errors.phone}
          keyboardType='phone-pad'
        />
        <TextField label='Relationship (optional)' value={relationship} onChangeText={setRelationship} placeholder='Parent, partner, friend' />

        <ActionButton title={loading ? 'Saving...' : 'Finish'} onPress={handleSave} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}