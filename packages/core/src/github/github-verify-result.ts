/** What `verifyGithubConfig` found per scope: the app by its slug, its client id against the config, the secret. */
export type GithubVerifyResult = {
  oauth: {
    appName: string;
    clientId: "differs" | "matches" | "unchecked";
    env: string;
    exists: boolean;
    hasSecret: boolean;
    slug: string;
  }[];
};
