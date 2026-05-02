export type RealtimeMode = "idle" | "connecting" | "connected" | "speaking" | "error";

export type RealtimeClientSecret = {
  value: string;
  expires_at?: number;
};

export type RealtimeSessionToken = {
  client_secret: RealtimeClientSecret;
  session_id?: string;
  expires_at?: string;
};

export type RealtimeEvent = {
  type?: string;
  [key: string]: unknown;
};

export type RealtimeVoiceConnection = {
  stop: () => Promise<void> | void;
  sendEvent: (event: RealtimeEvent) => void;
};

export type StartRealtimeVoiceOptions = {
  sessionId?: string;
  scenarioTitle?: string;
  onModeChange: (mode: RealtimeMode) => void;
  onEvent: (event: RealtimeEvent) => void;
};
