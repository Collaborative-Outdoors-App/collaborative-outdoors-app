import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import ActionButton from '../components/AuthenticationButtons';
import PasswordRules, { isPasswordValid } from '../components/PasswordRules';
import TextField from '../components/InputTexts';
import { common } from '../styles/theme';

export default function ChangePasswordScreen({ navigation }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const errors = {
    current: submitted && !current ? 'Enter your current password' : submitted && current === 'wrong' ? 'Current password is incorrect' : '',
    next: submitted && !isPasswordValid(next) ? 'Password does not meet the rules below' : '',
    confirm: submitted && confirm !== next ? 'Passwords do not match' : '',
  };

  const handleUpdate = () => {
    setSubmitted(true);
    if (!current || current === 'wrong' || !isPasswordValid(next) || confirm !== next) return;
    Alert.alert('Password updated', 'Use your new password next time you log in.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
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
