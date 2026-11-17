import { useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import { colors, common } from '../styles/theme';
import ActionButton from '../components/AuthenticationButtons';
import Banner from '../components/MessageBanner';
import TextField from '../components/InputTexts';
import { getEnrolledFactors, startTotpEnrollment, finishTotpEnrollment, removeFactor } from '../auth/mfaTotp';
import QrCode from '../auth/QrCode';

export default function MFASettings({ navigation, route }) {  
  const [enrolled, setEnrolled] = useState(() => getEnrolledFactors(auth.currentUser));
  const [pending, setPending] = useState(null); 
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState(null); 
  const [busy, setBusy] = useState(false);

  const isOn = enrolled.length > 0;

  const run = async (label, fn, failText) => {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
    } catch (e) {
      console.log(`${label}:`, e.code, e.message);
      const text =
        e.code === 'auth/requires-recent-login'
          ? 'For security, log out and log back in, then try again.'
          : failText || `Something went wrong (${e.code || e.message}).`;
      setMsg({ type: 'error', text });
    } finally {
      setBusy(false);
    }
  };

  const begin = () =>
    run('TOTP START', async () => {
      await auth.currentUser.reload();
      if (!auth.currentUser.emailVerified) {
        await sendEmailVerification(auth.currentUser);
        setMsg({ type: 'error', text: `Verify your email first. We sent a link to ${auth.currentUser.email}. Open it, then tap Set up again.` });
        return;
      }
      setPending(await startTotpEnrollment(auth.currentUser));
    });

  const confirm = () =>
    run('TOTP CONFIRM', async () => {
      if (code.trim().length !== 6) {
        setMsg({ type: 'error', text: 'Enter the 6-digit code from your authenticator app.' });
        return;
      }
      await finishTotpEnrollment(auth.currentUser, pending.secret, code.trim());
      setEnrolled(getEnrolledFactors(auth.currentUser));
      setPending(null);
      setCode('');
      setMsg({ type: 'success', text: 'Two-step verification is on.' });
    }, 'That code was not accepted. Wait for a new code and try again.');

  const turnOff = () =>
    run('TOTP REMOVE', async () => {
      await removeFactor(auth.currentUser, enrolled[0]);
      setEnrolled(getEnrolledFactors(auth.currentUser));
      setMsg({ type: 'success', text: 'Two-step verification is off.' });
    });

  return (
    <ScrollView
      style={common.screen}
      contentContainerStyle={[common.content, styles.center]}
      keyboardShouldPersistTaps='handled'
    >
      <Text style={styles.heading}>Two-step verification</Text>
      <Text style={styles.small}>
        Optional. Adds a 6-digit code from an authenticator app (like Google Authenticator) when you log in.
      </Text>

      {msg ? <Banner type={msg.type} title={msg.type === 'error' ? 'Problem' : 'Done'} text={msg.text} /> : null}

      <View style={[common.card, styles.method]}>
        <Text style={styles.methodLabel}>Authenticator app</Text>

        {isOn ? (
          <View style={styles.field}>
            <ActionButton title={busy ? 'Working...' : 'Turn off'} onPress={turnOff} />
          </View>
        ) : pending ? (
          <>
            <Text style={styles.small}>1. Scan this QR code with your authenticator app.</Text>
            <QrCode value={pending.uri} />
            <Text style={styles.small}>Can't scan? Add this key manually:</Text>
            <Text selectable style={styles.key}>{pending.key}</Text>
            <Text style={styles.small}>2. Enter the 6-digit code it shows.</Text>
            <View style={styles.field}>
              <TextField label='Code' value={code} onChangeText={setCode} placeholder='123456' keyboardType='number-pad' />
            </View>
            <View style={styles.field}>
              <ActionButton title={busy ? 'Checking...' : 'Confirm'} onPress={confirm} />
            </View>
          </>
        ) : (
          <View style={styles.field}>
            <ActionButton title={busy ? 'Working...' : 'Set up'} onPress={begin} />
          </View>
        )}
      </View>
      {route?.params?.fromSignup ? (
        <ActionButton
          title={isOn ? 'Continue' : 'Skip for now'}
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}
        />
      ) : null}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  center: { alignItems: 'stretch' },
  heading: { fontSize: 18, fontWeight: '700', color: colors.ink, textAlign: 'center' },
  method: { alignItems: 'center', gap: 10 },
  field: { alignSelf: 'stretch' },
  methodLabel: { fontSize: 13, fontWeight: '600', color: colors.stone },
  key: { fontSize: 15, letterSpacing: 1, color: colors.ink, textAlign: 'center' },
  small: { fontSize: 13, color: colors.stone, textAlign: 'center' },
});