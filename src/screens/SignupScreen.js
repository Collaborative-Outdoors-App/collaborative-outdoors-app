import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import { authMessage } from '../firebase/authErrors';
import ActionButton from '../components/AuthenticationButtons';
import PasswordRules, { isPasswordValid } from '../components/PasswordRules';
import TextField from '../components/InputTexts';
import { common } from '../styles/theme';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignupScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const errors = {
    name: submitted && !name.trim() ? 'Enter your name' : '',
    email: submitted && !EMAIL_PATTERN.test(email.trim()) ? 'Enter a valid email address' : '',
    password: submitted && !isPasswordValid(password) ? 'Password does not meet the rules below' : '',
    confirm: submitted && confirm !== password ? 'Passwords do not match' : '',
  };

  const handleCreate = async () => {
    if (loading) return;
    setSubmitted(true);
    setFormError('');
    if (!name.trim() || !EMAIL_PATTERN.test(email.trim()) || !isPasswordValid(password) || confirm !== password) return;

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(cred.user, { displayName: name.trim() });
      Alert.alert('Account created', "Let's set up two-step verification.", [
        { text: 'OK', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'TwoStepSetup' }] }) },
      ]);
    } catch (e) {
      setFormError(authMessage(e.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={common.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={common.content} keyboardShouldPersistTaps="handled">
        <Text style={common.title}>Create your account</Text>
        <Text style={common.subtitle}>Join your group and hike together.</Text>

        <TextField label="Full name" value={name} onChangeText={setName} placeholder="Your name" error={errors.name} />
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@email.com"
          error={errors.email}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextField
          label="Password"
          secure
          value={password}
          onChangeText={setPassword}
          placeholder="Create a password"
          error={errors.password}
          autoCapitalize="none"
        />
        <PasswordRules password={password} />
        <TextField
          label="Confirm password"
          secure
          value={confirm}
          onChangeText={setConfirm}
          placeholder="Repeat your password"
          error={errors.confirm}
          autoCapitalize="none"
        />

        {formError ? <Text style={{ color: '#c0392b', marginBottom: 8 }}>{formError}</Text> : null}

        <ActionButton title={loading ? 'Creating account...' : 'Create account'} onPress={handleCreate} />
        <ActionButton title="I already have an account" variant="ghost" onPress={() => navigation.navigate('Login')} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}