import { Profile } from "../../types/user";
import { supabase } from "./client";

export const FREE_MONTHLY_LIMIT = 3;
export const PREMIUM_MONTHLY_LIMIT = 100;

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function ensureProfile(userId: string, email?: string | null): Promise<Profile> {
  const existing = await getProfile(userId);
  if (existing) return existing;

  const { data, error } = await supabase
    .from("profiles")
    .insert({ id: userId, email: email ?? null })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function updateTrainingGoal(userId: string, trainingGoal: string) {
  const { error } = await supabase.from("profiles").update({ training_goal: trainingGoal }).eq("id", userId);
  if (error) throw error;
}

export async function canStartSession(userId: string) {
  // Temporarily disabled for testing — always allow starting a session so the
  // upgrade screen is never triggered. Re-enable the limit check when the
  // premium flow goes live again.
  const profile = await ensureProfile(userId);
  const used = await countSessionsThisMonth(userId);
  const limit = profile.subscription_status === "premium" ? PREMIUM_MONTHLY_LIMIT : FREE_MONTHLY_LIMIT;

  return {
    allowed: true,
    used,
    limit,
    status: profile.subscription_status
  };
}

export async function incrementSessionUsage(_userId: string, _currentCount: number) {
  // Usage is now calculated from sessions per calendar month, so starting a session
  // does not permanently consume a slot during MVP testing.
}

async function countSessionsThisMonth(userId: string) {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from("sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("started_at", startOfMonth.toISOString());

  if (error) return 0;
  return count ?? 0;
}

export async function resetFreeSessionCounter(userId: string) {
  const { error } = await supabase
    .from("profiles")
    .update({ free_sessions_used: 0 })
    .eq("id", userId);

  if (error) throw error;
}
