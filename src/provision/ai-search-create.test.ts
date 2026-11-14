import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import type { AiSearchInstanceConfig } from "../schema/bindings.ts";
import { aiSearchCreateArgs } from "./ai-search-create-args.ts";
import { createAiSearch } from "./ai-search-create.ts";

const roots: string[] = [];

const CONFIG: AiSearchInstanceConfig = {
  chunkSize: 512,
  dataSource: { source: "https://example.com/sitemap.xml", type: "web-crawler" },
  embeddingModel: "example-embedder",
  hybridSearch: false,
  instanceName: "example-search",
};

const SCRIPT = [
  'const fs = require("node:fs");',
  "const args = process.argv.slice(2);",
  'fs.appendFileSync(process.env.RECORD, args.join(" ") + "\\n");',
  "process.exit(process.env.FAIL === args[0] ? 1 : 0);",
].join("\n");

type Fixture = { record: string; root: string };

function emptyRepo(): string {
  const root = mkdtempSync(join(tmpdir(), "ai-search-"));

  roots.push(root);
  writeFileSync(join(root, "package.json"), "{}");

  return root;
}

// A wrangler package whose bin records its arguments, and fails the subcommand FAIL names.
function repoWithWrangler(): Fixture {
  const root = emptyRepo();
  const dir = join(root, "node_modules", "wrangler");

  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ bin: { wrangler: "bin.js" }, name: "wrangler" }));
  writeFileSync(join(dir, "bin.js"), SCRIPT);

  return { record: join(root, "record.txt"), root };
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { force: true, recursive: true });
});

describe("createAiSearch", () => {
  it("runs whoami, then ai-search create, through the wrangler peer with the given env", async () => {
    const { record, root } = repoWithWrangler();

    await createAiSearch(CONFIG, { env: { RECORD: record }, root });

    expect(readFileSync(record, "utf8").trim().split("\n")).toStrictEqual([
      "whoami",
      "ai-search create example-search --type web-crawler --source https://example.com/sitemap.xml " +
        "--embedding-model example-embedder --chunk-size 512 --hybrid-search false",
    ]);
  });

  it("tells the user to log in when whoami fails, and does not create", async () => {
    const { record, root } = repoWithWrangler();
    const env = { FAIL: "whoami", RECORD: record };

    await expect(createAiSearch(CONFIG, { env, root })).rejects.toThrow("bunx wrangler login");
    expect(readFileSync(record, "utf8")).toBe("whoami\n");
  });

  it("names the instance when the create fails", async () => {
    const { record, root } = repoWithWrangler();
    const env = { FAIL: "ai-search", RECORD: record };

    await expect(createAiSearch(CONFIG, { env, root })).rejects.toThrow(
      'wrangler ai-search create "example-search" failed',
    );
  });

  it("says how to install wrangler when it is missing", async () => {
    await expect(createAiSearch(CONFIG, { env: {}, root: emptyRepo() })).rejects.toThrow(
      "the wrangler package is not installed; run bun add -d wrangler",
    );
  });
});

describe("aiSearchCreateArgs", () => {
  it("adds a flag only for each setting that is set", () => {
    expect(aiSearchCreateArgs({ ...CONFIG, matchThreshold: 0.4, maxNumResults: 5 }).slice(-4)).toStrictEqual([
      "--max-num-results",
      "5",
      "--score-threshold",
      "0.4",
    ]);
  });
});
