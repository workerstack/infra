import { STUB } from "./stub.constants.ts";

/** True for a value that is not yet a real id: the `STUB` marker, an empty string or nothing. */
export function isPlaceholder(value: string | undefined): boolean {
  return value === STUB || value === undefined || value === "";
}
