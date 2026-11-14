const SPECIALS = /[.*+?^${}()|[\]\\]/g;

/** `text` with its regex special characters escaped, to match it literally. */
export function escapePattern(text: string): string {
  return text.replaceAll(SPECIALS, "\\$&");
}
