import { useState } from "react";

import { createRealtimeSession } from "../services/realtime/realtimeClient";
import { RealtimeMode, RealtimeSessionToken } from "../services/realtime/realtimeTypes";

export function useRealtimeVoice() {
  const [mode, setMode] = useState<RealtimeMode>("idle");
  const [token, setToken] = useState<RealtimeSessionToken | null>(null);

  async function prepare() {
    setMode("connecting");
    try {
      const nextToken = await createRealtimeSession();
      setToken(nextToken);
      setMode("connected");
    } catch {
      setMode("error");
    }
  }

  function disconnect() {
    setToken(null);
    setMode("idle");
  }

  return { mode, token, prepare, disconnect };
}
