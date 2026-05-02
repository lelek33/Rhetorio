import { supabase } from "../supabase/client";
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
  if (error) throw error;
  if (!data?.client_secret?.value) throw new Error("Kein Realtime Client Secret erhalten.");
  return data;
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

    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaStream.getAudioTracks().forEach((track) => pc.addTrack(track, mediaStream as MediaStream));

    dataChannel = pc.createDataChannel("oai-events");
    dataChannel.addEventListener("open", () => {
      options.onModeChange("connected");
      sendJson(dataChannel as RTCDataChannel, {
        type: "session.update",
        session: {
          instructions: buildInstructions(options.scenarioTitle),
          turn_detection: {
            type: "server_vad",
            create_response: true,
            interrupt_response: true
          }
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

function buildInstructions(scenarioTitle?: string) {
  return [
    "Du bist Rheto, ein deutschsprachiger Gesprächscoach.",
    "Führe jetzt ein realistisches Voice-Roleplay, aber gib während des Gesprächs kein Coaching-Feedback.",
    "Antworte kurz, natürlich und menschlich.",
    scenarioTitle ? `Aktuelles Szenario: ${scenarioTitle}.` : ""
  ]
    .filter(Boolean)
    .join(" ");
}
