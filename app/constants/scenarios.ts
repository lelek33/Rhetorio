import { Scenario } from "../types/scenario";

const smalltalkPrompt =
  "Du bist ein realistischer Gesprächspartner für ein deutsches Smalltalk-Training. Bleibe im Szenario. Antworte kurz, natürlich und menschlich. Stelle gelegentlich offene Rückfragen. Wenn der Nutzer sehr kurz antwortet, hilf ihm sanft, weiterzusprechen. Gib während des Gesprächs kein Coaching-Feedback. Sprich Deutsch.";

const interviewPrompt =
  "Du bist ein deutscher Interviewer. Stelle realistische Interviewfragen. Sei professionell und freundlich, aber nicht zu einfach. Frage nach, wenn Antworten vage sind. Gib während des Gesprächs kein Feedback. Sprich Deutsch.";

const salaryPrompt =
  "Du bist ein skeptischer, aber fairer Vorgesetzter in einer Gehaltsverhandlung. Frage, warum der Nutzer eine Gehaltserhöhung verdient. Frage nach konkreten Leistungen, Zahlen und Verantwortung. Bleibe realistisch, nicht aggressiv. Gib während des Gesprächs kein Coaching-Feedback. Sprich Deutsch.";

export const demoScenarios: Scenario[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    title: "Smalltalk auf einer Party",
    category: "Smalltalk",
    description: "Übe, ein lockeres Gespräch mit einer fremden Person zu starten.",
    difficulty: "Leicht",
    duration_minutes: 3,
    system_prompt: smalltalkPrompt,
    is_premium: false,
    situation: "Du bist auf einer Party und kennst kaum jemanden.",
    goal: "Halte das Gespräch 3 Minuten am Laufen.",
    criteria: ["Rückfragen", "Natürlichkeit", "Gesprächsfluss", "Pausen"]
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    title: "Smalltalk beim Networking",
    category: "Smalltalk",
    description: "Übe, bei einem beruflichen Event natürlich ins Gespräch zu kommen.",
    difficulty: "Mittel",
    duration_minutes: 3,
    system_prompt: smalltalkPrompt,
    is_premium: false,
    situation: "Du bist auf einem beruflichen Event und triffst neue Kontakte.",
    goal: "Starte natürlich ein Gespräch und finde Anknüpfungspunkte.",
    criteria: ["Einstieg", "Offene Fragen", "Relevanz", "Gesprächsfluss"]
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    title: "Bewerbung: Erzählen Sie etwas über sich",
    category: "Bewerbung",
    description: "Trainiere eine überzeugende, strukturierte Selbstvorstellung.",
    difficulty: "Mittel",
    duration_minutes: 5,
    system_prompt: interviewPrompt,
    is_premium: false,
    situation: "Ein Bewerbungsgespräch beginnt mit der klassischen Selbstvorstellung.",
    goal: "Antworte klar, strukturiert und passend zur Stelle.",
    criteria: ["Struktur", "Klarheit", "Selbstbewusstsein", "Relevanz"]
  },
  {
    id: "44444444-4444-4444-4444-444444444444",
    title: "Bewerbung: Was sind Ihre Schwächen?",
    category: "Bewerbung",
    description: "Übe eine souveräne Antwort auf eine klassische Interviewfrage.",
    difficulty: "Mittel",
    duration_minutes: 5,
    system_prompt: interviewPrompt,
    is_premium: false,
    situation: "Der Interviewer fragt nach deinen Schwächen.",
    goal: "Zeige Reflexion, ohne dich kleinzumachen.",
    criteria: ["Ehrlichkeit", "Lernbereitschaft", "Konkretheit", "Souveränität"]
  },
  {
    id: "55555555-5555-5555-5555-555555555555",
    title: "Gehaltsverhandlung mit skeptischem Chef",
    category: "Gehalt",
    description: "Übe, deine Gehaltsforderung ruhig und überzeugend zu begründen.",
    difficulty: "Schwer",
    duration_minutes: 5,
    system_prompt: salaryPrompt,
    is_premium: true,
    situation: "Dein Vorgesetzter ist offen, aber kritisch gegenüber deiner Forderung.",
    goal: "Begründe deine Forderung mit Leistung, Verantwortung und Wirkung.",
    criteria: ["Argumentation", "Ruhe", "Zahlen", "Umgang mit Einwänden"]
  },
  {
    id: "66666666-6666-6666-6666-666666666666",
    title: "60-Sekunden-Pitch",
    category: "Karriere",
    description: "Erkläre eine Idee kurz, klar und überzeugend.",
    difficulty: "Mittel",
    duration_minutes: 2,
    system_prompt: interviewPrompt,
    is_premium: false,
    situation: "Du hast eine Minute, um eine Idee überzeugend vorzustellen.",
    goal: "Komme schnell auf den Punkt und mache neugierig.",
    criteria: ["Kürze", "Struktur", "Nutzen", "Abschluss"]
  }
];
