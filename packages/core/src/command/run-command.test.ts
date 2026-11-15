import { expect, it } from "vitest";

import { product, testHost } from "./__fixtures__/test-host.ts";
import type { CommandSpec } from "./command-spec.ts";
import { runCommand } from "./run-command.ts";

function spec(seen: string[], failOn = ""): CommandSpec {
  return {
    done: "done",
    name: "get",
    work: (item) => {
      seen.push(item.name);

      return item.name === failOn ? Promise.reject(new Error("boom")) : Promise.resolve();
    },
  };
}

const TWO = [product("apps/admin"), product("apps/web")];

it("runs the product holding the current dir when no name is given", async () => {
  const seen: string[] = [];
  const { host, out } = testHost(TWO, "/repo/apps/web/src");

  expect(await runCommand(spec(seen), [], host)).toBe(0);
  expect(seen).toStrictEqual(["apps/web"]);
  expect(out).toStrictEqual(["done"]);
});

it("names the products when the root holds two and no name is given", async () => {
  const { err, host } = testHost(TWO);

  expect(await runCommand(spec([]), [], host)).toBe(1);
  expect(err).toStrictEqual(["infra get: 2 products; name one or pass --all: apps/admin, apps/web"]);
});

it("takes the only product from the root", async () => {
  const seen: string[] = [];

  expect(await runCommand(spec(seen), [], testHost([product("apps/web")]).host)).toBe(0);
  expect(seen).toStrictEqual(["apps/web"]);
});

it("--all runs every product and a name runs one", async () => {
  const all: string[] = [];
  const one: string[] = [];

  await runCommand(spec(all), ["--all"], testHost(TWO).host);
  await runCommand(spec(one), ["apps/admin"], testHost(TWO).host);

  expect(all).toStrictEqual(["apps/admin", "apps/web"]);
  expect(one).toStrictEqual(["apps/admin"]);
});

it("an unknown name is named with the products", async () => {
  const { err, host } = testHost(TWO);

  expect(await runCommand(spec([]), ["nope"], host)).toBe(1);
  expect(err).toStrictEqual(['infra get: no product "nope"; products: apps/admin, apps/web']);
});

it("runs every product, prints each failure and exits 1", async () => {
  const seen: string[] = [];
  const { err, host, out } = testHost(TWO);

  expect(await runCommand(spec(seen, "apps/admin"), ["--all"], host)).toBe(1);
  expect(seen).toStrictEqual(["apps/admin", "apps/web"]);
  expect(err).toStrictEqual(["infra get: apps/admin: boom"]);
  expect(out).toStrictEqual([]);
});

it("a usage error prints the usage line and exits 2 before the guard", async () => {
  const { err, host } = testHost(TWO, "/repo", "blocked");

  expect(await runCommand(spec([]), ["a", "b"], host)).toBe(2);
  expect(err).toStrictEqual(["usage: infra get [name|--all]"]);
});

it("the guard line exits 1 and no work runs", async () => {
  const seen: string[] = [];
  const { err, host } = testHost(TWO, "/repo", "refusing");

  expect(await runCommand(spec(seen), ["--all"], host)).toBe(1);
  expect(err).toStrictEqual(["infra get: refusing"]);
  expect(seen).toStrictEqual([]);
});
