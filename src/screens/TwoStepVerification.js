import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import ActionButton from '../components/AuthenticationButtons';
import Banner from '../components/MessageBanner';
import TextField from '../components/InputTexts';
import { common } from '../styles/theme';

export default function TwoStepScreen({ navigation }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleVerify = () => {
    if (code.length !== 6) {
      setError('Enter the 6 digit code.');
      return;
    }
    if (code === '000000') {
      setError('That code is not correct. Try again.');
      return;
    }
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  return (
    <KeyboardAvoidingView style={common.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={common.content} keyboardShouldPersistTaps="handled">
        <Text style={common.title}>Check your phone</Text>
        <Text style={common.subtitle}>We sent a 6 digit code to your phone ending in 0199.</Text>

        {error ? <Banner type="error" text={error} /> : null}

        <TextField
          label="Verification code"
          value={code}
          onChangeText={(t) => {
            setCode(t.replace(/\D/g, '').slice(0, 6));
            setError('');
          }}
          placeholder="000000"
          keyboardType="number-pad"
          maxLength={6}
          inputStyle={{ fontSize: 22, letterSpacing: 6 }}
        />

        <ActionButton title="Verify" onPress={handleVerify} />
        <ActionButton
          title="Resend code"
          variant="ghost"
          onPress={() => Alert.alert('Code sent', 'A new code is on its way.')}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
