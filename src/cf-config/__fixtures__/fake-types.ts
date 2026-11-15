import type { InfraScope } from "../../schema/infra.ts";

/** A `runTypes` for `runCfGen` that types nothing and records each package and mode it was asked for. */
export function fakeTypes() {
  const calls: [string, InfraScope][] = [];

  function runTypes(dir: string, scope: InfraScope): Promise<void> {
    calls.push([dir, scope]);

    return Promise.resolve();
  }

  return { calls, runTypes };
}
