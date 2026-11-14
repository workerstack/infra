import type { AccessApplicationVerification } from "./access-application-verification.ts";

function flag(app: AccessApplicationVerification, field: string): string {
  return app.drift.includes(field) ? "✗ drift" : "✓";
}

/** One Access application's report lines, indented under `Applications:`. */
export function accessApplicationLines(app: AccessApplicationVerification): string[] {
  if (!app.exists) return [`      ${app.name}: ✗ MISSING`];

  const session = app.drift.includes("session") ? `✗ drift (CF: ${app.sessionDuration})` : `${app.sessionDuration} ✓`;
  const decisions = app.policies.map((policy) => policy.decision).join(", ");
  const count = app.policies.length;
  const listing = `${count} (${decisions})`;
  const policies = app.drift.includes("policies") ? `✗ drift: ${count} policies (${decisions})` : `${listing} ✓`;

  return [
    `      ${app.name}:`,
    `        ✓ ${app.id}`,
    `        paths: ${flag(app, "paths")}`,
    `        session: ${session}`,
    `        allowed_idps: ${flag(app, "allowed_idps")}`,
    `        policies: ${policies}`,
  ];
}
