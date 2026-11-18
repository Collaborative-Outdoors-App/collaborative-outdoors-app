import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import ActionButton from '../components/AuthenticationButtons';
import PasswordRules, { isPasswordValid } from '../components/PasswordRules';
import TextField from '../components/InputTexts';
import { common } from '../styles/theme';
import { auth } from '../firebase/firebaseConfig';
import { authMessage } from '../firebase/authErrors';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';

export default function ChangePasswordScreen({ navigation }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const errors = {
    current: submitted && !current ? 'Enter your current password' : '',
    next: submitted && !isPasswordValid(next) ? 'Password does not meet the rules below' : '',
    confirm: submitted && confirm !== next ? 'Passwords do not match' : '',
  };

  const handleUpdate = async () => {
    if (loading) return;
    setSubmitted(true);
    setFormError('');
    if (!current || !isPasswordValid(next) || confirm !== next) return;

    setLoading(true);
    try {
      const user = auth.currentUser;
      const cred = EmailAuthProvider.credential(user.email, current);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, next);
      Alert.alert('Password updated', 'Your password was changed.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
    console.log('CHANGE PASSWORD ERROR:', e.code, e.message);
    const msg = authMessage(e.code);
    setFormError(msg);
    Alert.alert('Could not change password', msg);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <KeyboardAvoidingView style={common.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={common.content} keyboardShouldPersistTaps="handled">
        <TextField
          label="Current password"
          secure
          value={current}
          onChangeText={setCurrent}
          error={errors.current}
          autoCapitalize="none"
        />
        <TextField
          label="New password"
          secure
          value={next}
          onChangeText={setNext}
          error={errors.next}
          autoCapitalize="none"
        />
        <PasswordRules password={next} />
        <TextField
          label="Confirm new password"
          secure
          value={confirm}
          onChangeText={setConfirm}
          error={errors.confirm}
          autoCapitalize="none"
        />
        <ActionButton title="Update password" onPress={handleUpdate} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
