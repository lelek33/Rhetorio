import { Scenario } from "./scenario";

export type CustomTrainingType = "quiz" | "interview" | "presentation";

export type CustomTraining = {
  type: CustomTrainingType;
  title: string;
  content: string;
};

export const customTrainingTypes: { id: CustomTrainingType; label: string; description: string }[] = [
  {
    id: "quiz",
    label: "Klausur-Quiz",
    description: "Lade dein Skript hoch — die KI prüft dich ab wie ein Tutor."
  },
  {
    id: "interview",
    label: "Bewerbungsgespräch",
    description: "Lade Lebenslauf oder Anschreiben hoch — die KI ist dein Recruiter."
  },
  {
    id: "presentation",
    label: "Präsentations-Sparring",
    description: "Lade dein Pitch- oder Vortragsmanuskript hoch — die KI hört zu und stellt kritische Rückfragen."
  }
];

export type AnyScenario = Scenario | (Scenario & { _custom?: CustomTraining });
