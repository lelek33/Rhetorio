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
      </Animated.View>
    </Pressable>
  );
}

const orbGradient: ViewStyle = {
  // React Native Web passes unknown style keys through to the rendered
  // <div>, so we use stacked CSS radial gradients to build the glassy
  // iridescent look without an SVG/gradient library. Order matters: the
  // first layer is on top.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...({
    background: [
      "radial-gradient(ellipse 65% 55% at 24% 78%, rgba(150, 95, 230, 0.55), rgba(180, 130, 240, 0.2) 40%, rgba(180, 130, 240, 0) 70%)",
      "radial-gradient(ellipse 50% 45% at 58% 24%, rgba(150, 220, 255, 0.7), rgba(195, 235, 255, 0.32) 50%, rgba(195, 235, 255, 0) 78%)",
      "radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.92) 0%, rgba(228, 238, 252, 0.7) 55%, rgba(208, 222, 248, 0.55) 100%)"
    ].join(", "),
    boxShadow: [
      "0 28px 60px -18px rgba(140, 110, 220, 0.42)",
      "inset 0 0 0 1.5px rgba(255, 255, 255, 0.88)",
      "inset -18px -22px 50px rgba(170, 140, 230, 0.18)",
      "inset 18px 18px 60px rgba(255, 255, 255, 0.55)"
    ].join(", ")
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
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: "rgba(180, 200, 255, 0.14)"
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
    backgroundColor: "#eef3ff"
  }
});
