import {
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, expect, it } from "vitest";

import { INSTALLED_DIR } from "./cf-config.constants.ts";
import { linkDevServer } from "./link-dev-server.ts";

const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { force: true, recursive: true });
});

function install(dir: string, version: string): void {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "wrangler", version }));
}

// A root whose wrangler is hoisted, the way bun's hoisted linker installs it, and a package beside it with none.
function repo() {
  const root = mkdtempSync(join(tmpdir(), "dev-server-"));
  const pkg = join(root, "api/cron");

  roots.push(root);

  const hoisted = join(root, INSTALLED_DIR, "wrangler");

  install(hoisted, "4.0.0");
  mkdirSync(pkg, { recursive: true });
  writeFileSync(join(pkg, "package.json"), JSON.stringify({ name: "cron" }));

  return { hoisted, pkg };
}

it("links the hoisted wrangler into the package's own install dir, where cf looks for it", () => {
  const { hoisted, pkg } = repo();

  linkDevServer(pkg);

  const link = join(pkg, INSTALLED_DIR, "wrangler");

  expect(realpathSync(link)).toBe(realpathSync(hoisted));
  expect(JSON.parse(readFileSync(join(link, "package.json"), "utf8"))).toMatchObject({ name: "wrangler" });
});

it("leaves a package with its own wrangler alone", () => {
  const { pkg } = repo();
  const own = join(pkg, INSTALLED_DIR, "wrangler");

  install(own, "own");
  linkDevServer(pkg);

  expect(lstatSync(own).isSymbolicLink()).toBe(false);
});

it("links again over a link that points nowhere", () => {
  const { hoisted, pkg } = repo();
  const link = join(pkg, INSTALLED_DIR, "wrangler");

  mkdirSync(join(pkg, INSTALLED_DIR), { recursive: true });
  symlinkSync(join(pkg, "gone"), link, "dir");
  linkDevServer(pkg);

  expect(realpathSync(link)).toBe(realpathSync(hoisted));
});

it("fails naming the package when wrangler is installed nowhere above it", () => {
  const { pkg } = repo();

  expect(() =>
    linkDevServer(pkg, () => {
      throw new Error("Cannot find module");
    }),
  ).toThrow(`${pkg}: wrangler is not installed; run bun install`);
});
