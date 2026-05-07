import { CustomTraining } from "../types/customTraining";
import { Scenario } from "../types/scenario";

const maxContentChars = 12000;

function clipContent(content: string) {
  const trimmed = content.trim();
  if (trimmed.length <= maxContentChars) return trimmed;
  return `${trimmed.slice(0, maxContentChars)}\n[…gekürzt – Originaldokument war länger]`;
}

export function buildCustomScenario(custom: CustomTraining): Scenario {
  const safeTitle = custom.title.trim() || defaultTitle(custom.type);
  const content = clipContent(custom.content);

  switch (custom.type) {
    case "quiz":
      return {
        id: "custom-quiz",
        title: `Klausur-Quiz: ${safeTitle}`,
        category: "Karriere",
        description: "Mündliche Prüfung basierend auf deinem hochgeladenen Studienmaterial.",
        difficulty: "Mittel",
        duration_minutes: 10,
        is_premium: false,
        situation: "Du sitzt in einer mündlichen Prüfung. Der Prüfer kennt das Studienmaterial und stellt dir Fragen dazu.",
        goal: "Beantworte die Fragen klar und zeige dein Verständnis statt Auswendiggelerntes.",
        criteria: ["Verständnis", "Klarheit", "Tiefe", "Struktur"],
        system_prompt: [
          "Du bist ein anspruchsvoller, fairer Tutor in einer mündlichen Prüfung. Sprich Deutsch.",
          "Stelle eine konkrete Klausurfrage nach der anderen, basierend ausschließlich auf dem unten stehenden Studienmaterial.",
          "Wenn die Antwort unvollständig ist, hake gezielt nach. Wenn sie falsch ist, gib einen kurzen Hinweis ohne die ganze Lösung zu verraten.",
          "Wenn die Antwort gut ist, lobe knapp und gehe zur nächsten Frage. Variiere zwischen Definitionen, Anwendung, Vergleichen und Begründungen.",
          "Spiele konsequent die Rolle des Prüfers. Erkläre nicht ungefragt das Material und gib während der Session kein Gesamt-Feedback.",
          "",
          "STUDIENMATERIAL:",
          content
        ].join("\n")
      };
    case "interview":
      return {
        id: "custom-interview",
        title: `Bewerbungsgespräch: ${safeTitle}`,
        category: "Bewerbung",
        description: "Bewerbungsgespräch basierend auf deinem hochgeladenen CV bzw. Anschreiben.",
        difficulty: "Schwer",
        duration_minutes: 15,
        is_premium: false,
        situation: "Du sitzt in einem realistischen Bewerbungsgespräch. Der Recruiter hat deine Unterlagen gelesen und stellt dir gezielte Fragen.",
        goal: "Antworte strukturiert, ehrlich und überzeuge mit konkreten Beispielen aus deinen Unterlagen.",
        criteria: ["Struktur", "Konkretheit", "Selbstbewusstsein", "Umgang mit Lücken"],
        system_prompt: [
          "Du bist ein erfahrener, freundlicher aber kritischer Recruiter in einem Bewerbungsgespräch auf Deutsch.",
          "Du hast die Unterlagen des Bewerbers (siehe unten) gelesen und stellst Fragen, die sich konkret darauf beziehen — Stationen im Lebenslauf, Lücken, Stärken/Schwächen, Motivation, Erfolge.",
          "Stelle eine Frage nach der anderen. Frage bei vagen oder allgemeinen Antworten gezielt nach konkreten Beispielen, Zahlen, Verantwortung, Wirkung.",
          "Bleib professionell und respektvoll, aber fordere den Bewerber heraus.",
          "Spiele konsequent die Rolle des Recruiters. Gib während des Gesprächs kein Coaching-Feedback und brich nicht aus der Rolle aus.",
          "",
          "BEWERBUNGSUNTERLAGEN:",
          content
        ].join("\n")
      };
    case "presentation":
    default:
      return {
        id: "custom-presentation",
        title: `Präsentations-Sparring: ${safeTitle}`,
        category: "Karriere",
        description: "Sparring zu deinem hochgeladenen Vortrag, Pitch oder Manuskript.",
        difficulty: "Mittel",
        duration_minutes: 10,
        is_premium: false,
        situation: "Du hast eine Präsentation oder einen Pitch vorbereitet. Du trägst Teile davon vor und bekommst die Reaktion einer anspruchsvollen Zuhörerin.",
        goal: "Trage frei und überzeugend vor, gehe souverän mit Rückfragen um.",
        criteria: ["Klarheit", "Struktur", "Überzeugungskraft", "Umgang mit Rückfragen"],
        system_prompt: [
          "Du bist eine anspruchsvolle, neugierige Zuhörerin im Publikum oder im Sparring zu einer Präsentation auf Deutsch.",
          "Du hast das Manuskript bzw. die Stichpunkte des Vortragenden (siehe unten) bereits überflogen.",
          "Bitte den Vortragenden zunächst, mit einem konkreten Teil zu starten, und stelle dann gezielte Rückfragen: was bedeutet das, warum gerade so, welche Beweise gibt es, welche Annahmen stecken dahinter?",
          "Sei freundlich aber kritisch — wie eine kluge Zuhörerin, die wirklich verstehen will. Bleib in der Rolle und gib während der Session keine Coaching-Tipps.",
          "",
          "MANUSKRIPT / STICHPUNKTE:",
          content
        ].join("\n")
      };
  }
}

function defaultTitle(type: CustomTraining["type"]) {
  if (type === "quiz") return "Mein Studienmaterial";
  if (type === "interview") return "Meine Bewerbung";
  return "Mein Vortrag";
}
