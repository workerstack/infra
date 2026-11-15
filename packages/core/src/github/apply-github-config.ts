import type { Provisioned } from "../provision/provisioned.ts";
import { eachOAuthScope } from "../shared/each-oauth-scope.ts";
import { stdoutLog } from "../shared/stdout-log.ts";
import { applyGithubScope } from "./apply-github-scope.ts";
import { githubEdges } from "./github-edges.ts";
import type { GithubTarget } from "./github-target.ts";

/**
 * Creates each STUB scope's GitHub App in the browser; returns the config edits for new ids and the secrets to
 * write.
 */
export async function applyGithubConfig(target: GithubTarget): Promise<Provisioned> {
  const out: Provisioned = { edits: [], secrets: [] };
  const log = target.log ?? stdoutLog;

  if (target.config.oauth === undefined) return out;

  const edges = githubEdges(target);

  log("  OAuth:");

  await eachOAuthScope(target.config.oauth, async (scope, oauth) => {
    const hasSecret = (target.env[scope].GITHUB_CLIENT_SECRET ?? "") !== "";

    await applyGithubScope({ edges, hasSecret, log, oauth, out, scope });
  });

  return out;
}
