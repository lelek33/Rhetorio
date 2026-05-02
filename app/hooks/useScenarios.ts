import { useEffect, useMemo, useState } from "react";

import { listScenarios } from "../services/supabase/scenarios";
import { Scenario } from "../types/scenario";

export function useScenarios() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listScenarios()
      .then(setScenarios)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const grouped = useMemo(
    () => ({
      "Alltag & Smalltalk": scenarios.filter((item) => item.category === "Smalltalk"),
      Karriere: scenarios.filter((item) => ["Bewerbung", "Gehalt", "Karriere"].includes(item.category)),
      "Schwierige Gespräche": scenarios.filter((item) => item.category === "Gehalt")
    }),
    [scenarios]
  );

  return { scenarios, grouped, loading, error };
}
