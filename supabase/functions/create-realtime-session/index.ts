import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const openAiKey = Deno.env.get("OPENAI_API_KEY");
    const realtimeModel = Deno.env.get("OPENAI_REALTIME_MODEL") ?? "gpt-realtime";
    const realtimeVoice = Deno.env.get("OPENAI_REALTIME_VOICE") ?? "marin";

    if (!openAiKey) throw new Error("OPENAI_API_KEY ist nicht gesetzt.");

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data, error } = await userClient.auth.getUser();
    if (error || !data.user) throw new Error("Nicht authentifiziert.");

    const response = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        expires_after: {
          anchor: "created_at",
          seconds: 600
        },
        session: {
          type: "realtime",
          model: realtimeModel,
          instructions:
            "Du bist Rheto, ein ruhiger deutschsprachiger KI-Gesprächspartner. Führe ein realistisches Gespräch. Gib während der Session kein Coaching-Feedback.",
          audio: {
            output: {
              voice: realtimeVoice
            }
          }
        }
      })
    });

    if (!response.ok) throw new Error(await response.text());
    const payload = await response.json();
    const clientSecret = payload.client_secret ?? payload.session?.client_secret ?? payload;
    const value = clientSecret.value;

    if (!value) throw new Error("OpenAI hat kein Realtime client_secret geliefert.");

    return Response.json(
      {
        client_secret: {
          value,
          expires_at: clientSecret.expires_at
        },
        session_id: payload.session?.id,
        expires_at: clientSecret.expires_at ? new Date(clientSecret.expires_at * 1000).toISOString() : undefined
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unbekannter Fehler" },
      { status: 400, headers: corsHeaders }
    );
  }
});
