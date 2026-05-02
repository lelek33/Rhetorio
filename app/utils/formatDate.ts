export function formatDate(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();

  return isToday
    ? `Heute · ${date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}`
    : date.toLocaleDateString("de-DE", { day: "2-digit", month: "short" });
}

export function formatDuration(seconds?: number | null) {
  if (!seconds) return "0 Min.";
  const minutes = Math.max(1, Math.round(seconds / 60));
  return `${minutes} Min.`;
}
