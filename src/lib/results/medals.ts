// Plain module (no "use server"): every export of a server-action file must be
// an async function, so shared sync helpers cannot live there.

export function medalLabel(medal: string): string {
  return medal === "HONOURABLE_MENTION"
    ? "Honourable Mention"
    : medal.charAt(0) + medal.slice(1).toLowerCase() + " Medal";
}
