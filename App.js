import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import AppHeader from "./src/components/AppHeader";
import GroupScreen from "./src/screens/GroupScreen";
import AccountDetails from "./src/screens/AccountDetails";
import Achievements from "./src/screens/Achievements";
import ActivityTrends from "./src/screens/ActivityTrends";
import ChangePasswordScreen from "./src/screens/ChangePassword";
import EmergencyNotifiedScreen from "./src/screens/EmergencyNotifiedScreen";
import GroupChatScreen from "./src/screens/GroupChatScreen";
import HealthDetailsScreen from "./src/screens/HealthDetails";
import HomeScreen from "./src/screens/HomeScreen";
import LoginScreen from "./src/screens/LoginScreen";
import MFASetup from "./src/screens/MFA-Setup";
import OverexertionAlertScreen from "./src/screens/OverexertionAlert";
import PersonalDetails from "./src/screens/PersonalDetails";
import PersonalRecords from "./src/screens/PersonalRecords";
import ProfileScreen from "./src/screens/ProfileScreen";
import SignupScreen from "./src/screens/SignupScreen";
import TrailSearchScreen from "./src/screens/TrailSearchScreen";
import TwoStepSetup from "./src/screens/TwoStepSetup";
import TwoStepVerification from "./src/screens/TwoStepVerification";
import WearableSetup from "./src/screens/WearableSetup";
import ForgotPasswordScreen from "./src/screens/ForgotPassword";
import AboutYouScreen from './src/screens/AboutYouScreen';
import EmergencyContactScreen from './src/screens/EmergencyContactScreen';
import VerifyEmailScreen from './src/screens/VerifyEmailScreen';
import { WearableProvider } from './src/wearable/WearableContext';
import { navigationRef } from './src/utils/navigationRef';
import { AuthProvider, useAuth } from "./src/auth/authContext";
import { ActiveHikeProvider } from "./src/context/ActiveHikeContext";
import ActiveHikeBanner from "./src/components/ActiveHikeBanner";

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { user, checking } = useAuth();
  if (checking) return null;

  return (
    <NavigationContainer ref={navigationRef}>
      <ActiveHikeBanner />
      <Stack.Navigator
        initialRouteName={user ? "Home" : "Login"}
        screenOptions={{
          header: (props) => <AppHeader {...props} />,
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Groups" component={GroupScreen} />
        <Stack.Screen name="GroupChat" component={GroupChatScreen} options={{ title: "Group chat" }} />
        <Stack.Screen name="TrailSearch" component={TrailSearchScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AccountDetails" component={AccountDetails} />
        <Stack.Screen name="Achievements" component={Achievements} />
        <Stack.Screen name="ActivityTrends" component={ActivityTrends} />
        <Stack.Screen name="TwoStepSetup" component={TwoStepSetup} />
        <Stack.Screen name="TwoStepVerification" component={TwoStepVerification} />
        <Stack.Screen name="PersonalRecords" component={PersonalRecords} />
        <Stack.Screen name="PersonalDetails" component={PersonalDetails} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
        <Stack.Screen name="ConnectWearable" component={WearableSetup} />
        <Stack.Screen name="MFASetup" component={MFASetup} />
        <Stack.Screen name="HealthDetails" component={HealthDetailsScreen} />
        <Stack.Screen name="OverexertionAlert" component={OverexertionAlertScreen} />
        <Stack.Screen name="EmergencyNotified" component={EmergencyNotifiedScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name='AboutYou' component={AboutYouScreen} options={{ headerBackVisible: false }} />
        <Stack.Screen name='EmergencyContact' component={EmergencyContactScreen} />   
        <Stack.Screen name='VerifyEmail' component={VerifyEmailScreen} options={{ headerBackVisible: false, title: 'Verify email' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <WearableProvider>
        <ActiveHikeProvider>
          <StatusBar style="auto" />
          <RootNavigator />
        </ActiveHikeProvider>
      </WearableProvider>
    </AuthProvider>
  );
}