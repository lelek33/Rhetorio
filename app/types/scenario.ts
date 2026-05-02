export type ScenarioDifficulty = "Leicht" | "Mittel" | "Schwer";

export type ScenarioCategory =
  | "Smalltalk"
  | "Bewerbung"
  | "Gehalt"
  | "Karriere"
  | "Schwierige Gespräche";

export type Scenario = {
  id: string;
  title: string;
  category: ScenarioCategory;
  description: string;
  difficulty: ScenarioDifficulty;
  duration_minutes: number;
  system_prompt: string;
  is_premium: boolean;
  situation: string;
  goal: string;
  criteria: string[];
};
