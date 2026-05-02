import { Analysis } from "./analysis";
import { ConversationMessage } from "./message";
import { Scenario } from "./scenario";
import { TrainingSession } from "./session";
import { Profile } from "./user";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

type ScenarioRow = Scenario & {
  created_at: string;
};

type ProfileInsert = {
  id: string;
  email?: string | null;
  subscription_status?: "free" | "premium";
  free_sessions_used?: number;
  training_goal?: string | null;
};

type SessionInsert = {
  user_id: string;
  scenario_id: string;
  status?: TrainingSession["status"];
};

type MessageInsert = {
  session_id: string;
  role: ConversationMessage["role"];
  content: string;
  audio_url?: string | null;
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<Profile, ProfileInsert>;
      scenarios: Table<ScenarioRow>;
      sessions: Table<TrainingSession, SessionInsert>;
      messages: Table<ConversationMessage, MessageInsert>;
      analyses: Table<Analysis, Omit<Analysis, "id" | "created_at">>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
