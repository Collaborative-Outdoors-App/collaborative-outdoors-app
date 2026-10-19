import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import ActionButton from '../components/AuthenticationButtons';
import TextField from '../components/InputTexts';
import { colors, common } from '../styles/theme';

const methods = [
  { id: 'sms', title: 'Text message', text: 'We text you a code each time you log in.' },
  { id: 'app', title: 'Authenticator app', text: 'Use an app like Google Authenticator.' },
];

export default function TwoStepSetupScreen({ navigation }) {
  const [method, setMethod] = useState('sms');
  const [phone, setPhone] = useState('(555) 010-0199');

  const handleContinue = () => {
    Alert.alert('Two-step verification is on', 'You will be asked for a code when you log in.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <ScrollView style={common.screen} contentContainerStyle={common.content} keyboardShouldPersistTaps="handled">
      <Text style={common.title}>Would you like to set up two-step verification?</Text>
      <Text style={common.subtitle}>Add a second step to keep your account safe.</Text>

      {methods.map((m) => {
        const selected = m.id === method;
        return (
          <Pressable
            key={m.id}
            onPress={() => setMethod(m.id)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            style={[common.card, styles.option, selected && styles.optionOn]}
          >
            <View style={[styles.radio, selected && styles.radioOn]}>{selected ? <View style={styles.dot} /> : null}</View>
            <View style={{ flex: 1 }}>
              <Text style={styles.optionTitle}>{m.title}</Text>
              <Text style={styles.optionText}>{m.text}</Text>
            </View>
          </Pressable>
        );
      })}
      <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
          <Pressable onPress={() => navigation.navigate('Login')}>
            <Text style={[common.linkText, { fontSize: 16 }]}>Decline</Text>
          </Pressable>
        </View>

      {method === 'sms' ? (
        <TextField label="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      ) : null}

      <ActionButton title="Continue" onPress={handleContinue} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  option: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  optionOn: { borderColor: colors.primary, borderWidth: 1.5 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: colors.primary },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  optionTitle: { fontSize: 16, fontWeight: '600', color: colors.ink },
  optionText: { marginTop: 2, fontSize: 14, color: colors.stone },
});
