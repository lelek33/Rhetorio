import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const onboardingKey = "rhetocoach-onboarding-seen";

export async function getOnboardingSeen() {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return window.localStorage.getItem(onboardingKey) === "true";
  }

  const value = await AsyncStorage.getItem(onboardingKey);
  return value === "true";
}

export async function setOnboardingSeen() {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.localStorage.setItem(onboardingKey, "true");
    return;
  }

  await AsyncStorage.setItem(onboardingKey, "true");
}
