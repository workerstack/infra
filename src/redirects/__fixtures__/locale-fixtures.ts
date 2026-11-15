import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import type { LocaleWorker } from "../locale-worker.ts";

export const PATH = "http.request.uri.path";

type LocaleFixture = { edge?: object; rules: object[] };

const made: string[] = [];

export function routes(...patterns: string[]): { pattern: string; zone_name: string }[] {
  return patterns.map((pattern) => ({ pattern, zone_name: "h" }));
}

// The app's half of the rule, as the framework's build writes it.
export const appRule = {
  description: "framework: locale hr",
  expression: `http.request.cookies["locale"][0] eq "hr"`,
  preserveQueryString: true,
  statusCode: 302,
  targetExpression: `concat("/hr", ${PATH})`,
};

/** A product root holding each dir's `locale-redirects.json`; `cleanProducts` removes them. */
export function product(records: Partial<Record<string, LocaleFixture>>): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "locale-redirect-"));

  made.push(root);

  for (const [dir, record] of Object.entries(records)) {
    fs.mkdirSync(path.join(root, dir), { recursive: true });
    fs.writeFileSync(path.join(root, dir, "locale-redirects.json"), JSON.stringify(record));
  }

  return root;
}

export function cleanProducts(): void {
  for (const root of made.splice(0)) fs.rmSync(root, { force: true, recursive: true });
}

export function site(): LocaleWorker {
  return { dir: "web/site", name: "site", routes: routes("h/*", "h") };
}

export function docs(): LocaleWorker {
  return { dir: "web/docs", name: "docs", routes: routes("h/docs", "h/docs/*") };
}

// A second package that deploys the site's Worker: its routes are the site's own.
export function sharer(): LocaleWorker {
  return { dir: "web/site_v0", name: "site", routes: routes("h/*") };
}
