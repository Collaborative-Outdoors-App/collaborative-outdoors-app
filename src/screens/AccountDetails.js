import { View, Text } from "react-native";
import Button from '../components/Button';

export default function AccountDetails() {
  return (
    <View>
      <Button
        title="Personal Details"
      />
      <Button
        title="Change Password"
      />
      <Button
        title="Connect Wearable"
      />
      <Button
        title="Two-Step Verification"
      />
    </View>
  );
}
