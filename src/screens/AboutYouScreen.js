import { parseDob, ageFromDob, lbsToKg, MIN_AGE, MAX_AGE, MIN_WEIGHT_LBS, MAX_WEIGHT_LBS } from '../utils/age';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import ActionButton from '../components/AuthenticationButtons';
import TextField from '../components/InputTexts';
import { common } from '../styles/theme';


export default function AboutYouScreen({ navigation, route }) {
  const { firstName, lastName } = route.params ?? {};
  const [dob, setDob] = useState('');
  const [weight, setWeight] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const dobDate = parseDob(dob);
  const age = dobDate ? ageFromDob(dobDate) : null;
  const weightLbs = Number(weight.replace(',', '.'));

  const dobOk = age !== null && age >= MIN_AGE && age <= MAX_AGE;
  const weightOk = weight.trim() !== '' && weightLbs >= MIN_WEIGHT_LBS && weightLbs <= MAX_WEIGHT_LBS;

  const errors = {
    dob: submitted && !dobOk ? 'Enter a valid birth date as YYYY-MM-DD' : '',
    weight: submitted && !weightOk ? `Enter your weight in lbs (${MIN_WEIGHT_LBS} to ${MAX_WEIGHT_LBS})` : '',
  };

  const handleNext = () => {
    setSubmitted(true);
    if (!dobOk || !weightOk) return;
    navigation.navigate('EmergencyContact', {
      dateOfBirth: dob.trim(),
      weightKg: lbsToKg(weightLbs),
      firstName,
      lastName,
    });
  };

  return (
    <KeyboardAvoidingView style={common.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={common.content} keyboardShouldPersistTaps='handled'>
        <Text style={common.title}>About you</Text>
        <Text style={common.subtitle}>
          Step 2 of 4. We use your age and weight to estimate safe heart-rate limits on hikes.
        </Text>

        <TextField
          label='Date of birth'
          value={dob}
          onChangeText={setDob}
          placeholder='for example 1999-04-23'
          error={errors.dob}
          keyboardType='numbers-and-punctuation'
          autoCapitalize='none'
        />
        <Text style={common.subtitle}>Format: YYYY-MM-DD </Text>
        {dobOk ? <Text style={common.subtitle}>Age: {age}</Text> : null}

        <TextField
          label='Weight (lbs)'
          value={weight}
          onChangeText={setWeight}
          placeholder='150'
          error={errors.weight}
          keyboardType='decimal-pad'
        />

        <ActionButton title='Next' onPress={handleNext} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}