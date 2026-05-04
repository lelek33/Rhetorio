import "react-native-gesture-handler";
import "react-native-url-polyfill/auto";

import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppNavigator } from "./app/navigation/AppNavigator";
import { AuthProvider, useAuth } from "./app/hooks/useAuth";
import { colors } from "./app/constants/colors";

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <RootNavigation />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
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
