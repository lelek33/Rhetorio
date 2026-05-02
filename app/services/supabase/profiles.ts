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
  const profile = await ensureProfile(userId);
  const limit = profile.subscription_status === "premium" ? PREMIUM_MONTHLY_LIMIT : FREE_MONTHLY_LIMIT;

  return {
    allowed: profile.free_sessions_used < limit,
    used: profile.free_sessions_used,
    limit,
    status: profile.subscription_status
  };
}

export async function incrementSessionUsage(userId: string, currentCount: number) {
  const { error } = await supabase
    .from("profiles")
    .update({ free_sessions_used: currentCount + 1 })
    .eq("id", userId);

  if (error) throw error;
}
