import { supabase } from "../supabase/client";
import { RealtimeVoiceConnection, StartRealtimeVoiceOptions } from "./realtimeTypes";

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
