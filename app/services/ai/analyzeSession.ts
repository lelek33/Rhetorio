import { Analysis } from "../../types/analysis";
import { supabase } from "../supabase/client";

export async function analyzeSession(sessionId: string) {
  const { data, error } = await supabase.functions.invoke<Analysis>("analyze-session", {
    body: { session_id: sessionId }
  });

  if (error) throw error;
  return data;
}
