import { expect, it } from "vitest";

import { fakeProbeIo } from "./__fixtures__/fake-probe-io.ts";
import { resolveProbeTarget } from "./resolve-probe-target.ts";

it("uses the host in the args", async () => {
  expect(await resolveProbeTarget(["api.example.com"], fakeProbeIo().io)).toStrictEqual({
    kind: "target",
    target: { host: "api.example.com", port: 443 },
  });
});

it("prompts `Host: ` on a terminal when no host is given", async () => {
  const prompts: string[] = [];

  const { io } = fakeProbeIo({
    isTTY: true,
    question: (prompt) => {
      prompts.push(prompt);

      return Promise.resolve("  https://api.example.com/  ");
    },
  });

  expect(await resolveProbeTarget([], io)).toStrictEqual({
    kind: "target",
    target: { host: "api.example.com", port: 443 },
  });
  expect(prompts).toStrictEqual(["Host: "]);
});

it("rejects an empty prompt answer", async () => {
  const { io } = fakeProbeIo({ isTTY: true, question: () => Promise.resolve("   ") });

  expect(await resolveProbeTarget([], io)).toStrictEqual({ kind: "error", message: "Host is required" });
});

it("is a usage error with no host and no terminal", async () => {
  expect(await resolveProbeTarget([], fakeProbeIo().io)).toStrictEqual({ kind: "usage" });
});
