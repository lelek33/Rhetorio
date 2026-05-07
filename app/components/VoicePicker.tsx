import { Pause, Play } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../constants/colors";
import { supabase } from "../services/supabase/client";
import { VoiceOption, voiceOptions } from "../services/voicePreference";

type Props = {
  value: string;
  onChange: (voiceId: string) => void;
  title?: string;
  subtitle?: string;
};

type SampleState = "idle" | "loading" | "playing" | "error";

export function VoicePicker({ value, onChange, title, subtitle }: Props) {
  const [sampleStates, setSampleStates] = useState<Record<string, SampleState>>({});
  const cacheRef = useRef<Record<string, string>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activeVoiceRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
      Object.values(cacheRef.current).forEach((url) => URL.revokeObjectURL(url));
      cacheRef.current = {};
    };
  }, []);

  function setVoiceState(voiceId: string, state: SampleState) {
    setSampleStates((prev) => ({ ...prev, [voiceId]: state }));
  }

  function stopActive() {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    if (activeVoiceRef.current) {
      setVoiceState(activeVoiceRef.current, "idle");
      activeVoiceRef.current = null;
    }
  }

  async function previewVoice(voiceId: string) {
    if (typeof window === "undefined") return;

    if (activeVoiceRef.current === voiceId && audioRef.current && !audioRef.current.paused) {
      stopActive();
      return;
    }

    if (activeVoiceRef.current && activeVoiceRef.current !== voiceId) {
      stopActive();
    }

    let objectUrl = cacheRef.current[voiceId];
    if (!objectUrl) {
      setVoiceState(voiceId, "loading");
      try {
        const { data, error } = await supabase.functions.invoke<Blob>("voice-sample", {
          body: { voice: voiceId }
        });
        if (error) throw error;
        const blob = data instanceof Blob ? data : new Blob([data as ArrayBuffer], { type: "audio/mpeg" });
        objectUrl = URL.createObjectURL(blob);
        cacheRef.current[voiceId] = objectUrl;
      } catch {
        setVoiceState(voiceId, "error");
        setTimeout(() => setVoiceState(voiceId, "idle"), 1500);
        return;
      }
    }

    const audio = new Audio(objectUrl);
    audioRef.current = audio;
    activeVoiceRef.current = voiceId;
    setVoiceState(voiceId, "playing");

    audio.addEventListener("ended", () => {
      if (activeVoiceRef.current === voiceId) {
        activeVoiceRef.current = null;
        setVoiceState(voiceId, "idle");
      }
    });
    audio.addEventListener("error", () => {
      setVoiceState(voiceId, "error");
      setTimeout(() => setVoiceState(voiceId, "idle"), 1500);
    });

    try {
      await audio.play();
    } catch {
      setVoiceState(voiceId, "error");
      setTimeout(() => setVoiceState(voiceId, "idle"), 1500);
    }
  }

  return (
    <View style={styles.wrap}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <View style={styles.grid}>
        {voiceOptions.map((option) => (
          <VoiceCard
            key={option.id}
            option={option}
            selected={option.id === value}
            sampleState={sampleStates[option.id] ?? "idle"}
            onSelect={() => onChange(option.id)}
            onPreview={() => previewVoice(option.id)}
          />
        ))}
      </View>
    </View>
  );
}

type VoiceCardProps = {
  option: VoiceOption;
  selected: boolean;
  sampleState: SampleState;
  onSelect: () => void;
  onPreview: () => void;
};

function VoiceCard({ option, selected, sampleState, onSelect, onPreview }: VoiceCardProps) {
  return (
    <View style={[styles.card, selected && styles.cardSelected]}>
      <Pressable onPress={onSelect} style={styles.cardBody}>
        <Text style={[styles.cardLabel, selected && styles.cardLabelSelected]}>{option.label}</Text>
        <Text style={[styles.cardGender, selected && styles.cardGenderSelected]}>{option.gender}</Text>
        <Text style={[styles.cardDescription, selected && styles.cardDescriptionSelected]}>{option.description}</Text>
      </Pressable>
      <Pressable
        onPress={onPreview}
        style={[styles.previewButton, selected && styles.previewButtonSelected]}
        accessibilityLabel={`${option.label} anhören`}
        hitSlop={6}
      >
        {sampleState === "loading" ? (
          <ActivityIndicator color={selected ? colors.card : colors.accent} size="small" />
        ) : sampleState === "playing" ? (
          <Pause color={selected ? colors.card : colors.accent} size={16} />
        ) : (
          <Play color={selected ? colors.card : colors.accent} size={16} />
        )}
        <Text style={[styles.previewText, selected && styles.previewTextSelected]}>
          {sampleState === "playing" ? "Stop" : "Hören"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10
  },
  title: {
    color: colors.primary,
    fontWeight: "800",
    fontSize: 17
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  card: {
    flexBasis: "47%",
    flexGrow: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10
  },
  cardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.softAccent
  },
  cardBody: {
    gap: 2
  },
  cardLabel: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "800"
  },
  cardLabelSelected: {
    color: colors.accent
  },
  cardGender: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  cardGenderSelected: {
    color: colors.accent
  },
  cardDescription: {
    color: colors.text,
    fontSize: 13
  },
  cardDescriptionSelected: {
    color: colors.primary
  },
  previewButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border
  },
  previewButtonSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent
  },
  previewText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "700"
  },
  previewTextSelected: {
    color: colors.card
  }
});
