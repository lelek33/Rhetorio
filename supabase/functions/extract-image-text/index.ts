const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

type RequestBody = {
  image_base64?: string;
  mime_type?: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const openAiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAiKey) throw new Error("OPENAI_API_KEY ist nicht gesetzt.");

    const body = (await req.json()) as RequestBody;
    const imageBase64 = (body.image_base64 ?? "").trim();
    const mimeType = (body.mime_type ?? "image/jpeg").toLowerCase();

    if (!imageBase64) throw new Error("Es wurde kein Bild gesendet.");
    if (!allowedMimeTypes.includes(mimeType)) {
      throw new Error("Bildformat wird nicht unterstuetzt. Erlaubt sind JPEG, PNG und WebP.");
    }

    const dataUrl = `data:${mimeType};base64,${imageBase64}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0,
        messages: [
          {
            role: "system",
            content:
              "Du extrahierst Text aus Bildern fuer ein Lern- und Trainings-Tool. " +
              "Gib AUSSCHLIESSLICH den lesbaren Inhalt zurueck, eins zu eins, ohne Kommentar, ohne Markdown-Codeblock und ohne Einleitung. " +
              "Behalte Reihenfolge und sinnvolle Absaetze. Wenn das Bild kein lesbarer Text ist, beschreibe knapp und sachlich, was zu sehen ist."
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Extrahiere den Text aus diesem Bild." },
              { type: "image_url", image_url: { url: dataUrl, detail: "high" } }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const completion = await response.json();
    const text = (completion.choices?.[0]?.message?.content ?? "").toString().trim();
    if (!text) throw new Error("Aus dem Bild konnte kein Text extrahiert werden.");

    return Response.json(
      { text },
      { headers: { ...corsHeaders, "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unbekannter Fehler" },
      { status: 400, headers: corsHeaders }
    );
  }
});
