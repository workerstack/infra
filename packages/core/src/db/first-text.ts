/** The first of the texts that is not blank, trimmed; `fallback` when all are. */
export function firstText(texts: readonly string[], fallback: string): string {
  return texts.map((text) => text.trim()).find((text) => text.length > 0) ?? fallback;
}
