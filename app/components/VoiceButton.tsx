import { Mic, MicOff } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../constants/colors";

type Props = {
  enabled?: boolean;
  recording?: boolean;
  onPress?: () => void;
};

export function VoiceButton({ enabled = false, recording = false, onPress }: Props) {
  return (
    <View style={styles.wrap}>
      <Pressable disabled={!enabled} onPress={onPress} style={[styles.button, !enabled && styles.disabled]}>
        {recording ? <MicOff color={colors.card} /> : <Mic color={colors.card} />}
      </Pressable>
      <Text style={styles.label}>{enabled ? "Sprache" : "Voice bald"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    gap: 6
  },
  button: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center"
  },
  disabled: {
    backgroundColor: colors.border
  },
  label: {
    color: colors.muted,
    fontSize: 12
  }
});
