import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Clock3, Dumbbell, Home, User } from "lucide-react-native";

import { colors } from "../constants/colors";
import { HistoryScreen } from "../screens/HistoryScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { TrainingScreen } from "../screens/TrainingScreen";
import { MainTabParamList } from "./types";

const Tab = createBottomTabNavigator<MainTabParamList>();

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          borderTopColor: colors.border,
          backgroundColor: colors.card,
          height: 68,
          paddingTop: 8,
          paddingBottom: 10
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "700" }
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: ({ color }) => <Home color={color} size={21} /> }} />
      <Tab.Screen name="Training" component={TrainingScreen} options={{ tabBarIcon: ({ color }) => <Dumbbell color={color} size={21} /> }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ title: "Verlauf", tabBarIcon: ({ color }) => <Clock3 color={color} size={21} /> }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: "Profil", tabBarIcon: ({ color }) => <User color={color} size={21} /> }} />
    </Tab.Navigator>
  );
}
