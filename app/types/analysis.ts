export type BetterPhrase = {
  original: string;
  improved: string;
  reason: string;
};

export type Analysis = {
  id: string;
  session_id: string;
  score_total: number;
  conversation_flow: number;
  confidence: number;
  clarity: number;
  questions_score: number;
  filler_words_count: number;
  strengths: string[];
  weaknesses: string[];
  better_phrases: BetterPhrase[];
  next_exercise: string;
  summary: string;
  created_at: string;
};
