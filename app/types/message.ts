export type MessageRole = "user" | "assistant" | "system";

export type ConversationMessage = {
  id: string;
  session_id: string;
  role: MessageRole;
  content: string;
  audio_url?: string | null;
  created_at: string;
};
