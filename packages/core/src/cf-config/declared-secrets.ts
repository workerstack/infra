import type { JsonObject } from "./json-object.ts";
import { objectAt } from "./object-at.ts";
import { stringsAt } from "./strings-at.ts";

/** The secret names a converted config declares: what a deploy uploads and `.dev.vars.<scope>` holds. */
export function declaredSecrets(wrangler: JsonObject): string[] {
  return stringsAt(objectAt(wrangler, "secrets"), "required");
}
