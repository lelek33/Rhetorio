export type SessionStatus = "active" | "completed" | "analyzing" | "failed";
export type SessionMode = "text" | "push_to_talk" | "live_voice";

export type TrainingSession = {
  id: string;
  user_id: string;
  scenario_id: string;
  started_at: string;
  ended_at?: string | null;
  duration_seconds?: number | null;
  score_total?: number | null;
  status: SessionStatus;
};

export type HistoryItem = TrainingSession & {
  scenario_title: string;
  main_tip?: string;
};
