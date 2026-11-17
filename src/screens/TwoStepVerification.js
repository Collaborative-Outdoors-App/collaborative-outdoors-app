import { useState } from 'react';
import { ScrollView, Text } from 'react-native';
import ActionButton from '../components/AuthenticationButtons';
import Banner from '../components/MessageBanner';
import TextField from '../components/InputTexts';
import { common } from '../styles/theme';
import { getProfile } from '../firebase/profile';
import { finishSignIn } from '../auth/mfaTotp';

export default function TwoStepVerification({ navigation }) {
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const verify = async () => {
    if (busy) return;
    if (code.trim().length !== 6) {
      setMsg({ type: 'error', text: 'Enter the 6-digit code.' });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const user = await finishSignIn(code.trim());
      const profile = await getProfile(user.uid);
      const needsOnboarding = profile !== null && !profile.onboardingComplete;
      navigation.reset({ index: 0, routes: [{ name: needsOnboarding ? 'AboutYou' : 'Home' }] });
    } catch (e) {
      console.log('MFA SIGNIN CONFIRM:', e.code, e.message);
      setMsg({ type: 'error', text: 'That code was not accepted. Wait for a new code and try again.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={common.content} keyboardShouldPersistTaps='handled'>
      <Text style={common.title}>Enter your code</Text>
      <Text style={common.subtitle}>Open your authenticator app and enter the 6-digit code for Collaborative Outdoors.</Text>
      {msg ? <Banner type={msg.type} title='Problem' text={msg.text} /> : null}
      <TextField label='Code' value={code} onChangeText={setCode} placeholder='123456' keyboardType='number-pad' />
      <ActionButton title={busy ? 'Checking...' : 'Verify'} onPress={verify} />
    </ScrollView>
  );
}