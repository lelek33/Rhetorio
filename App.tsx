import "react-native-gesture-handler";
import "react-native-url-polyfill/auto";

import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";

import { AppNavigator } from "./app/navigation/AppNavigator";
import { AuthProvider, useAuth } from "./app/hooks/useAuth";
import { colors } from "./app/constants/colors";

export default function App() {
  return (
    <AuthProvider>
      <RootNavigation />
    </AuthProvider>
  );
}

function RootNavigation() {
  const { user, passwordRecovery } = useAuth();
  const navigationKey = passwordRecovery ? "recovery" : user ? "app" : "auth";

  return (
    <NavigationContainer key={navigationKey}>
      <StatusBar style="dark" backgroundColor={colors.background} />
      <AppNavigator />
    </NavigationContainer>
  );
}
