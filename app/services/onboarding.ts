import AsyncStorage from "@react-native-async-storage/async-storage";

const onboardingKey = "rhetocoach-onboarding-seen";

export async function getOnboardingSeen() {
  const value = await AsyncStorage.getItem(onboardingKey);
  return value === "true";
}

export async function setOnboardingSeen() {
  await AsyncStorage.setItem(onboardingKey, "true");
}
