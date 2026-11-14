import type { AccessEnvVerification } from "./access-env-verification.ts";

const ROTATE_HINT = "rotate: delete in CF dashboard then re-run infra set";

function idpLine(idp: AccessEnvVerification["googleIdp"]): string {
  if (!idp.exists) return "    Google IdP: ✗ MISSING";

  return `    Google IdP: ${idp.clientIdMatches ? `✓ ${idp.id}` : "✗ drift: client_id mismatch"}`;
}

function tokenLine(token: AccessEnvVerification["serviceToken"]): string {
  const label = `    Service token (${token.name}):`;

  if (token.configHasStub && token.exists) return `${label} ✗ config has STUB but CF has token — ${ROTATE_HINT}`;

  if (!token.exists) return `${label} ✗ MISSING`;

  return `${label} ${token.clientIdMatches ? `✓ ${token.id}` : "✗ drift: client_id mismatch"}`;
}

/** One scope's report lines: heading, organization, Google IdP and service token. */
export function accessScopeLines(result: AccessEnvVerification): string[] {
  const org = result.organization.exists ? `${result.organization.authDomain} ✓` : "✗ MISSING";

  return [
    `  Access [${result.env}]:`,
    `    Organization: ${org}`,
    idpLine(result.googleIdp),
    tokenLine(result.serviceToken),
  ];
}
