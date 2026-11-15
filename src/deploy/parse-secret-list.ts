import { z } from "zod";

function listSchema() {
  return z.array(z.object({ name: z.string() }));
}

/** The secret names `wrangler secret list` prints as a JSON list, with whatever banner lines surround it. */
export function parseSecretList(stdout: string): string[] {
  const json = stdout.slice(stdout.indexOf("["), stdout.lastIndexOf("]") + 1);
  const parsed = listSchema().safeParse(JSON.parse(json === "" ? "null" : json));

  if (!parsed.success) throw new Error(`wrangler secret list printed no JSON list:\n${stdout}`);

  return parsed.data.map((entry) => entry.name);
}
