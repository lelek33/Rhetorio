import { Analysis } from "../types/analysis";

export function scoreRows(analysis: Analysis) {
  return [
    { label: "Gesprächsfluss", value: analysis.conversation_flow },
    { label: "Selbstbewusstsein", value: analysis.confidence },
    { label: "Klarheit", value: analysis.clarity },
    { label: "Rückfragen", value: analysis.questions_score },
    { label: "Natürlichkeit", value: Math.max(0, 100 - analysis.filler_words_count * 6) },
    { label: "Füllwörter", value: analysis.filler_words_count }
  ];
}
