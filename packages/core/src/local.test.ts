import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { afterEach, expect, it } from "vitest";

import {
  findLocalStack,
  type LocalStack,
  localStackPath,
  readLocalStack,
  subdomainOrigin,
  WORKER_HEADER,
} from "./local.ts";

const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { force: true, recursive: true });
});

function productRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "infra-local-"));

  roots.push(root);

  return root;
}

it("reads the running stack a product's state file names, as @workerstack/infra/local", () => {
  const root = productRoot();

  const stack: LocalStack = {
    origin: "http://example.localhost:8123",
    pid: process.pid,
    startedAt: new Date().toISOString(),
  };

  const file = localStackPath(root);

  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(stack));
  expect(readLocalStack(root)).toStrictEqual(stack);
  expect(subdomainOrigin(new URL(readLocalStack(root).origin), "api")).toBe("http://api.example.localhost:8123");
});

it("finds no stack under a product root with no state file, and names the header the edge sets", () => {
  expect(findLocalStack(productRoot())).toBeUndefined();
  expect(WORKER_HEADER).toBe("x-loc-worker");
});
