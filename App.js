import { StatusBar } from "expo-status-bar";
import { StyleSheet } from "react-native";

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import AppHeader from "./src/components/AppHeader";

import LoginScreen from "./src/screens/LoginScreen";
import SignupScreen from "./src/screens/SignupScreen";
import HomeScreen from "./src/screens/HomeScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import GroupsScreen from "./src/screens/GroupsScreen";
import GroupChatScreen from "./src/screens/GroupChatScreen";
import TrailSearchScreen from "./src/screens/TrailSearchScreen";
import AccountDetails from "./src/screens/AccountDetails";
import Achievements from "./src/screens/Achievements";
import ActivityTrends from "./src/screens/ActivityTrends";
import PersonalRecords from "./src/screens/PersonalRecords";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <>
      <StatusBar style="auto" />
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            header: (props) => <AppHeader {...props} />,
          }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Groups" component={GroupsScreen} />
          <Stack.Screen name="GroupChat" component={GroupChatScreen} options={{ title: "Group chat" }} />
          <Stack.Screen name="TrailSearch" component={TrailSearchScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AccountDetails" component={AccountDetails} />
          <Stack.Screen name="Achievements" component={Achievements} />
          <Stack.Screen name="ActivityTrends" component={ActivityTrends} />
          <Stack.Screen name="PersonalRecords" component={PersonalRecords} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}