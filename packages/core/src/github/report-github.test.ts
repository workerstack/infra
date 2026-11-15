import { expect, it } from "vitest";

import { collectLines } from "../microsoft/__fixtures__/collect-lines.ts";
import { reportGithub } from "./report-github.ts";

const found = {
  appName: "Example App",
  clientId: "matches" as const,
  env: "prod",
  exists: true,
  hasSecret: true,
  slug: "example-app",
};

it("reportGithub prints each app, its slug, the client id check and the secret", () => {
  const { lines, log } = collectLines();

  reportGithub(
    { oauth: [found, { ...found, clientId: "unchecked", env: "dev", exists: false, hasSecret: false }] },
    log,
  );

  expect(lines).toStrictEqual([
    "  OAuth:",
    "    [prod] Example App (example-app) ✓",
    "      Client id: matches",
    "      Secret: set",
    "    [dev] Example App (example-app) ✗",
    "      Client id: unchecked",
    "      Secret: missing",
  ]);
});

it("reportGithub prints nothing with no apps", () => {
  const { lines, log } = collectLines();

  reportGithub({ oauth: [] }, log);

  expect(lines).toStrictEqual([]);
});
