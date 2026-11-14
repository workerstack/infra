import { expect, it } from "vitest";

import { logLines } from "../provision/__fixtures__/log-lines.ts";
import type { AccessApplicationVerification } from "./access-application-verification.ts";
import type { AccessEnvVerification } from "./access-env-verification.ts";
import { reportAccess } from "./report-access.ts";

const APP: AccessApplicationVerification = {
  allowedIdps: ["idp_abc"],
  drift: [],
  exists: true,
  id: "app_123",
  name: "Example Admin",
  policies: [
    { decision: "service_auth", id: "p1", name: "a" },
    { decision: "allow", id: "p2", name: "b" },
  ],
  selfHostedDomains: [],
  sessionDuration: "8h",
};

function scope(overrides: Partial<AccessEnvVerification> = {}): AccessEnvVerification {
  return {
    applications: [APP],
    env: "dev",
    googleIdp: { clientIdMatches: true, exists: true, id: "idp_abc" },
    organization: { authDomain: "team.cloudflareaccess.com", exists: true },
    serviceToken: { clientIdMatches: true, configHasStub: false, exists: true, id: "tok", name: "example-access-dev" },
    ...overrides,
  };
}

it("reportAccess prints a healthy scope with its application checks", () => {
  const { lines, log } = logLines();

  reportAccess([scope()], log);

  expect(lines).toStrictEqual([
    "  Access [dev]:",
    "    Organization: team.cloudflareaccess.com ✓",
    "    Google IdP: ✓ idp_abc",
    "    Service token (example-access-dev): ✓ tok",
    "    Applications:",
    "      Example Admin:",
    "        ✓ app_123",
    "        paths: ✓",
    "        session: 8h ✓",
    "        allowed_idps: ✓",
    "        policies: 2 (service_auth, allow) ✓",
  ]);
});

it("reportAccess prints drift, missing and stub lines", () => {
  const { lines, log } = logLines();
  const drifted = { ...APP, drift: ["paths", "session", "allowed_idps", "policies"], sessionDuration: "24h" };

  reportAccess(
    [
      scope({
        applications: [drifted, { ...APP, exists: false, name: "Gone" }],
        googleIdp: { clientIdMatches: false, exists: true, id: "idp_abc" },
        organization: { exists: false },
        serviceToken: { clientIdMatches: false, configHasStub: true, exists: true, name: "t" },
      }),
    ],
    log,
  );

  expect(lines).toContain("    Organization: ✗ MISSING");
  expect(lines).toContain("    Google IdP: ✗ drift: client_id mismatch");

  expect(lines).toContain(
    "    Service token (t): ✗ config has STUB but CF has token — rotate: delete in CF dashboard then re-run infra set",
  );

  expect(lines).toContain("        paths: ✗ drift");
  expect(lines).toContain("        session: ✗ drift (CF: 24h)");
  expect(lines).toContain("        allowed_idps: ✗ drift");
  expect(lines).toContain("        policies: ✗ drift: 2 policies (service_auth, allow)");
  expect(lines).toContain("      Gone: ✗ MISSING");
});

it("reportAccess prints a missing IdP and token, and no Applications heading without apps", () => {
  const { lines, log } = logLines();

  reportAccess(
    [
      scope({
        applications: [],
        googleIdp: { clientIdMatches: false, exists: false },
        serviceToken: { clientIdMatches: false, configHasStub: false, exists: false, name: "t" },
      }),
    ],
    log,
  );

  expect(lines).toContain("    Google IdP: ✗ MISSING");
  expect(lines).toContain("    Service token (t): ✗ MISSING");
  expect(lines).not.toContain("    Applications:");
});
