import { expect, it } from "vitest";

import { logLines } from "../provision/__fixtures__/log-lines.ts";
import type { R2EnvVerification } from "./r2-env-verification.ts";
import { reportR2 } from "./report-r2.ts";
import { reportZoneR2 } from "./report-zone-r2.ts";

const CORS = {
  allowed: { headers: ["Content-Type"], methods: ["GET" as const, "PUT" as const], origins: ["https://example.com"] },
  maxAgeSeconds: 600,
};

type Located = { locationMatches: boolean };

function result({ locationMatches }: Located): R2EnvVerification[] {
  return [
    {
      buckets: [
        {
          binding: "BUCKET",
          bucketName: "example-bucket",
          cors: [CORS],
          customDomains: [{ domain: "cdn.example.com", enabled: true, ownership: "active", ssl: "active" }],
          location: "ENAM",
          locationHint: "weur",
          locationMatches,
        },
      ],
      env: "dev",
    },
  ];
}

it("reportR2 prints the location status, CORS rules and custom domains", () => {
  const { lines, log } = logLines();

  reportR2(result({ locationMatches: false }), log);

  expect(lines).toStrictEqual([
    "  R2 Buckets:",
    "    [dev]:",
    "      BUCKET (example-bucket):",
    "        Location: ENAM ✗ drift (expected weur)",
    "        CORS (1 rule):",
    "          Origins: https://example.com",
    "          Methods: GET, PUT",
    "          Headers: Content-Type",
    "          MaxAge: 600s",
    "        Domain: cdn.example.com (enabled=true, ownership=active, ssl=active)",
  ]);
});

it("reportR2 marks a matching location with a check", () => {
  const { lines, log } = logLines();

  reportR2(result({ locationMatches: true }), log);

  expect(lines).toContain("        Location: ENAM ✓");
});

it("reportZoneR2 prints the plain location, and (none) for no CORS rules", () => {
  const { lines, log } = logLines();

  const bare = result({ locationMatches: true }).map((env) => ({
    ...env,
    buckets: env.buckets.map((bucket) => ({ ...bucket, cors: [] })),
  }));

  reportZoneR2(bare, log);

  expect(lines).toContain("        Location: ENAM");
  expect(lines).toContain("        CORS: (none)");
});
