import { ConversationMessage } from "../../types/message";
import { supabase } from "./client";

export async function listMessages(sessionId: string): Promise<ConversationMessage[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function createMessage(sessionId: string, role: "user" | "assistant", content: string) {
  const { data, error } = await supabase
    .from("messages")
    .insert({ session_id: sessionId, role, content })
    .select("*")
    .single();

  if (error) throw error;
  return data as ConversationMessage;
}
