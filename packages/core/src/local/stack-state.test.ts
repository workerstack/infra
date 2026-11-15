import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { LOCAL_STACK_FILE } from "./local-stack-file.constants.ts";
import { findLocalStack, localStackPath, readLocalStack } from "./stack-state.ts";

const STACK = { origin: "http://example.localhost:8123", pid: 4242, startedAt: "2026-11-02T21:00:00.000Z" };

function alive(): boolean {
  return true;
}

function exited(): boolean {
  return false;
}

// A fresh temp product root per test; read it by calling the returned function.
function useRoot(): () => string {
  let root = "";

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "stack-state-"));
  });
  afterEach(() => rmSync(root, { force: true, recursive: true }));

  return () => root;
}

function write(root: string, text: string): string {
  const file = localStackPath(root);

  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, text);

  return file;
}

describe("a running stack", () => {
  const root = useRoot();

  it("lives under the product root's .wrangler", () => {
    expect(localStackPath(root())).toBe(join(root(), LOCAL_STACK_FILE));
  });

  it("reads back", () => {
    write(root(), JSON.stringify(STACK));

    expect(readLocalStack(root(), alive)).toStrictEqual(STACK);
  });

  it("counts its own process as alive by default", () => {
    write(root(), JSON.stringify({ ...STACK, pid: process.pid }));

    expect(readLocalStack(root()).pid).toBe(process.pid);
  });
});

describe("a missing or broken state file", () => {
  const root = useRoot();

  it("fails naming the file and `bun run local` when no stack ran", () => {
    expect(() => readLocalStack(root(), alive)).toThrow(localStackPath(root()));
    expect(() => readLocalStack(root(), alive)).toThrow("bun run local");
  });

  it("fails on a file that is not JSON or not a stack", () => {
    const file = write(root(), "{");

    expect(() => readLocalStack(root(), alive)).toThrow(`${file} is not JSON`);

    write(root(), JSON.stringify({ ...STACK, origin: "example" }));

    expect(() => readLocalStack(root(), alive)).toThrow("bun run local");
  });

  it("fails when the stack it names has exited", () => {
    write(root(), JSON.stringify(STACK));

    expect(() => readLocalStack(root(), exited)).toThrow("pid 4242");
  });
});

describe("findLocalStack", () => {
  const root = useRoot();

  it("is undefined with no file and with an exited launcher", () => {
    expect(findLocalStack(root(), alive)).toBeUndefined();

    write(root(), JSON.stringify(STACK));

    expect(findLocalStack(root(), exited)).toBeUndefined();
    expect(findLocalStack(root(), alive)).toStrictEqual(STACK);
  });
});
