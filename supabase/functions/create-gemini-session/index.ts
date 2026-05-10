// Edge Function: create-gemini-session
//
// Mints a one-shot ephemeral token for the Gemini Live API and returns it
// together with the matching voice name. The browser opens a WebSocket to
// Gemini using this token, so the real GEMINI_API_KEY never reaches the
// client.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const voiceMap: Record<string, { gemini: string; gender: "weiblich" | "männlich" | "neutral" }> = {
  marin: { gemini: "Aoede", gender: "weiblich" },
  coral: { gemini: "Leda", gender: "weiblich" },
  cedar: { gemini: "Charon", gender: "männlich" },
  ash: { gemini: "Puck", gender: "männlich" }
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    const model = Deno.env.get("GEMINI_REALTIME_MODEL") ?? "gemini-3.1-flash-live-preview";
    if (!geminiKey) throw new Error("GEMINI_API_KEY ist nicht gesetzt.");

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) throw new Error("Nicht authentifiziert.");

    let voiceId = "marin";
    try {
      if (req.headers.get("content-type")?.includes("application/json")) {
        const body = await req.json();
        if (typeof body?.voice === "string" && voiceMap[body.voice]) voiceId = body.voice;
      }
    } catch {
      // body is optional
    }
    const mapped = voiceMap[voiceId];

    const now = Date.now();
    const expireTime = new Date(now + 30 * 60 * 1000).toISOString();
    const newSessionExpireTime = new Date(now + 60 * 1000).toISOString();

    const tokenResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1alpha/auth_tokens?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uses: 1,
          expireTime,
          newSessionExpireTime
        })
      }
    );

    if (!tokenResponse.ok) {
      throw new Error(`Gemini token error: ${await tokenResponse.text()}`);
    }

    const tokenData = await tokenResponse.json();
    const tokenName = tokenData.name ?? tokenData.token;
    if (!tokenName) throw new Error("Gemini hat keinen Token zurueckgegeben.");

    return Response.json(
      {
        token: tokenName,
        model: `models/${model}`,
        voice_name: mapped.gemini,
        voice_gender: mapped.gender,
        expires_at: expireTime
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
