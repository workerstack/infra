import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname } from "node:path";

import { expect, test } from "vitest";

import { fakeDeployIo } from "./__fixtures__/fake-deploy-io.ts";
import type { FakeCall } from "./__fixtures__/fake-deploy-io.ts";
import { fakeTarget } from "./__fixtures__/fake-target.ts";
import type { DeployRequest } from "./deploy-request.ts";
import { deploy } from "./deploy.ts";

const OWNER_ONLY = 0o600;
const PERMISSION_BITS = 0o777;
const SECRETS = { API_KEY: "sk-live-4417", DB_URL: "postgres://user:hunter2@db/app" };
const REQUEST: DeployRequest = { prune: false, scope: "prod", targets: [fakeTarget()] };

type Seen = { body: string; file: string; mode: number };

// What the secrets file looks like while `cf deploy` runs, and what to do after: succeed, exit 3 or throw.
function watch(end: "exit" | "ok" | "throw") {
  const seen: Seen[] = [];

  function onSpawn(call: FakeCall): number {
    const file = call.args[call.args.indexOf("--secrets-file") + 1];

    if (call.tool !== "cf" || file === undefined) return 0;

    seen.push({ body: readFileSync(file, "utf8"), file, mode: statSync(file).mode & PERMISSION_BITS });

    if (end === "throw") throw new Error("spawn failed");

    return end === "exit" ? 3 : 0;
  }

  return { onSpawn, seen };
}

test("cf deploy reads a 0600 file that holds exactly the declared secrets", async () => {
  const { onSpawn, seen } = watch("ok");
  const { io } = fakeDeployIo({ onSpawn, secrets: SECRETS });

  expect(await deploy(REQUEST, io)).toBe(0);
  expect(seen).toHaveLength(1);
  expect(seen[0]?.mode).toBe(OWNER_ONLY);
  expect(JSON.parse(seen[0]?.body ?? "")).toStrictEqual(SECRETS);
});

test.each(["ok", "exit", "throw"] as const)("the file is gone after a run that ends with %s", async (end) => {
  const { onSpawn, seen } = watch(end);
  const { io } = fakeDeployIo({ onSpawn, secrets: SECRETS });

  expect(await deploy(REQUEST, io)).toBe(end === "ok" ? 0 : 1);

  const file = seen[0]?.file ?? "";

  expect(file).not.toBe("");
  expect(existsSync(file)).toBe(false);
  expect(existsSync(dirname(file))).toBe(false);
});

test.each(["ok", "exit", "throw"] as const)(
  "no secret value is in an arg or a line when a run ends with %s",
  async (end) => {
    const { onSpawn } = watch(end);
    const { calls, err, io, out } = fakeDeployIo({ listed: ["OLD"], onSpawn, secrets: SECRETS });

    await deploy({ ...REQUEST, prune: true }, io);

    const everything = JSON.stringify([calls.map((call) => call.args), err, out]);

    for (const value of Object.values(SECRETS)) expect(everything).not.toContain(value);
  },
);

test("a Worker with no secrets gets no secrets file", async () => {
  const { calls, io } = fakeDeployIo();

  await deploy(REQUEST, io);

  expect(calls[0]?.args).toStrictEqual(["deploy", "--mode", "prod"]);
});
