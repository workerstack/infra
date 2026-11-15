/** A program a deploy runs: `bun` builds the Worker, `cf` deploys it and `wrangler` lists and deletes its secrets. */
export type DeployTool = "bun" | "cf" | "wrangler";
