import { View } from 'react-native';
import Button from '../components/Button';

export default function SignupScreen({ navigation }) {
  return (
    <View>
      <Button
        title="Create Account"
        onPress={() => navigation.goBack()}
      />
    </View>
  );
}