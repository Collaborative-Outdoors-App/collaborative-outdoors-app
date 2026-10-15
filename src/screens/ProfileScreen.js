import { View, Text } from 'react-native';
import Button from '../components/Button';

export default function ProfileScreen({ navigation }) {
  return (
    <View>
      <Button
        title="Account Details"
        onPress={() => navigation.navigate('AccountDetails')}
      />
      <Button 
        title="Activity Trends"
        onPress={() => navigation.navigate('ActivityTrends')}
      />
      <Button
        title="Achievements"
        onPress={() => navigation.navigate('Achievements')}
      />
    </View>
  );
}