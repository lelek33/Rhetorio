// Web realtime client — now backed by Gemini Live (WebSocket + PCM
// pipeline) instead of OpenAI Realtime (WebRTC). The exported surface is
// kept identical so useRealtimeVoice and the rest of the app do not need
// to change.

import { supabase } from "../supabase/client";
import { startGeminiVoice } from "./geminiRealtimeClient.web";
import { RealtimeVoiceConnection, StartRealtimeVoiceOptions } from "./realtimeTypes";

export async function startRealtimeVoice(options: StartRealtimeVoiceOptions): Promise<RealtimeVoiceConnection> {
  return startGeminiVoice(options);
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
