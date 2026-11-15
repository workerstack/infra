import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { cleanStackProducts, stackProduct } from "./__fixtures__/stack-product.ts";
import { landing } from "./landing.ts";
import { productStack } from "./product-stack.ts";

const READ_TIMEOUT = 60_000;

afterEach(cleanStackProducts);

describe("productStack", () => {
  it(
    "runs the Worker and the app in local.apps, and leaves the other Vite package and the container out",
    async () => {
      const product = stackProduct();
      const stack = await productStack(product, {});

      expect(stack.members.map((member) => [member.dir, member.kind, member.name])).toStrictEqual([
        ["api", "worker", "stack-api-local"],
        ["web", "app", "stack-web-local"],
      ]);
      expect(stack.members[0]?.config).toBe(join(product.root, "api/.cloudflare/wrangler.local.json"));
      expect(landing(stack, "example.localhost", "/api/x")).toMatchObject({ member: { dir: "api" } });
      expect(landing(stack, "example.localhost", "/app/x")).toMatchObject({ member: { dir: "web" } });
      expect(landing(stack, "site.example.localhost", "/")).toStrictEqual({
        dirs: ["site"],
        kind: "outside",
        why: "vite",
      });
      expect(landing(stack, "example.localhost", "/box")).toStrictEqual({
        dirs: ["box"],
        kind: "outside",
        why: "opt-in",
      });
    },
    READ_TIMEOUT,
  );
});

describe("productStack with --with", () => {
  it(
    "joins the container Worker",
    async () => {
      const withBox = await productStack(stackProduct(), { with: ["box"] });

      expect(withBox.members.find((member) => member.dir === "box")).toMatchObject({ container: true, kind: "worker" });
    },
    READ_TIMEOUT,
  );
});

describe("productStack refusals", () => {
  it(
    "fails an app dir with no Worker package, listing the Worker packages",
    async () => {
      await expect(productStack(stackProduct(["web", "nope"]), {})).rejects.toThrow(
        "local.apps names nope, which has no cloudflare.config.ts (Worker packages: api, box, site, web)",
      );
    },
    READ_TIMEOUT,
  );
});
