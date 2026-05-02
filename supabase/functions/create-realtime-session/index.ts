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
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data, error } = await userClient.auth.getUser();
    if (error || !data.user) throw new Error("Nicht authentifiziert.");

    return Response.json(
      {
        token: "realtime-voice-disabled-in-mvp",
        expires_at: new Date(Date.now() + 60_000).toISOString(),
        todo: "Hier spaeter serverseitig einen kurzlebigen OpenAI Realtime Token erstellen. Den echten OPENAI_API_KEY niemals an die App senden."
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
