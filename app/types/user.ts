export type Profile = {
  id: string;
  email: string | null;
  created_at: string;
  subscription_status: "free" | "premium";
  free_sessions_used: number;
  training_goal?: string | null;
};
