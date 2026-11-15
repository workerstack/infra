import { expect, it } from "vitest";

import { fakeProbeIo } from "./__fixtures__/fake-probe-io.ts";
import { runProbeCommand } from "./run-probe-command.ts";
import type { SpawnText } from "./spawn-text.ts";

function noSpawn(): ReturnType<SpawnText> {
  return Promise.reject(new Error("spawn should not run"));
}

function noCurl(): ReturnType<SpawnText> {
  return Promise.resolve({ exitCode: 127, stderr: "", stdout: "" });
}

it("prints the usage lines and exits 0 for --help", async () => {
  const { io, lines } = fakeProbeIo();

  expect(await runProbeCommand(["--help"], { io, spawnText: noSpawn })).toBe(0);
  expect(lines[0]).toBe("usage: infra probe [host]");
});

it("prints the usage line and exits 2 with no host and no terminal", async () => {
  const { errors, io } = fakeProbeIo();

  expect(await runProbeCommand([], { io, spawnText: noSpawn })).toBe(2);
  expect(errors).toStrictEqual(["usage: infra probe [host]"]);
});

it("prints the usage line and exits 2 for an unknown flag", async () => {
  const { errors, io } = fakeProbeIo();

  expect(await runProbeCommand(["--port=1"], { io, spawnText: noSpawn })).toBe(2);
  expect(errors).toStrictEqual(["usage: infra probe [host]"]);
});

it("exits 1 when the prompt answer is empty", async () => {
  const { errors, io } = fakeProbeIo({ isTTY: true, question: () => Promise.resolve("") });

  expect(await runProbeCommand([], { io, spawnText: noSpawn })).toBe(1);
  expect(errors).toStrictEqual(["Host is required"]);
});

it("exits 1 for a host that is not valid", async () => {
  const { errors, io } = fakeProbeIo();

  expect(await runProbeCommand(["not a host"], { io, spawnText: noSpawn })).toBe(1);
  expect(errors).toStrictEqual(["Invalid host not a host"]);
});

it("exits 1 with the connect error when the host cannot be reached", async () => {
  const { errors, io } = fakeProbeIo();

  expect(await runProbeCommand(["localhost:1"], { io, spawnText: noCurl })).toBe(1);
  expect(errors[0]).toContain("ECONNREFUSED");
});
