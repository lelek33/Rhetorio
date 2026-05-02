import { supabase } from "../supabase/client";
import { RealtimeSessionToken } from "./realtimeTypes";

export async function createRealtimeSession(): Promise<RealtimeSessionToken> {
  const { data, error } = await supabase.functions.invoke<RealtimeSessionToken>("create-realtime-session");
  if (error) throw error;
  if (!data) throw new Error("Kein Realtime-Token erhalten.");
  return data;
}
