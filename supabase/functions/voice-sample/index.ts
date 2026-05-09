import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const sampleText =
  "Hallo, ich bin Rheto. Lass uns gemeinsam an deinem naechsten Gespraech arbeiten.";

// Realtime voices map to TTS voices when the TTS model does not yet
// expose the same identifier. We use these as a fallback only.
const ttsVoiceFallback: Record<string, string> = {
  marin: "shimmer",
  cedar: "onyx",
  coral: "coral",
  ash: "ash",
  alloy: "alloy",
  sage: "sage",
  shimmer: "shimmer",
  echo: "echo",
  ballad: "ballad",
  verse: "verse"
};

const allowedVoices = Object.keys(ttsVoiceFallback);
const bucketId = "voice-samples";

async function callTts(openAiKey: string, voice: string) {
  return fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini-tts",
      voice,
      input: sampleText,
      response_format: "mp3"
    })
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openAiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAiKey) throw new Error("OPENAI_API_KEY ist nicht gesetzt.");

    let voice = "marin";
    try {
      if (req.headers.get("content-type")?.includes("application/json")) {
        const body = await req.json();
        if (typeof body?.voice === "string") voice = body.voice;
      }
    } catch {
      // body optional
    }
    if (!allowedVoices.includes(voice)) {
      throw new Error(`Stimme ${voice} wird nicht unterstuetzt.`);
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const objectPath = `${voice}.mp3`;
    const { data: publicUrlData } = admin.storage.from(bucketId).getPublicUrl(objectPath);
    const publicUrl = publicUrlData.publicUrl;

    // Check if a cached sample exists for this voice. If yes, just hand
    // back the URL — the browser plays the static file directly.
    const head = await fetch(publicUrl, { method: "HEAD", cache: "no-store" });
    if (head.ok) {
      return Response.json({ url: publicUrl, cached: true }, { headers: corsHeaders });
    }

    // Generate the sample once via OpenAI TTS, then upload to storage.
    let response = await callTts(openAiKey, voice);
    if (!response.ok) {
      const fallback = ttsVoiceFallback[voice];
      if (fallback && fallback !== voice) {
        response = await callTts(openAiKey, fallback);
      }
    }
    if (!response.ok) throw new Error(await response.text());

    const audio = new Uint8Array(await response.arrayBuffer());

    const { error: uploadError } = await admin.storage
      .from(bucketId)
      .upload(objectPath, audio, {
        contentType: "audio/mpeg",
        upsert: true,
        cacheControl: "31536000"
      });
    if (uploadError) throw new Error(`Sample konnte nicht gespeichert werden: ${uploadError.message}`);

    return Response.json({ url: publicUrl, cached: false }, { headers: corsHeaders });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unbekannter Fehler" },
      { status: 400, headers: corsHeaders }
    );
  }
});
