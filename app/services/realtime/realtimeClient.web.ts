import { supabase } from "../supabase/client";
import { Scenario } from "../../types/scenario";
import { RealtimeEvent, RealtimeSessionToken, RealtimeVoiceConnection, StartRealtimeVoiceOptions } from "./realtimeTypes";

type WebRealtimeConnection = RealtimeVoiceConnection & {
  peerConnection: RTCPeerConnection;
  mediaStream: MediaStream;
  audioElement: HTMLAudioElement;
  dataChannel: RTCDataChannel;
};

const realtimeCallsUrl = "https://api.openai.com/v1/realtime/calls";

export async function createRealtimeSession(): Promise<RealtimeSessionToken> {
  const { data, error } = await supabase.functions.invoke<RealtimeSessionToken>("create-realtime-session");
  if (error) throw new Error(await extractFunctionErrorMessage(error));
  if (!data?.client_secret?.value) {
    throw new Error(`Realtime-Antwort unvollständig: ${safeStringify(data)}`);
  }
  return data;
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value) ?? "(leer)";
  } catch {
    return String(value);
  }
}

async function extractFunctionErrorMessage(error: unknown): Promise<string> {
  const fallback = error instanceof Error ? error.message : "Realtime-Session konnte nicht erstellt werden.";
  const response = (error as { context?: { response?: Response } })?.context?.response;
  if (!response) return fallback;
  try {
    const body = await response.clone().json();
    if (typeof body?.error === "string") return body.error;
    if (typeof body?.message === "string") return body.message;
  } catch {
    try {
      const text = await response.clone().text();
      if (text) return text;
    } catch {
      // ignore
    }
  }
  return fallback;
}

export async function startRealtimeVoice(options: StartRealtimeVoiceOptions): Promise<WebRealtimeConnection> {
  assertWebRtcSupport();
  options.onModeChange("connecting");

  const pc = new RTCPeerConnection();
  const audioElement = new Audio();
  audioElement.autoplay = true;
  let mediaStream: MediaStream | null = null;
  let dataChannel: RTCDataChannel | null = null;

  try {
    const token = await createRealtimeSession();

    pc.ontrack = (event) => {
      audioElement.srcObject = event.streams[0];
      audioElement.play().catch(() => {
        options.onEvent({ type: "audio.autoplay_blocked" });
      });
    };

    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });
    mediaStream.getAudioTracks().forEach((track) => pc.addTrack(track, mediaStream as MediaStream));

    dataChannel = pc.createDataChannel("oai-events");
    dataChannel.addEventListener("open", () => {
      options.onModeChange("connected");
      const channel = dataChannel as RTCDataChannel;
      sendJson(channel, {
        type: "session.update",
        session: {
          instructions: buildInstructions(options.scenario),
          input_audio_transcription: {
            model: "whisper-1"
          },
          turn_detection: {
            type: "semantic_vad",
            eagerness: "low",
            create_response: true,
            interrupt_response: false
          }
        }
      });
      sendJson(channel, {
        type: "response.create",
        response: {
          instructions: buildOpeningInstruction(options.scenario)
        }
      });
    });
    dataChannel.addEventListener("message", (event) => handleEvent(event.data, options));
    dataChannel.addEventListener("error", () => options.onModeChange("error"));
    dataChannel.addEventListener("close", () => options.onModeChange("idle"));

    const offer = await pc.createOffer({ offerToReceiveAudio: true });
    await pc.setLocalDescription(offer);

    if (!offer.sdp) throw new Error("Browser konnte kein WebRTC SDP Offer erzeugen.");

    const sdpResponse = await fetch(realtimeCallsUrl, {
      method: "POST",
      body: offer.sdp,
      headers: {
        Authorization: `Bearer ${token.client_secret.value}`,
        "Content-Type": "application/sdp"
      }
    });

    if (!sdpResponse.ok) {
      throw new Error(await sdpResponse.text());
    }

    await pc.setRemoteDescription({ type: "answer", sdp: await sdpResponse.text() });

    return {
      peerConnection: pc,
      mediaStream,
      audioElement,
      dataChannel,
      sendEvent: (event: RealtimeEvent) => sendJson(dataChannel as RTCDataChannel, event),
      stop: () => {
        cleanupWebRtc(pc, mediaStream as MediaStream, audioElement, dataChannel as RTCDataChannel);
        options.onModeChange("idle");
      }
    };
  } catch (error) {
    cleanupWebRtc(pc, mediaStream, audioElement, dataChannel);
    options.onModeChange("error");
    throw error;
  }
}

function cleanupWebRtc(
  pc: RTCPeerConnection,
  mediaStream: MediaStream | null,
  audioElement: HTMLAudioElement,
  dataChannel: RTCDataChannel | null
) {
  dataChannel?.close();
  mediaStream?.getTracks().forEach((track) => track.stop());
  pc.getSenders().forEach((sender) => sender.track?.stop());
  if (pc.connectionState !== "closed") {
    try {
      pc.close();
    } catch {
      // Already closed.
    }
  }
  audioElement.pause();
  audioElement.srcObject = null;
}

export async function recordVoiceUsage(sessionId: string | undefined, startedAt: number, endedAt: number) {
  if (!sessionId) return;

  await supabase.functions.invoke("record-voice-usage", {
    body: {
      session_id: sessionId,
      started_at: new Date(startedAt).toISOString(),
      ended_at: new Date(endedAt).toISOString(),
      duration_seconds: Math.max(1, Math.round((endedAt - startedAt) / 1000))
    }
  });
}

function assertWebRtcSupport() {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new Error("Dieser Browser unterstützt keinen Mikrofonzugriff über getUserMedia.");
  }
  if (typeof RTCPeerConnection === "undefined") {
    throw new Error("Dieser Browser unterstützt WebRTC nicht.");
  }
}

function handleEvent(rawData: string, options: StartRealtimeVoiceOptions) {
  try {
    const event = JSON.parse(rawData) as RealtimeEvent;
    options.onEvent(event);

    if (event.type === "input_audio_buffer.speech_started" || event.type === "response.audio.delta") {
      options.onModeChange("speaking");
    }
    if (event.type === "input_audio_buffer.speech_stopped" || event.type === "response.audio.done" || event.type === "response.done") {
      options.onModeChange("connected");
    }
    if (typeof event.type === "string" && event.type.includes("error")) {
      options.onModeChange("error");
    }
  } catch {
    options.onEvent({ type: "unparsed_event", raw: rawData });
  }
}

function sendJson(dataChannel: RTCDataChannel, event: RealtimeEvent) {
  if (dataChannel.readyState !== "open") return;
  dataChannel.send(JSON.stringify(event));
}

function buildInstructions(scenario?: Scenario | null) {
  if (!scenario) {
    return [
      "Du bist ein realistischer deutschsprachiger Gesprächspartner für ein Voice-Roleplay.",
      "Bleibe im Charakter, antworte kurz, natürlich und menschlich.",
      "Frage NICHT, worüber gesprochen werden soll — eröffne das Gespräch selbst passend zur Situation.",
      "Gib während des Gesprächs kein Coaching-Feedback und keine Meta-Kommentare."
    ].join(" ");
  }

  const lines = [
    "Du übernimmst jetzt eine Rolle in einem deutschsprachigen Voice-Roleplay. Bleib durchgehend im Charakter und sprich Deutsch.",
    `Szenario: ${scenario.title}.`,
    `Situation: ${scenario.situation}`,
    `Deine Rolle und Verhalten: ${scenario.system_prompt}`,
    `Ziel des Nutzers in dieser Übung: ${scenario.goal}`,
    "Sehr wichtig:",
    "- Eröffne das Gespräch sofort im Charakter, passend zur Situation. Frage NIEMALS 'Worüber willst du sprechen?' oder 'Wie kann ich dir helfen?'.",
    "- Bleib in der Rolle. Brich nicht aus, nenne dich nicht KI, gib keine Coaching-Tipps oder Meta-Kommentare während des Gesprächs.",
    "- Antworte kurz, menschlich und konversationell, mit gelegentlichen offenen Rückfragen.",
    "- Wenn der Nutzer kurz oder unsicher antwortet, hilf ihm sanft weiter, ohne aus der Rolle zu fallen."
  ];

  return lines.join("\n");
}

function buildOpeningInstruction(scenario?: Scenario | null) {
  if (!scenario) {
    return "Eröffne jetzt das Gespräch sofort im Charakter mit einem kurzen, natürlichen Einstiegssatz auf Deutsch. Stelle keine Meta-Frage.";
  }
  return [
    `Eröffne jetzt das Roleplay sofort im Charakter mit einem kurzen, natürlichen Einstiegssatz auf Deutsch, der zur Situation '${scenario.situation}' passt.`,
    "Sprich aus der Rolle heraus, nicht als Assistent. Stelle keine Meta-Fragen wie 'Worüber willst du reden?' oder 'Wobei kann ich helfen?'."
  ].join(" ");
}
