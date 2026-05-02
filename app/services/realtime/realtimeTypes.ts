export type RealtimeMode = "idle" | "connecting" | "connected" | "speaking" | "error";

export type RealtimeSessionToken = {
  token: string;
  expires_at: string;
};
