import { useEffect, useState } from "react";

import { getAnalysis } from "../services/supabase/analyses";
import { Analysis } from "../types/analysis";

export function useAnalysis(sessionId?: string) {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(Boolean(sessionId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    getAnalysis(sessionId)
      .then(setAnalysis)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [sessionId]);

  return { analysis, loading, error };
}
