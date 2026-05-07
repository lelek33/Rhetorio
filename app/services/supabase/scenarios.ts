import { demoScenarios } from "../../constants/scenarios";
import { Scenario } from "../../types/scenario";
import { isSupabaseConfigured, supabase } from "./client";

export async function listScenarios(): Promise<Scenario[]> {
  if (!isSupabaseConfigured) return demoScenarios;

  const { data, error } = await supabase
    .from("scenarios")
    .select("id,title,category,description,difficulty,duration_minutes,system_prompt,is_premium,situation,goal,criteria")
    .eq("is_custom", false)
    .order("created_at", { ascending: true });
  if (error || !data?.length) return demoScenarios;

  return data as Scenario[];
}

export async function getScenario(scenarioId: string): Promise<Scenario | null> {
  const local = demoScenarios.find((scenario) => scenario.id === scenarioId);
  if (!isSupabaseConfigured) return local ?? null;

  const { data, error } = await supabase
    .from("scenarios")
    .select("id,title,category,description,difficulty,duration_minutes,system_prompt,is_premium,situation,goal,criteria")
    .eq("id", scenarioId)
    .maybeSingle();
  if (error) throw error;

  return (data as Scenario | null) ?? local ?? null;
}
