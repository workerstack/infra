import { afterEach, describe, expect, it } from "vitest";

import { cleanStackProducts, stackProduct } from "../local/__fixtures__/stack-product.ts";
import { product, testHost } from "./__fixtures__/test-host.ts";
import { runLoc } from "./run-loc.ts";

const READ_TIMEOUT = 60_000;

afterEach(cleanStackProducts);

function run(args: readonly string[], products = [stackProduct()]) {
  const { err, host } = testHost(products);
  const deps = { log: () => {}, stopSignal: Promise.resolve() };

  return { done: runLoc(args, host, deps), err };
}

describe("infra loc args", () => {
  it("prints usage and exits 2 for --all, a second name or an unknown flag", async () => {
    const { done, err } = run(["--all"], []);

    expect(await done).toBe(2);
    expect(await run(["a", "b"], []).done).toBe(2);
    expect(err).toStrictEqual(["usage: infra loc [name] [--only dir,...] [--with dir,...]"]);
  });
});

describe("infra loc refusals", () => {
  it(
    "names the dirs in the stack for an --only that matches none, and exits 1",
    async () => {
      const { done, err } = run(["--only", "api,nope"]);

      expect(await done).toBe(1);
      expect(err).toStrictEqual(["infra loc: apps/web: --only nope: not in the stack (in it: api, web)"]);
    },
    READ_TIMEOUT,
  );

  it("refuses a product with no local block, and exits 1", async () => {
    const { done, err } = run([], [product("apps/web")]);

    expect(await done).toBe(1);
    expect(err).toStrictEqual(["infra loc: apps/web: no local block in its infra config, so it has no local stack"]);
  });
});
