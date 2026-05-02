import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

type GenerateReplyBody = {
  session_id: string;
  scenario_id: string;
  latest_user_message: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const body = (await req.json()) as GenerateReplyBody;
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
      .select("id,user_id,status")
      .eq("id", body.session_id)
      .single();

    if (!session || session.user_id !== userData.user.id) throw new Error("Session nicht gefunden.");

    const { data: scenario } = await admin
      .from("scenarios")
      .select("title,system_prompt")
      .eq("id", body.scenario_id)
      .single();

    if (!scenario) throw new Error("Szenario nicht gefunden.");

    const { data: messages } = await admin
      .from("messages")
      .select("role,content")
      .eq("session_id", body.session_id)
      .order("created_at", { ascending: true })
      .limit(24);

    const chatMessages = [
      {
        role: "system",
        content: `${scenario.system_prompt}\nSzenario: ${scenario.title}\nAntworte mit maximal 2-4 kurzen Saetzen. Kein Coaching-Feedback.`
      },
      ...(messages ?? []).map((message) => ({
        role: message.role === "assistant" ? "assistant" : "user",
        content: message.content
      }))
    ];

    const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages: chatMessages,
        temperature: 0.75,
        max_tokens: 180
      })
    });

    if (!openAiResponse.ok) throw new Error(await openAiResponse.text());
    const completion = await openAiResponse.json();
    const replyText = completion.choices?.[0]?.message?.content?.trim();
    if (!replyText) throw new Error("OpenAI hat keine Antwort geliefert.");

    const { error: insertError } = await admin
      .from("messages")
      .insert({ session_id: body.session_id, role: "assistant", content: replyText });

    if (insertError) throw insertError;

    return Response.json({ reply_text: replyText }, { headers: corsHeaders });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unbekannter Fehler" },
      { status: 400, headers: corsHeaders }
    );
  }
});
