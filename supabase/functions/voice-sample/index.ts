// voice-sample Edge Function
//
// Generates a short Gemini TTS clip for each voice the picker offers and
// caches it as a WAV file in the public voice-samples Supabase Storage
// bucket. First request per voice ever takes ~2 s (TTS call + upload);
// every other request just hands back the cached URL.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const sampleText =
  "Hallo, ich bin Rheto. Lass uns gemeinsam an deinem naechsten Gespraech arbeiten.";

const voiceMap: Record<string, string> = {
  marin: "Aoede",
  coral: "Leda",
  cedar: "Charon",
  ash: "Puck"
};

const bucketId = "voice-samples";
const ttsModel = Deno.env.get("GEMINI_TTS_MODEL") ?? "gemini-2.5-flash-preview-tts";
const sampleRate = 24000;

async function generateGeminiTts(geminiKey: string, voiceName: string): Promise<Uint8Array> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${ttsModel}:generateContent?key=${geminiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: sampleText }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName }
            }
          }
        }
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini TTS error: ${await response.text()}`);
  }

  const data = await response.json();
  const inline = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData;
  const base64 = inline?.data;
  if (!base64) throw new Error("Gemini hat kein Audio zurueckgegeben.");

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function pcmToWav(pcm: Uint8Array, rate: number): Uint8Array {
  const dataSize = pcm.length;
  const wav = new Uint8Array(44 + dataSize);
  const view = new DataView(wav.buffer);

  // RIFF header
  view.setUint32(0, 0x52494646, false); // 'RIFF'
  view.setUint32(4, 36 + dataSize, true);
  view.setUint32(8, 0x57415645, false); // 'WAVE'

  // fmt chunk
  view.setUint32(12, 0x666d7420, false); // 'fmt '
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);

  // data chunk
  view.setUint32(36, 0x64617461, false); // 'data'
  view.setUint32(40, dataSize, true);

  wav.set(pcm, 44);
  return wav;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) throw new Error("GEMINI_API_KEY ist nicht gesetzt.");

    let voiceId = "marin";
    try {
      if (req.headers.get("content-type")?.includes("application/json")) {
        const body = await req.json();
        if (typeof body?.voice === "string" && voiceMap[body.voice]) voiceId = body.voice;
      }
    } catch {
      // body optional
    }
    const geminiVoice = voiceMap[voiceId];

    const admin = createClient(supabaseUrl, serviceKey);
    const objectPath = `${voiceId}.wav`;
    const { data: publicUrlData } = admin.storage.from(bucketId).getPublicUrl(objectPath);
    const publicUrl = publicUrlData.publicUrl;

    const head = await fetch(publicUrl, { method: "HEAD", cache: "no-store" });
    if (head.ok) {
      return Response.json({ url: publicUrl, cached: true }, { headers: corsHeaders });
    }

    const pcm = await generateGeminiTts(geminiKey, geminiVoice);
    const wav = pcmToWav(pcm, sampleRate);

    const { error: uploadError } = await admin.storage
      .from(bucketId)
      .upload(objectPath, wav, {
        contentType: "audio/wav",
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
