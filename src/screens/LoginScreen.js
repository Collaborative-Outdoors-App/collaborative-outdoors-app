import { View } from 'react-native';
import Button from '../components/Button';

export default function LoginScreen({ navigation }) {
  return (
    <View>
      <Button
        title="Login"
        onPress={() => navigation.navigate('Home')}
      />
      <Button
        title="Signup"
        variant="secondary"
        onPress={() => navigation.navigate('Signup')}
      />
    </View>
  );
}