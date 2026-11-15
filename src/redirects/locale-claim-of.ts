import { localeHostOf } from "./locale-host-of.ts";
import { LOCALE_PATH } from "./locale-path.constants.ts";

// The paths a route claims on `host`, as a rule condition, or none for another host. A more
// specific route beats the app's `host/*`, so each one is a path the app's Worker never sees.
export function localeClaimOf(host: string, pattern: string): string | undefined {
  const at = localeHostOf(pattern);

  if (at.includes("*")) throw new Error(`route "${pattern}" has a wildcard host; name the host`);

  if (at !== host) return undefined;

  const route = pattern.slice(at.length);
  const start = route.endsWith("*") ? route.slice(0, route.length - 1) : route;

  if (start === "" || start === "/")
    throw new Error(`route "${pattern}" claims the whole host, so no app's locale rule can share it`);

  if (start.includes("*")) throw new Error(`route "${pattern}" has a wildcard inside its path; a rule can't state it`);

  return start === route ? `${LOCALE_PATH} eq "${start}"` : `starts_with(${LOCALE_PATH}, "${start}")`;
}
