import { MESSAGE_MAX } from "./logs.constants.ts";

/** `text` cut to the longest message a summary line shows. */
export function clip(text: string): string {
  return text.length > MESSAGE_MAX ? `${text.slice(0, MESSAGE_MAX)}…` : text;
}
