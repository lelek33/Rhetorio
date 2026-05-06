import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, View, ViewStyle } from "react-native";

import { RealtimeMode } from "../services/realtime/realtimeTypes";

type Props = {
  mode: RealtimeMode;
  onPress?: () => void;
};

export function VoiceOrb({ mode, onPress }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;

    const config = (() => {
      switch (mode) {
        case "speaking":
          return { peak: 1.18, trough: 0.96, duration: 320, opacity: 1 };
        case "connecting":
          return { peak: 1.08, trough: 0.94, duration: 700, opacity: 0.85 };
        case "connected":
          return { peak: 1.05, trough: 0.97, duration: 1800, opacity: 0.95 };
        case "error":
          return { peak: 1, trough: 1, duration: 2000, opacity: 0.5 };
        default:
          return { peak: 1.04, trough: 0.97, duration: 2200, opacity: 0.65 };
      }
    })();

    Animated.timing(opacity, {
      toValue: config.opacity,
      duration: 250,
      useNativeDriver: true
    }).start();

    if (config.peak !== config.trough) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(scale, { toValue: config.peak, duration: config.duration, useNativeDriver: true }),
          Animated.timing(scale, { toValue: config.trough, duration: config.duration, useNativeDriver: true })
        ])
      );
      loop.start();
    } else {
      Animated.timing(scale, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    }

    return () => loop?.stop();
  }, [mode, scale, opacity]);

  const interactive = Boolean(onPress);

  return (
    <Pressable
      onPress={onPress}
      disabled={!interactive}
      style={styles.container}
      accessibilityRole="button"
      accessibilityLabel="Voice starten"
    >
      <Animated.View style={[styles.aura, { opacity, transform: [{ scale }] }]} />
      <Animated.View style={[styles.orbWrap, { opacity, transform: [{ scale }] }]}>
        <View style={[styles.orb, orbGradient]} />
        <View style={styles.highlightBig} />
        <View style={styles.highlightSmall} />
      </Animated.View>
    </Pressable>
  );
}

const orbGradient: ViewStyle = {
  // React Native Web passes unknown style keys straight to the underlying
  // <div>, so we can use a CSS radial gradient and box-shadow to get the
  // glassy iridescent look without an SVG/gradient library.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...({
    background:
      "radial-gradient(circle at 32% 28%, #ffffff 0%, #e2e8ff 18%, #b8c2ff 42%, #8d7bff 72%, #b683ff 100%)",
    boxShadow:
      "0 0 60px 18px rgba(155, 130, 255, 0.35), inset -20px -30px 50px rgba(110, 80, 200, 0.35), inset 20px 30px 60px rgba(255, 255, 255, 0.55)"
  } as ViewStyle)
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32
  },
  aura: {
    position: "absolute",
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: "rgba(155, 130, 255, 0.18)"
  },
  orbWrap: {
    width: 240,
    height: 240,
    alignItems: "center",
    justifyContent: "center"
  },
  orb: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "#a8b3ff"
  },
  highlightBig: {
    position: "absolute",
    top: 28,
    left: 56,
    width: 70,
    height: 38,
    borderRadius: 35,
    backgroundColor: "rgba(255, 255, 255, 0.55)",
    transform: [{ rotate: "-25deg" }]
  },
  highlightSmall: {
    position: "absolute",
    top: 70,
    left: 56,
    width: 22,
    height: 14,
    borderRadius: 11,
    backgroundColor: "rgba(255, 255, 255, 0.7)"
  }
});
