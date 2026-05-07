const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const sampleText =
  "Hallo, ich bin Rheto. Lass uns gemeinsam an deinem naechsten Gespraech arbeiten.";

// Realtime voices map to TTS voices when the TTS model does not yet
// expose the same identifier (e.g. marin / cedar are realtime-only on
// some accounts).
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

async function tts(openAiKey: string, voice: string) {
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

    let response = await tts(openAiKey, voice);
    if (!response.ok) {
      const fallback = ttsVoiceFallback[voice];
      if (fallback && fallback !== voice) {
        response = await tts(openAiKey, fallback);
      }
    }
    if (!response.ok) {
      throw new Error(await response.text());
    }

    const audio = await response.arrayBuffer();
    return new Response(audio, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400"
      }
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unbekannter Fehler" },
      { status: 400, headers: corsHeaders }
    );
  }
});
