import type { Json } from "../shared/json.ts";

const JSON_START = /[[{]/;

function parse(text: string): { value: Json } | undefined {
  try {
    return { value: JSON.parse(text) /* JSON.parse yields only JSON values */ as Json };
  } catch {
    return undefined;
  }
}

/** The JSON value in `wrangler --json` stdout, which may print a banner before it. */
export function extractJsonValue(stdout: string): Json {
  const trimmed = stdout.trim();
  const whole = parse(trimmed);

  if (whole !== undefined) return whole.value;

  const start = trimmed.search(JSON_START);
  const slice = trimmed.slice(Math.max(start, 0));
  const end = Math.max(slice.lastIndexOf("]"), slice.lastIndexOf("}"));
  const found = start < 0 || end < 0 ? undefined : parse(slice.slice(0, end + 1));

  if (found === undefined) throw new Error(`wrangler --json produced no JSON:\n${stdout}`);

  return found.value;
}
