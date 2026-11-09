import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import AuthenticationButtons from '../components/AuthenticationButtons';
import Banner from '../components/MessageBanner';
import TextField from '../components/InputTexts';
import { common } from '../styles/theme';
import { auth } from '../firebase/firebaseConfig';
import { authMessage } from '../firebase/authErrors';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordScreen({ navigation, route }) {
  const [email, setEmail] = useState(route?.params?.email ?? '');
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const emailError = submitted && !EMAIL_PATTERN.test(email.trim()) ? 'Enter a valid email address' : '';

  const handleSend = async () => {
    if (loading) return;
    setSubmitted(true);
    setFormError('');
    setSent(false);
    if (!EMAIL_PATTERN.test(email.trim())) return;

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSent(true);
    } catch (e) {
      setFormError(authMessage(e.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={common.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={common.content} keyboardShouldPersistTaps="handled">
        <Text style={common.title}>Reset your password</Text>
        <Text style={common.subtitle}>
          Enter the email you signed up with and we'll send you a link to choose a new password.
        </Text>

        {formError ? <Banner type="error" title="Could not send email" text={formError} /> : null}
        {sent ? (
          <Text style={[common.subtitle, { color: '#2e7d32', marginBottom: 8 }]}>
            If an account exists for {email.trim()}, a reset link is on its way. Check your spam folder too.
          </Text>
        ) : null}

        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@email.com"
          error={emailError}
          autoCapitalize="none"
          keyboardType="email-address"
          returnKeyType="go"
          onSubmitEditing={handleSend}
        />

        <AuthenticationButtons title={loading ? 'Sending...' : 'Send reset link'} onPress={handleSend} />
        <AuthenticationButtons
          title="Back to log in"
          variant="ghost"
          onPress={() => navigation.navigate('Login')}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}