/** A request body that is text; anything else reads as empty. */
export function bodyText(init: RequestInit): string {
  return typeof init.body === "string" ? init.body : "";
}
