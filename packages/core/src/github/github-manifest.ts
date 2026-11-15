import type { GithubOAuthEnv } from "../schema/github.ts";
import { GITHUB_CALLBACK_PATH } from "./github-callback-path.constants.ts";

/** The GitHub App manifest the form posts: the sign-in app, with no webhook. */
export type GithubManifest = {
  callback_urls: string[];
  default_permissions: { email_addresses: "read" };
  hook_attributes: { active: false; url: string };
  name: string;
  public: boolean;
  redirect_url: string;
  url: string;
};

/** The manifest for one scope's app; GitHub sends the browser back to `redirectUrl` with the code. */
export function githubManifest(input: { oauth: GithubOAuthEnv; redirectUrl: string }): GithubManifest {
  const { oauth, redirectUrl } = input;

  return {
    callback_urls: oauth.redirectOrigins.map((origin) => `${origin}${GITHUB_CALLBACK_PATH}`),
    default_permissions: { email_addresses: "read" },
    hook_attributes: { active: false, url: oauth.homepageUrl },
    name: oauth.appName,
    public: oauth.public ?? true,
    redirect_url: redirectUrl,
    url: oauth.homepageUrl,
  };
}
