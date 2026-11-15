import type { Answer } from "../../shared/__fixtures__/fake-client.ts";

/** A happy-path zone for `applyZoneConfig`: every list is empty, every write is acknowledged; `routes` override. */
export function applyAnswer(routes: Record<string, object> = {}): Answer {
  return ({ method, path }) => {
    const override = routes[`${method} ${path}`];

    if (override !== undefined) return override;

    return method === "GET" ? [] : {};
  };
}
