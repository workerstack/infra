import type { CfClient } from "../../api/client.ts";
import type { SecretWrite } from "../../provision/secret-write.ts";
import type { SetDeps } from "../set-deps.ts";

/** What the fake set deps saw: the order of runner calls, the file writes and the secret writes. */
export type SetTrace = { calls: string[]; files: Map<string, string>; secrets: SecretWrite[] };

const nothing = { edits: [], secrets: [] };

/** `SetDeps` whose runners return `turnstile`, `access` and `microsoft` results and record their calls in the trace. */
export function fakeSetDeps(
  files: Record<string, string>,
  results: { access: SecretWrite; microsoft: SecretWrite; turnstile: SecretWrite },
): { deps: SetDeps; trace: SetTrace } {
  const trace: SetTrace = { calls: [], files: new Map(Object.entries(files)), secrets: [] };
  const client: CfClient = { request: () => Promise.reject(new Error("unused")), zoneId: "zid" };
  const step = (name: string): void => {
    trace.calls.push(name);
  };

  const deps: SetDeps = {
    applyApple: () => Promise.resolve(),
    applyGoogle: () => Promise.resolve(),
    applyMicrosoft: () => {
      step("microsoft");

      return Promise.resolve({
        edits: [{ pattern: 'clientId: "STUB"', replacement: 'clientId: "app1"' }],
        secrets: [results.microsoft],
      });
    },
    applyZoneConfig: () => {
      step("zone");

      return Promise.resolve();
    },
    client: () => client,
    log: () => undefined,
    provisionAccess: () => {
      step("access");

      return Promise.resolve({ ...nothing, secrets: [results.access] });
    },
    provisionAiSearch: () => {
      step("ai-search");

      return Promise.resolve();
    },
    provisionBindings: () => {
      step("bindings");

      return Promise.resolve({
        edits: [{ pattern: 'id: "STUB"', replacement: 'id: "kv1"' }],
        secrets: [results.turnstile],
      });
    },
    readConfig: (file) => Promise.resolve(trace.files.get(file) ?? ""),
    writeConfig: (file, text) => {
      trace.files.set(file, text);
      step("write-config");

      return Promise.resolve();
    },
    writeSecrets: (_root, _product, secrets) => {
      trace.secrets.push(...secrets);
      step("write-secrets");

      return Promise.resolve();
    },
  };

  return { deps, trace };
}
