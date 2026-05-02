import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

type RecordVoiceUsageBody = {
  session_id: string;
  started_at: string;
  ended_at: string;
  duration_seconds: number;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const body = (await req.json()) as RecordVoiceUsageBody;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const admin = createClient(supabaseUrl, serviceKey);
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) throw new Error("Nicht authentifiziert.");

    const { data: session } = await admin.from("sessions").select("id,user_id").eq("id", body.session_id).single();
    if (!session || session.user_id !== userData.user.id) throw new Error("Session nicht gefunden.");

    return Response.json(
      {
        ok: true,
        session_id: body.session_id,
        duration_seconds: Math.max(1, Math.round(Number(body.duration_seconds) || 1))
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
