import type { DeployScope } from "../workers/deploy-scope.ts";

const VITE_BUILD = /\bvite\s+build\b/;

/**
 * The script that builds the scope's Worker: `build:<scope>`, or none for a Worker `cf` bundles itself. A package that
 * builds with Vite ships its build output, so without `build:<scope>` a deploy would upload whatever an earlier build
 * left: refused, naming the script to add.
 */
export function buildScriptOf(scripts: Record<string, string>, scope: DeployScope): string | undefined {
  const script = `build:${scope}`;

  if (script in scripts) return script;

  if (Object.values(scripts).some((command) => VITE_BUILD.test(command))) {
    throw new Error(
      `a script runs \`vite build\`, so infra deploy needs a \`${script}\` script to build the Worker it ships`,
    );
  }

  return undefined;
}
