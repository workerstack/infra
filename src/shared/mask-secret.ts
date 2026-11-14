import { ID_PREVIEW_CHARS } from "./id-preview-chars.constants.ts";
import { MASK_ALL_UP_TO } from "./mask-all-up-to.constants.ts";

/** `value` with its middle hidden, for a log line. */
export function maskSecret(value: string): string {
  if (value === "") return "(empty)";

  if (value.length <= MASK_ALL_UP_TO) return "•".repeat(value.length);

  return `${value.slice(0, ID_PREVIEW_CHARS)}…${value.slice(-ID_PREVIEW_CHARS)}`;
}
