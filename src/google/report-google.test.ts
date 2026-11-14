import { expect, it } from "vitest";

import { collectLines } from "./__fixtures__/collect-lines.ts";
import { reportGoogle } from "./report-google.ts";

it("reportGoogle prints the client id, auth url, origins and Search Console", () => {
  const { lines, log } = collectLines();

  const searchConsole = { siteVerified: true, sitemaps: [{ lastSubmitted: "2026-01-01", path: "/s.xml" }] };

  const oauth = [
    {
      authBaseUrl: "https://a.example.com",
      clientIdValid: true,
      env: "prod",
      redirectOrigins: ["https://example.com"],
    },
  ];

  reportGoogle({ oauth, searchConsole }, log);

  expect(lines).toStrictEqual([
    "  OAuth:",
    "    [prod] Client ID: ✓",
    "    [prod] Auth URL: https://a.example.com",
    "    [prod] Redirect origins: https://example.com",
    "  Search Console:",
    "    Site verified: ✓",
    "    Sitemaps:",
    "      /s.xml (submitted 2026-01-01)",
  ]);
});
