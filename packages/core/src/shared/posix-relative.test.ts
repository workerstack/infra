import path from "node:path";

import { expect, it } from "vitest";

import { posixRelative } from "./posix-relative.ts";

it("gives the relative path with / on win32, where relative gives \\", () => {
  expect(posixRelative("D:\\repo", "D:\\repo\\apps\\web\\api", path.win32)).toBe("apps/web/api");
  expect(posixRelative("D:\\repo", "D:\\repo", path.win32)).toBe("");
});

it("gives the relative path unchanged on posix, and uses the platform's path by default", () => {
  expect(posixRelative("/repo", "/repo/.tmp/infra/tail", path.posix)).toBe(".tmp/infra/tail");
  expect(posixRelative(path.join("/repo"), path.join("/repo", "a", "b.json"))).toBe("a/b.json");
});
