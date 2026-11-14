import { expect, it } from "vitest";

import { collectLines } from "./__fixtures__/collect-lines.ts";
import { reportMicrosoft } from "./report-microsoft.ts";

it("reportMicrosoft prints the app, audience, redirect URIs and secrets", () => {
  const { lines, log } = collectLines();

  const oauth = [
    {
      appName: "Example App",
      env: "prod",
      exists: true,
      redirectUris: ["https://example.com"],
      secretCount: 2,
      signInAudience: "common",
    },
  ];

  reportMicrosoft({ oauth }, log);

  expect(lines).toStrictEqual([
    "  OAuth:",
    "    [prod] Example App ✓",
    "      Audience: common",
    "      Redirect URIs: https://example.com",
    "      Secrets: 2",
  ]);
});
