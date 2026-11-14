import { expect, it } from "vitest";

import { collectLines } from "./__fixtures__/collect-lines.ts";
import { reportApple } from "./report-apple.ts";

it("reportApple prints each key line and the JWKS state", () => {
  const { lines, log } = collectLines();

  const oauth = [
    {
      env: "prod",
      keyId: "K1",
      keyValid: false,
      redirectOrigins: ["https://example.com"],
      serviceId: "com.example",
      teamId: "T1",
    },
  ];

  reportApple({ jwksReachable: false, oauth }, log);

  expect(lines).toContain("    [prod] Key valid: ✗");
  expect(lines.at(-1)).toBe("  JWKS endpoint: unreachable ✗");
});
