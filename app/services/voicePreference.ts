import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

export type VoiceGender = "weiblich" | "männlich" | "neutral";

export type VoiceOption = {
  id: string;
  label: string;
  description: string;
  gender: VoiceGender;
};

export const voiceOptions: VoiceOption[] = [
  { id: "marin", label: "Marin", description: "Warm, freundlich", gender: "weiblich" },
  { id: "coral", label: "Coral", description: "Lebhaft, jung", gender: "weiblich" },
  { id: "cedar", label: "Cedar", description: "Ruhig, tief", gender: "männlich" },
  { id: "ash", label: "Ash", description: "Locker, modern", gender: "männlich" }
];

export const defaultVoiceId = "marin";

const storageKey = "rhetocoach-voice";

export function getVoiceOption(voiceId: string | undefined | null): VoiceOption {
  if (!voiceId) return voiceOptions[0];
  return voiceOptions.find((option) => option.id === voiceId) ?? voiceOptions[0];
}

export async function getVoicePreference(): Promise<string> {
  try {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      return window.localStorage.getItem(storageKey) ?? defaultVoiceId;
    }
    const value = await AsyncStorage.getItem(storageKey);
    return value ?? defaultVoiceId;
  } catch {
    return defaultVoiceId;
  }
}

export async function setVoicePreference(voiceId: string) {
  try {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, voiceId);
      return;
    }
    await AsyncStorage.setItem(storageKey, voiceId);
  } catch {
    // ignore — preference will fall back to default on next read
  }
}
