import { supabase } from "../supabase/client";

type GenerateReplyInput = {
  session_id: string;
  scenario_id: string;
  latest_user_message: string;
};

export async function generateReply(input: GenerateReplyInput) {
  const { data, error } = await supabase.functions.invoke<{ reply_text: string }>("generate-reply", {
    body: input
  });

  if (error) throw error;
  return data?.reply_text ?? "";
}
