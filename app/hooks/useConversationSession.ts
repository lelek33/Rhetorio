import { useCallback, useEffect, useMemo, useState } from "react";

import { analyzeSession } from "../services/ai/analyzeSession";
import { generateReply } from "../services/ai/generateReply";
import { createMessage, listMessages } from "../services/supabase/messages";
import { completeSession, startSession } from "../services/supabase/sessions";
import { ConversationMessage } from "../types/message";
import { Scenario } from "../types/scenario";
import { SessionMode, TrainingSession } from "../types/session";

export function useConversationSession(userId: string | undefined, scenario: Scenario | null) {
  const [session, setSession] = useState<TrainingSession | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<SessionMode>("text");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!session?.started_at) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [session?.started_at]);

  const elapsedSeconds = useMemo(() => {
    if (!session?.started_at) return 0;
    return Math.max(0, Math.round((now - new Date(session.started_at).getTime()) / 1000));
  }, [session?.started_at, now]);

  const begin = useCallback(async () => {
    if (!userId || !scenario || session) return;
    setLoading(true);
    setError(null);
    try {
      const created = await startSession(userId, scenario.id);
      setSession(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Session konnte nicht gestartet werden.");
    } finally {
      setLoading(false);
    }
  }, [userId, scenario, session]);

  async function send(text: string) {
    if (!session || !scenario || !text.trim()) return;
    setSending(true);
    setError(null);
    try {
      const userMessage = await createMessage(session.id, "user", text.trim());
      setMessages((current) => [...current, userMessage]);
      const reply = await generateReply({
        session_id: session.id,
        scenario_id: scenario.id,
        latest_user_message: text.trim()
      });
      const latestMessages = await listMessages(session.id);
      setMessages(latestMessages.length ? latestMessages : [...messages, userMessage]);
      if (!reply) setError("Rheto hat keine Antwort zurückgegeben.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nachricht konnte nicht gesendet werden.");
    } finally {
      setSending(false);
    }
  }

  async function finish() {
    if (!session) return null;
    setLoading(true);
    setError(null);
    try {
      const completed = await completeSession(session.id, session.started_at);
      setSession(completed);
      return await analyzeSession(session.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analyse konnte nicht erstellt werden.");
      return null;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    begin();
  }, [begin]);

  return { session, messages, loading, sending, error, mode, setMode, elapsedSeconds, send, finish };
}
