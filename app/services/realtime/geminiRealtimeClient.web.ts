// Gemini Live API client for the web. Streams microphone audio as
// 16-bit PCM 16 kHz mono via a WebSocket and plays the model's PCM 24 kHz
// response back through the Web Audio API. The session is authenticated
// with an ephemeral token minted by the create-gemini-session Edge
// Function, so the real GEMINI_API_KEY never reaches the browser.

import { Scenario } from "../../types/scenario";
import { supabase } from "../supabase/client";
import { RealtimeEvent, RealtimeVoiceConnection, StartRealtimeVoiceOptions } from "./realtimeTypes";

type SessionTicket = {
  token: string;
  model: string;
  voice_name: string;
  voice_gender: "weiblich" | "männlich" | "neutral";
  expires_at?: string;
};

type GeminiConnection = RealtimeVoiceConnection & {
  webSocket: WebSocket;
  mediaStream: MediaStream;
};

const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;

async function fetchSessionTicket(voiceId?: string): Promise<SessionTicket> {
  const { data, error } = await supabase.functions.invoke<SessionTicket & { error?: string }>("create-gemini-session", {
    body: voiceId ? { voice: voiceId } : undefined
  });
  if (error) throw new Error(await extractFunctionErrorMessage(error));
  if (!data?.token) throw new Error(`Gemini-Session konnte nicht erstellt werden: ${safeStringify(data)}`);
  return data;
}

export async function startGeminiVoice(options: StartRealtimeVoiceOptions): Promise<GeminiConnection> {
  assertWebRtcSupport();
  options.onModeChange("connecting");

  const ticket = await fetchSessionTicket(options.voiceId);

  // Step 1 — mic capture via AudioWorklet. iOS Safari ignores the
  // sampleRate hint, so the worklet itself downsamples to 16 kHz.
  const AudioContextCtor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) throw new Error("Web Audio API wird nicht unterstützt.");
  const inputAudioContext = new AudioContextCtor({ sampleRate: INPUT_SAMPLE_RATE });
  if (inputAudioContext.state === "suspended") {
    await inputAudioContext.resume().catch(() => undefined);
  }
  if (!inputAudioContext.audioWorklet) {
    throw new Error("AudioWorklet wird in diesem Browser nicht unterstützt.");
  }
  await inputAudioContext.audioWorklet.addModule(makeWorkletUrl(recorderWorkletSource));

  const mediaStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      channelCount: 1,
      sampleRate: INPUT_SAMPLE_RATE
    }
  });
  const micSource = inputAudioContext.createMediaStreamSource(mediaStream);
  const recorder = new AudioWorkletNode(inputAudioContext, "pcm-recorder");
  micSource.connect(recorder);

  // Step 2 — open the WebSocket to Gemini using the ephemeral token.
  const ws = new WebSocket(
    `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?access_token=${encodeURIComponent(ticket.token)}`
  );
  ws.binaryType = "arraybuffer";

  // Step 3 — output audio playback queue (24 kHz PCM chunks). AudioBuffer
  // carries its own sample rate, so the browser resamples for us even if
  // the context itself runs at a different rate.
  const outputAudioContext = new AudioContextCtor({ sampleRate: OUTPUT_SAMPLE_RATE });
  if (outputAudioContext.state === "suspended") {
    await outputAudioContext.resume().catch(() => undefined);
  }
  let nextPlaybackTime = 0;
  const playbackSources: AudioBufferSourceNode[] = [];
  let micEnabled = true;

  const setMicEnabled = (enabled: boolean) => {
    micEnabled = enabled;
    mediaStream.getAudioTracks().forEach((track) => {
      if (track.enabled !== enabled) track.enabled = enabled;
    });
  };
  let unmuteTimeoutId: ReturnType<typeof setTimeout> | null = null;
  const scheduleUnmute = (delayMs: number) => {
    if (unmuteTimeoutId) clearTimeout(unmuteTimeoutId);
    unmuteTimeoutId = setTimeout(() => {
      setMicEnabled(true);
      unmuteTimeoutId = null;
    }, delayMs);
  };

  let assistantTranscriptBuffer = "";
  let userTranscriptBuffer = "";

  const enqueueOutputAudio = (pcm: Int16Array) => {
    if (!pcm.length) return;
    const float = new Float32Array(pcm.length);
    for (let i = 0; i < pcm.length; i++) float[i] = pcm[i] / 0x8000;
    const buffer = outputAudioContext.createBuffer(1, float.length, OUTPUT_SAMPLE_RATE);
    buffer.getChannelData(0).set(float);

    const source = outputAudioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(outputAudioContext.destination);

    const now = outputAudioContext.currentTime;
    const startAt = Math.max(now, nextPlaybackTime);
    source.start(startAt);
    nextPlaybackTime = startAt + buffer.duration;
    playbackSources.push(source);
    source.onended = () => {
      const idx = playbackSources.indexOf(source);
      if (idx >= 0) playbackSources.splice(idx, 1);
    };
  };

  const stopOutputPlayback = () => {
    while (playbackSources.length) {
      const src = playbackSources.pop();
      try {
        src?.stop();
      } catch {
        // ignore
      }
    }
    nextPlaybackTime = outputAudioContext.currentTime;
  };

  // Wire mic chunks → WebSocket.
  recorder.port.onmessage = (event) => {
    if (!micEnabled || ws.readyState !== WebSocket.OPEN) return;
    const pcm = new Int16Array(event.data as ArrayBuffer);
    const base64 = arrayBufferToBase64(pcm.buffer);
    ws.send(
      JSON.stringify({
        realtimeInput: {
          audio: { data: base64, mimeType: `audio/pcm;rate=${INPUT_SAMPLE_RATE}` }
        }
      })
    );
  };

  // Setup + open handler.
  ws.addEventListener("open", () => {
    ws.send(
      JSON.stringify({
        setup: {
          model: ticket.model,
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: ticket.voice_name }
              }
            }
          },
          systemInstruction: {
            parts: [{ text: buildInstructions(options.scenario, ticket.voice_gender) }]
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          realtimeInputConfig: {
            automaticActivityDetection: {
              disabled: false,
              silenceDurationMs: 1200,
              prefixPaddingMs: 300
            }
          }
        }
      })
    );
  });

  ws.addEventListener("message", (event) => {
    let payload: Record<string, unknown> | null = null;
    try {
      payload = JSON.parse(typeof event.data === "string" ? event.data : new TextDecoder().decode(event.data as ArrayBuffer));
    } catch {
      return;
    }
    if (!payload) return;

    // First successful setup ack — request the AI to open in role.
    if (payload.setupComplete !== undefined) {
      options.onModeChange("connected");
      options.onEvent({ type: "session.ready" });
      ws.send(
        JSON.stringify({
          clientContent: {
            turns: [
              { role: "user", parts: [{ text: buildOpeningInstruction(options.scenario, ticket.voice_gender) }] }
            ],
            turnComplete: true
          }
        })
      );
      return;
    }

    const sc = (payload as { serverContent?: Record<string, unknown> }).serverContent;
    if (!sc) return;

    const modelTurn = sc.modelTurn as { parts?: Array<{ inlineData?: { data?: string; mimeType?: string }; text?: string }> } | undefined;
    if (modelTurn?.parts?.length) {
      for (const part of modelTurn.parts) {
        if (part.inlineData?.data && part.inlineData.mimeType?.startsWith("audio/pcm")) {
          if (micEnabled) setMicEnabled(false);
          options.onModeChange("speaking");
          const pcm = base64ToInt16(part.inlineData.data);
          enqueueOutputAudio(pcm);
        }
      }
    }

    const inputTranscription = sc.inputTranscription as { text?: string; finished?: boolean } | undefined;
    if (inputTranscription?.text) {
      userTranscriptBuffer += inputTranscription.text;
      if (inputTranscription.finished) {
        const finalText = userTranscriptBuffer.trim();
        userTranscriptBuffer = "";
        if (finalText) {
          options.onEvent({
            type: "conversation.item.input_audio_transcription.completed",
            transcript: finalText,
            item_id: `user-${Date.now()}`
          });
        }
      }
    }

    const outputTranscription = sc.outputTranscription as { text?: string; finished?: boolean } | undefined;
    if (outputTranscription?.text) {
      assistantTranscriptBuffer += outputTranscription.text;
      if (outputTranscription.finished) {
        const finalText = assistantTranscriptBuffer.trim();
        assistantTranscriptBuffer = "";
        if (finalText) {
          options.onEvent({
            type: "response.audio_transcript.done",
            transcript: finalText,
            item_id: `assistant-${Date.now()}`
          });
        }
      }
    }

    if (sc.interrupted) {
      stopOutputPlayback();
      assistantTranscriptBuffer = "";
    }

    if (sc.turnComplete) {
      options.onEvent({ type: "response.done" });
      // Let the speaker drain before re-opening the mic.
      scheduleUnmute(1500);
      options.onModeChange("connected");
    }
  });

  ws.addEventListener("error", () => {
    options.onModeChange("error");
    options.onEvent({ type: "error", message: "WebSocket-Fehler" });
  });
  ws.addEventListener("close", () => {
    options.onModeChange("idle");
  });

  const connection: GeminiConnection = {
    webSocket: ws,
    mediaStream,
    sendEvent: (event: RealtimeEvent) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(event));
    },
    stop: () => {
      try {
        recorder.disconnect();
        micSource.disconnect();
      } catch {
        // ignore
      }
      mediaStream.getTracks().forEach((track) => track.stop());
      stopOutputPlayback();
      try {
        ws.close();
      } catch {
        // ignore
      }
      void inputAudioContext.close().catch(() => undefined);
      void outputAudioContext.close().catch(() => undefined);
      options.onModeChange("idle");
    }
  };

  return connection;
}

function buildInstructions(scenario?: Scenario | null, gender?: "weiblich" | "männlich" | "neutral") {
  const genderHint = (() => {
    if (gender === "männlich") return "Deine Stimme klingt männlich. Wenn du dich vorstellst und das Szenario keinen Namen vorgibt, nutze einen männlichen Vornamen. Beziehe dich auf dich selbst nur in maskulinen Formen.";
    if (gender === "weiblich") return "Deine Stimme klingt weiblich. Wenn du dich vorstellst und das Szenario keinen Namen vorgibt, nutze einen weiblichen Vornamen. Beziehe dich auf dich selbst nur in femininen Formen.";
    return "Wenn du dich vorstellst und das Szenario keinen Namen vorgibt, wähle einen Vornamen, der zu deiner Stimme passt.";
  })();

  if (!scenario) {
    return [
      "Du bist ein realistischer deutschsprachiger Gesprächspartner für ein Voice-Roleplay.",
      "Bleibe im Charakter, antworte kurz, natürlich und menschlich.",
      "Frage NICHT, worüber gesprochen werden soll — eröffne das Gespräch selbst passend zur Situation.",
      "Gib während des Gesprächs kein Coaching-Feedback und keine Meta-Kommentare.",
      genderHint
    ].join(" ");
  }

  return [
    "Du übernimmst jetzt eine Rolle in einem deutschsprachigen Voice-Roleplay. Bleib durchgehend im Charakter und sprich Deutsch.",
    `Szenario: ${scenario.title}.`,
    `Situation: ${scenario.situation}`,
    `Deine Rolle und Verhalten: ${scenario.system_prompt}`,
    `Ziel des Nutzers in dieser Übung: ${scenario.goal}`,
    genderHint,
    "Sehr wichtig:",
    "- Eröffne das Gespräch sofort im Charakter, passend zur Situation. Frage NIEMALS 'Worüber willst du sprechen?' oder 'Wie kann ich dir helfen?'.",
    "- Bleib in der Rolle. Brich nicht aus, nenne dich nicht KI, gib keine Coaching-Tipps oder Meta-Kommentare während des Gesprächs.",
    "- Antworte kurz, menschlich und konversationell, mit gelegentlichen offenen Rückfragen.",
    "- Wenn der Nutzer kurz oder unsicher antwortet, hilf ihm sanft weiter, ohne aus der Rolle zu fallen."
  ].join("\n");
}

function buildOpeningInstruction(scenario?: Scenario | null, gender?: "weiblich" | "männlich" | "neutral") {
  const genderHint = (() => {
    if (gender === "männlich") return "Sprich mit männlicher Stimme und stelle dich gegebenenfalls mit einem männlichen Vornamen vor.";
    if (gender === "weiblich") return "Sprich mit weiblicher Stimme und stelle dich gegebenenfalls mit einem weiblichen Vornamen vor.";
    return "Stelle dich gegebenenfalls mit einem Vornamen vor, der zu deiner Stimme passt.";
  })();

  if (!scenario) {
    return `Eröffne jetzt das Gespräch sofort im Charakter mit einem kurzen, natürlichen Einstiegssatz auf Deutsch. Stelle keine Meta-Frage. ${genderHint}`;
  }
  return [
    `Eröffne jetzt das Roleplay sofort im Charakter mit einem kurzen, natürlichen Einstiegssatz auf Deutsch, der zur Situation '${scenario.situation}' passt.`,
    "Sprich aus der Rolle heraus, nicht als Assistent. Stelle keine Meta-Fragen.",
    genderHint
  ].join(" ");
}

function assertWebRtcSupport() {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new Error("Dieser Browser unterstützt keinen Mikrofonzugriff über getUserMedia.");
  }
  if (typeof window === "undefined" || !window.AudioContext) {
    throw new Error("Dieser Browser unterstützt die Web Audio API nicht.");
  }
}

// AudioWorklet code: takes mono Float32 frames at whatever rate the
// AudioContext is actually running (iOS Safari ignores our 16 kHz hint
// and uses 44.1 / 48 kHz), downsamples to 16 kHz, converts to Int16 PCM
// and posts ArrayBuffers back to the main thread. Loaded via a Blob URL
// so the bundler does not need to know about a separate worklet file.
const recorderWorkletSource = `
class PcmRecorder extends AudioWorkletProcessor {
  constructor() {
    super();
    this.targetRate = 16000;
    this.sourceRate = sampleRate;
    this.ratio = this.sourceRate / this.targetRate;
    this.tail = [];
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;
    const channel = input[0];

    // Append new samples to whatever was left over from the previous block.
    const total = this.tail.length + channel.length;
    const merged = new Float32Array(total);
    if (this.tail.length) merged.set(this.tail, 0);
    merged.set(channel, this.tail.length);

    // Decide how many output samples fit using a sliding source pointer.
    const ratio = this.ratio;
    const outSamples = Math.floor((total - 1) / ratio) + 1;
    if (outSamples <= 0) {
      this.tail = Array.from(merged);
      return true;
    }

    const pcm = new Int16Array(outSamples);
    let lastConsumed = 0;
    for (let i = 0; i < outSamples; i++) {
      const srcIndex = i * ratio;
      const idx = Math.floor(srcIndex);
      const frac = srcIndex - idx;
      const next = idx + 1 < total ? merged[idx + 1] : merged[idx];
      const sample = merged[idx] * (1 - frac) + next * frac;
      const clipped = Math.max(-1, Math.min(1, sample));
      pcm[i] = clipped < 0 ? clipped * 0x8000 : clipped * 0x7fff;
      lastConsumed = idx + 1;
    }

    // Keep any unprocessed samples so the next block continues smoothly.
    if (lastConsumed < total) {
      this.tail = Array.from(merged.subarray(lastConsumed));
    } else {
      this.tail = [];
    }

    this.port.postMessage(pcm.buffer, [pcm.buffer]);
    return true;
  }
}
registerProcessor('pcm-recorder', PcmRecorder);
`;

function makeWorkletUrl(source: string): string {
  const blob = new Blob([source], { type: "application/javascript" });
  return URL.createObjectURL(blob);
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

function base64ToInt16(base64: string): Int16Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Int16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 2);
}

async function extractFunctionErrorMessage(error: unknown): Promise<string> {
  const fallback = error instanceof Error ? error.message : "Realtime-Session konnte nicht erstellt werden.";
  const response = (error as { context?: { response?: Response } })?.context?.response;
  if (!response) return fallback;
  try {
    const body = await response.clone().json();
    if (typeof body?.error === "string") return body.error;
  } catch {
    // ignore
  }
  return fallback;
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value) ?? "(leer)";
  } catch {
    return String(value);
  }
}
