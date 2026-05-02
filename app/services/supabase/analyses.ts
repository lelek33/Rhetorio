import { Analysis } from "../../types/analysis";
import { supabase } from "./client";

export async function getAnalysis(sessionId: string): Promise<Analysis | null> {
  const { data, error } = await supabase.from("analyses").select("*").eq("session_id", sessionId).maybeSingle();
  if (error) throw error;
  return data as Analysis | null;
}
