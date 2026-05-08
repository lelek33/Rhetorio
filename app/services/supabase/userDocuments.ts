import { supabase } from "./client";

export type UserDocumentSourceType = "paste" | "txt" | "md" | "pdf" | "image";

export type UserDocument = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  source_filename: string | null;
  source_type: UserDocumentSourceType;
  char_count: number;
  created_at: string;
};

export async function listUserDocuments(userId: string): Promise<UserDocument[]> {
  const { data, error } = await supabase
    .from("user_documents")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as UserDocument[];
}

type CreateDocumentInput = {
  userId: string;
  title: string;
  content: string;
  sourceFilename?: string | null;
  sourceType: UserDocumentSourceType;
};

export async function createUserDocument({ userId, title, content, sourceFilename, sourceType }: CreateDocumentInput): Promise<UserDocument> {
  const { data, error } = await supabase
    .from("user_documents")
    .insert({
      user_id: userId,
      title,
      content,
      source_filename: sourceFilename ?? null,
      source_type: sourceType,
      char_count: content.length
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as UserDocument;
}

export async function deleteUserDocument(documentId: string): Promise<void> {
  const { error } = await supabase.from("user_documents").delete().eq("id", documentId);
  if (error) throw error;
}
