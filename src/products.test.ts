import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { discoverProducts, productAt, selectProducts } from "./products.ts";

const DEFINE = fileURLToPath(new URL("define-infra-config.ts", import.meta.url));

const WITH_DEFAULT = `import { defineInfraConfig } from ${JSON.stringify(DEFINE)};
export default defineInfraConfig({ env: { global: {} }, local: { host: "app.localhost", vars: () => ({}) } });
`;

let root = "";

function write(relative: string, source: string): void {
  const file = join(root, relative);

  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, source);
}

function writeConfig(dir: string): void {
  write(join(dir, "infra.config.ts"), WITH_DEFAULT);
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "products-"));
});

afterEach(() => {
  rmSync(root, { force: true, recursive: true });
});

describe("discoverProducts", () => {
  it("names products by directory, sorted, with root, configFile and config", async () => {
    writeConfig("apps/a/b");
    writeConfig("apps/web");
    writeConfig(".");

    const products = await discoverProducts(root);

    expect(products.map((product) => product.name)).toStrictEqual([".", "apps/a/b", "apps/web"]);
    expect(products[1]?.root).toBe(join(root, "apps/a/b"));
    expect(products[1]?.configFile).toBe(join(root, "apps/a/b/infra.config.ts"));
    expect(products[1]?.config.local?.host).toBe("app.localhost");
  });

  it("skips node_modules, .worktrees and the other ignored directories", async () => {
    writeConfig("apps/web");

    for (const skipped of ["node_modules/pkg", ".worktrees/x", ".git/x", "dist", ".tmp/x", ".repo/x"])
      writeConfig(skipped);

    const products = await discoverProducts(root);

    expect(products.map((product) => product.name)).toStrictEqual(["apps/web"]);
  });

  it("throws a usage line for a config with no default export", async () => {
    write("apps/web/infra.config.ts", "export const config = {};\n");

    await expect(discoverProducts(root)).rejects.toThrow(
      "apps/web/infra.config.ts: no default export; export default defineInfraConfig({ ... })",
    );
  });
});

function three() {
  writeConfig("apps/web");
  writeConfig("apps/admin");

  return discoverProducts(root);
}

describe("discoverProducts default export", () => {
  it.each(["5", "null"])("throws for a default export of %s", async (value) => {
    write("apps/web/infra.config.ts", `export default ${value};\n`);

    await expect(discoverProducts(root)).rejects.toThrow(
      "apps/web/infra.config.ts: default export is not an infra config; export default defineInfraConfig({ ... })",
    );
  });
});

describe("selectProducts", () => {
  it("picks one by name", async () => {
    const products = await three();

    expect(selectProducts(root, products, { name: "apps/web" })).toStrictEqual({
      ok: true,
      products: [products[1]],
    });
  });

  it("picks all", async () => {
    const products = await three();

    expect(selectProducts(root, products, { all: true })).toStrictEqual({ ok: true, products });
  });

  it("picks the only product with no target", async () => {
    writeConfig("apps/web");

    const products = await discoverProducts(root);

    expect(selectProducts(root, products, undefined)).toStrictEqual({ ok: true, products });
  });
});

describe("selectProducts errors", () => {
  it("says when none are found", () => {
    expect(selectProducts(root, [], undefined)).toStrictEqual({
      error: `no infra.config.ts under ${root}`,
      ok: false,
    });
  });

  it("lists the products for an unknown name", async () => {
    const products = await three();

    expect(selectProducts(root, products, { name: "web" })).toStrictEqual({
      error: 'no product "web"; products: apps/admin, apps/web',
      ok: false,
    });
  });

  it("asks for a name or --all when several exist", async () => {
    const products = await three();

    expect(selectProducts(root, products, undefined)).toStrictEqual({
      error: "2 products; name one or pass --all: apps/admin, apps/web",
      ok: false,
    });
  });
});

describe("productAt", () => {
  it("picks the deepest product holding the dir", async () => {
    writeConfig("apps/web");
    writeConfig("apps/web/api");

    const products = await discoverProducts(root);
    const picked = productAt(root, products, join(root, "apps/web/api/src"));

    expect(picked.ok && picked.products.map((product) => product.name)).toStrictEqual(["apps/web/api"]);
  });

  it("picks a product for its own root", async () => {
    writeConfig("apps/web");

    const products = await discoverProducts(root);

    expect(productAt(root, products, join(root, "apps/web"))).toStrictEqual({ ok: true, products });
  });

  it("does not treat apps/web2 as inside apps/web", async () => {
    writeConfig("apps/web");

    const products = await discoverProducts(root);

    expect(productAt(root, products, join(root, "apps/web2"))).toStrictEqual({
      error: `no product holds ${join(root, "apps/web2")}; run it inside one of: apps/web`,
      ok: false,
    });
  });

  it("lists the products when none holds the dir", async () => {
    const products = await three();

    expect(productAt(root, products, root)).toStrictEqual({
      error: `no product holds ${root}; run it inside one of: apps/admin, apps/web`,
      ok: false,
    });
  });
});
