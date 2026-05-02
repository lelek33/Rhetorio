export type AudioRecordingResult = {
  uri: string;
  durationMs: number;
};

export async function startAudioRecording(): Promise<void> {
  throw new Error("Push-to-Talk ist im MVP vorbereitet, aber noch nicht aktiviert.");
}

export async function stopAudioRecording(): Promise<AudioRecordingResult> {
  throw new Error("Push-to-Talk ist im MVP vorbereitet, aber noch nicht aktiviert.");
}
