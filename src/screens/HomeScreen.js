import { View, Text } from 'react-native';
import Button from '../components/Button';

export default function HomeScreen({ navigation }) {
  return (
    <View>
      <Button
        title="Profile"
        onPress={() => navigation.navigate('Profile')}
      />
      <Button
        title="Groups"
        onPress={() => navigation.navigate('Groups')}
      />
      <Button
        title="Start Hike"
        onPress={() => navigation.navigate('TrailSearch')}
      />
    </View>
  );
}