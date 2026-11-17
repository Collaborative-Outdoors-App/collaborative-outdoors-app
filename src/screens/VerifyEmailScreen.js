import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, ScrollView, Text } from 'react-native';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import { useAuth } from '../auth/authContext';
import ActionButton from '../components/AuthenticationButtons';
import Banner from '../components/MessageBanner';
import { common } from '../styles/theme';

export default function VerifyEmailScreen({ navigation }) {
  const { refreshUser } = useAuth();
  const [msg, setMsg] = useState(null); 
  const [busy, setBusy] = useState(false);
  const done = useRef(false);
  const email = auth.currentUser?.email;

  const check = useCallback(async (silent) => {
    if (done.current) return true;
    try {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        done.current = true;
        await refreshUser();
        navigation.reset({ index: 0, routes: [{ name: 'MFA-Setup', params: { fromSignup: true } }] });
        return true;
      }
      if (!silent) setMsg({ type: 'error', text: 'Not verified yet. Open the link in the email, then try again.' });
    } catch (e) {
      console.log('VERIFY CHECK:', e.code, e.message);
      if (!silent) setMsg({ type: 'error', text: 'Could not check. Check your connection and try again.' });
    }
    return false;
  }, [navigation, refreshUser]);

  useEffect(() => {
    const id = setInterval(() => check(true), 4000);
    return () => clearInterval(id);
  }, [check]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') check(true);
    });
    return () => sub.remove();
  }, [check]);

  const manualCheck = async () => {
    setBusy(true);
    setMsg(null);
    await check(false);
    setBusy(false);
  };

  const resend = async () => {
    setBusy(true);
    setMsg(null);
    try {
      await sendEmailVerification(auth.currentUser);
      setMsg({ type: 'success', text: `We sent a new link to ${email}. Check spam too.` });
    } catch (e) {
      console.log('VERIFY SEND:', e.code);
      setMsg({
        type: 'error',
        text: e.code === 'auth/too-many-requests' ? 'Too many requests. Wait a few minutes.' : 'Could not send the email.',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={common.content}>
      <Text style={common.title}>Verify your email</Text>
      <Text style={common.subtitle}>
        We sent a link to {email}. Open it, then come back to the app. We'll continue automatically.
      </Text>

      {msg ? <Banner type={msg.type} title={msg.type === 'error' ? 'Problem' : 'Sent'} text={msg.text} /> : null}

      <ActionButton title={busy ? 'Checking...' : 'Check now'} onPress={manualCheck} />
      <ActionButton title='Resend email' onPress={resend} />
      <ActionButton title='Skip for now' onPress={() => navigation.reset({ index: 0, routes: [{ name: 'MFASetup', params: { fromSignup: true } }] })} />
    </ScrollView>
  );
}