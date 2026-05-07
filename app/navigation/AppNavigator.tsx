import { ActivityIndicator, View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { colors } from "../constants/colors";
import { useAuth } from "../hooks/useAuth";
import { AnalysisScreen } from "../screens/AnalysisScreen";
import { AuthScreen } from "../screens/AuthScreen";
import { CustomTrainingScreen } from "../screens/CustomTrainingScreen";
import { ScenarioDetailScreen } from "../screens/ScenarioDetailScreen";
import { SessionScreen } from "../screens/SessionScreen";
import { UpgradeScreen } from "../screens/UpgradeScreen";
import { AuthNavigator } from "./AuthNavigator";
import { TabNavigator } from "./TabNavigator";
import { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const { user, loading, passwordRecovery } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!user) return <AuthNavigator />;
  if (passwordRecovery) return <AuthScreen />;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="ScenarioDetail" component={ScenarioDetailScreen} />
      <Stack.Screen name="Session" component={SessionScreen} />
      <Stack.Screen name="Analysis" component={AnalysisScreen} />
      <Stack.Screen name="Upgrade" component={UpgradeScreen} />
      <Stack.Screen name="CustomTraining" component={CustomTrainingScreen} />
    </Stack.Navigator>
  );
}
