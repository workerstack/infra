import type { Json } from "../shared/json.ts";

function isObject(value: Json): value is { [key: string]: Json } {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** Paths where `desired` sets a value the live settings do not match. Live-only keys (server defaults) are ignored. */
export function observabilityDrift(desired: Json, live: Json, at = "observability"): string[] {
  if (isObject(desired)) {
    const liveObject = isObject(live) ? live : {};

    return Object.entries(desired).flatMap(([key, value]) =>
      observabilityDrift(value, liveObject[key] ?? null, `${at}.${key}`),
    );
  }

  return JSON.stringify(desired) === JSON.stringify(live)
    ? []
    : [`${at}: live ${JSON.stringify(live)} ≠ ${JSON.stringify(desired)}`];
}
