import { eachOAuthScope } from "../shared/each-oauth-scope.ts";
import { STUB } from "../shared/stub.constants.ts";
import { getGithubApp, type GithubApp } from "./get-github-app.ts";
import { GITHUB_API } from "./github-api.constants.ts";
import { githubAppSlug } from "./github-app-slug.ts";
import type { GithubTarget } from "./github-target.ts";
import type { GithubVerifyResult } from "./github-verify-result.ts";

type ClientIdCheck = GithubVerifyResult["oauth"][number]["clientId"];

function clientIdCheck(app: GithubApp | undefined, clientId: string): ClientIdCheck {
  if (app === undefined) return "unchecked";

  return app.client_id === clientId ? "matches" : "differs";
}

/** Checks each scope's app exists on GitHub by its slug, its client id matches, and the env has its secret. */
export async function verifyGithubConfig(target: GithubTarget): Promise<GithubVerifyResult> {
  const result: GithubVerifyResult = { oauth: [] };
  const call = { apiBase: target.apiBase ?? GITHUB_API, fetcher: target.fetcher ?? fetch };

  await eachOAuthScope(target.config.oauth, async (scope, oauth) => {
    const slug = githubAppSlug(oauth.appName);
    const unset = oauth.clientId === "" || oauth.clientId === STUB;
    const app = unset ? undefined : await getGithubApp({ ...call, slug });
    const hasSecret = (target.env[scope].GITHUB_CLIENT_SECRET ?? "") !== "";

    result.oauth.push({
      appName: oauth.appName,
      clientId: clientIdCheck(app, oauth.clientId),
      env: scope,
      exists: app !== undefined,
      hasSecret,
      slug,
    });
  });

  return result;
}
