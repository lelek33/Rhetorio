import { HistoryItem, TrainingSession } from "../../types/session";
import { supabase } from "./client";
import { canStartSession } from "./profiles";

type HistoryRow = TrainingSession & {
  scenarios?: { title?: string } | null;
  analyses?: { summary?: string; weaknesses?: string[] }[];
};

export async function startSession(userId: string, scenarioId: string): Promise<TrainingSession> {
  const permission = await canStartSession(userId);
  if (!permission.allowed) throw new Error("SESSION_LIMIT_REACHED");

  const { data, error } = await supabase
    .from("sessions")
    .insert({ user_id: userId, scenario_id: scenarioId, status: "active" })
    .select("*")
    .single();

  if (error) throw error;
  return data as TrainingSession;
}

export async function completeSession(sessionId: string, startedAt: string) {
  const durationSeconds = Math.max(1, Math.round((Date.now() - new Date(startedAt).getTime()) / 1000));
  const { data, error } = await supabase
    .from("sessions")
    .update({ ended_at: new Date().toISOString(), duration_seconds: durationSeconds, status: "analyzing" })
    .eq("id", sessionId)
    .select("*")
    .single();

  if (error) throw error;
  return data as TrainingSession;
}

export async function listHistory(userId: string): Promise<HistoryItem[]> {
  const { data, error } = await supabase
    .from("sessions")
    .select("*, scenarios(title), analyses(summary, weaknesses)")
    .eq("user_id", userId)
    .neq("status", "active")
    .order("started_at", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as unknown as HistoryRow[]).map((row) => ({
    ...row,
    scenario_title: row.scenarios?.title ?? "Training",
    main_tip: Array.isArray(row.analyses?.[0]?.weaknesses) ? row.analyses?.[0]?.weaknesses?.[0] : row.analyses?.[0]?.summary
  }));
}
