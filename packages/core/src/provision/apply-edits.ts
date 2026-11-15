import type { ConfigEdit } from "./config-edit.ts";

/** `content` with each edit applied in order. */
export function applyEdits(content: string, edits: readonly ConfigEdit[]): string {
  let result = content;

  for (const edit of edits) result = result.replace(edit.pattern, edit.replacement);

  return result;
}
