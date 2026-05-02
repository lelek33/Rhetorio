import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

type AnalyzeBody = {
  session_id: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

function clampScore(value: unknown) {
  const numberValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numberValue)) return 60;
  return Math.max(0, Math.min(100, Math.round(numberValue)));
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const body = (await req.json()) as AnalyzeBody;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openAiKey = Deno.env.get("OPENAI_API_KEY");
    const model = Deno.env.get("OPENAI_MODEL") ?? "gpt-4o-mini";

    if (!openAiKey) throw new Error("OPENAI_API_KEY ist nicht gesetzt.");

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const admin = createClient(supabaseUrl, serviceKey);
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) throw new Error("Nicht authentifiziert.");

    const { data: session } = await admin
      .from("sessions")
      .select("id,user_id,scenario_id")
      .eq("id", body.session_id)
      .single();

    if (!session || session.user_id !== userData.user.id) throw new Error("Session nicht gefunden.");

    const { data: scenario } = await admin.from("scenarios").select("title").eq("id", session.scenario_id).single();
    const { data: messages } = await admin
      .from("messages")
      .select("role,content")
      .eq("session_id", body.session_id)
      .order("created_at", { ascending: true });

    const transcript = (messages ?? []).map((message) => `${message.role}: ${message.content}`).join("\n");
    const prompt = `Analysiere dieses deutschsprachige Trainingsgespraech als klarer, motivierender Kommunikationscoach.
Szenario: ${scenario?.title ?? "Training"}

Transkript:
${transcript}

Gib ausschliesslich valides JSON im exakt folgenden Schema zurueck:
{
  "score_total": number,
  "conversation_flow": number,
  "confidence": number,
  "clarity": number,
  "questions_score": number,
  "filler_words_count": number,
  "strengths": string[],
  "weaknesses": string[],
  "better_phrases": [{"original": string, "improved": string, "reason": string}],
  "next_exercise": string,
  "summary": string
}

Regeln: Feedback konkret, deutsch, kurz, hilfreich, ehrlich und nicht beleidigend. Liefere immer mindestens zwei bessere Formulierungen.`;

    const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.35,
        response_format: { type: "json_object" }
      })
    });

    if (!openAiResponse.ok) throw new Error(await openAiResponse.text());
    const completion = await openAiResponse.json();
    const parsed = JSON.parse(completion.choices?.[0]?.message?.content ?? "{}");

    const analysis = {
      session_id: body.session_id,
      score_total: clampScore(parsed.score_total),
      conversation_flow: clampScore(parsed.conversation_flow),
      confidence: clampScore(parsed.confidence),
      clarity: clampScore(parsed.clarity),
      questions_score: clampScore(parsed.questions_score),
      filler_words_count: Math.max(0, Math.round(Number(parsed.filler_words_count ?? 0))),
      strengths: asArray(parsed.strengths).slice(0, 3),
      weaknesses: asArray(parsed.weaknesses).slice(0, 3),
      better_phrases: asArray(parsed.better_phrases).slice(0, 4),
      next_exercise: String(parsed.next_exercise ?? "Wiederhole das Szenario mit Fokus auf offene Rückfragen."),
      summary: String(parsed.summary ?? "Du hast die Session abgeschlossen und kannst im nächsten Durchlauf konkreter antworten.")
    };

    const { data: saved, error: insertError } = await admin.from("analyses").insert(analysis).select("*").single();
    if (insertError) throw insertError;

    await admin
      .from("sessions")
      .update({ score_total: analysis.score_total, status: "completed" })
      .eq("id", body.session_id);

    return Response.json(saved, { headers: corsHeaders });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unbekannter Fehler" },
      { status: 400, headers: corsHeaders }
    );
  }
});
