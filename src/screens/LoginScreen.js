import { useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import AuthenticationButtons from '../components/AuthenticationButtons';
import Banner from '../components/MessageBanner';
import TextField from '../components/InputTexts';
import { common } from '../styles/theme';
import { twoStepEnabled } from '../constants/currentUser';


const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


export default function LoginScreen({ navigation, route }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState('');
  const passwordRef = useRef(null);

  const emailError = submitted && !EMAIL_PATTERN.test(email.trim()) ? 'Enter a valid email address' : '';
  const passwordError = submitted && !password ? 'Enter your password' : '';

  const handleLogin = () => {
    setSubmitted(true);
    setFormError('');
    if (!EMAIL_PATTERN.test(email.trim()) || !password) return;
    

    if (password === 'wrong') {
      setFormError('Incorrect email or password. Please try again.');
      return;
    }
    if (twoStepEnabled) navigation.navigate('TwoStepVerification');
    else navigation.reset({ index: 0, routes: [{ name: 'TwoStepVerification' }] });
  };

  return (
    <KeyboardAvoidingView style={common.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={common.content} keyboardShouldPersistTaps="handled">
        <Text style={common.title}>Welcome back</Text>
        

        {route?.params?.expired ? (
          <Banner type="warning" title="Session expired" text="For your security, please log in again." />
        ) : null}
        {formError ? <Banner type="error" title="Could not log in" text={formError} /> : null}

        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@email.com"
          error={emailError}
          autoCapitalize="none"
          keyboardType="email-address"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
        <TextField
          label="Password"
          secure
          value={password}
          onChangeText={setPassword}
          placeholder="Enter your password"
          error={passwordError}
          autoCapitalize="none"
          returnKeyType="go"
          onSubmitEditing={handleLogin}
          ref={passwordRef}
        />

        <Pressable
          style={{ alignSelf: 'flex-end' }}
          onPress={() => Alert.alert('Reset link sent', 'Check your email for a password reset link.')}
        >
          <Text style={common.linkText}>Forgot password?</Text>
        </Pressable>

        <View style={{ height: 8 }} />
        <AuthenticationButtons title="Log in" onPress={handleLogin} />

        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
          <Text style={common.subtitle}>New here? </Text>
          <Pressable onPress={() => navigation.navigate('Signup')}>
            <Text style={[common.linkText, { fontSize: 16 }]}>Create an account</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
