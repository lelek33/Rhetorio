import { supabase } from "../supabase/client";
import { RealtimeSessionToken, RealtimeVoiceConnection, StartRealtimeVoiceOptions } from "./realtimeTypes";

export async function createRealtimeSession(): Promise<RealtimeSessionToken> {
  const { data, error } = await supabase.functions.invoke<RealtimeSessionToken>("create-realtime-session");
  if (error) throw error;
  if (!data?.client_secret?.value) throw new Error("Kein Realtime Client Secret erhalten.");
  return data;
}

export async function startRealtimeVoice(_options: StartRealtimeVoiceOptions): Promise<RealtimeVoiceConnection> {
  throw new Error("Live Voice ist auf nativen Builds vorbereitet, aber zuerst nur im Web aktiviert.");
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
