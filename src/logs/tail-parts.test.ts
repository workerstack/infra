import { expect, it } from "vitest";

import { jsonObjectSplitter } from "./json-object-splitter.ts";
import { parseTailArgs } from "./parse-tail-args.ts";
import { summarizeTailEvent } from "./summarize-tail-event.ts";

it("defaults to prod for 15 minutes and forwards the wrangler filters", () => {
  const parsed = parseTailArgs(["acme", "--status", "error", "--search", "boom", "--status", "canceled"]);

  expect(parsed).toStrictEqual({
    args: {
      minutes: 15,
      passThrough: ["--status", "error", "--status", "canceled", "--search", "boom"],
      scope: "prod",
      selectors: ["acme"],
    },
    kind: "run",
  });
});

it("rejects local, unknown flags and a missing selector; --minutes 0 means until killed", () => {
  expect(parseTailArgs(["acme", "--scope", "local"]).kind).toBe("error");
  expect(parseTailArgs(["acme", "--format", "pretty"]).kind).toBe("error");
  expect(parseTailArgs([]).kind).toBe("error");
  expect(parseTailArgs(["acme", "--minutes", "0"])).toMatchObject({ args: { minutes: 0 }, kind: "run" });
});

it("splits pretty-printed objects across arbitrary chunk boundaries", () => {
  const a = JSON.stringify({ logs: [{ message: ['brace } in "string"'] }], n: 1 }, null, 4);
  const b = JSON.stringify({ n: 2, s: 'escaped \\" quote {' }, null, 4);
  const text = `${a}\n${b}\n`;
  const split = jsonObjectSplitter();
  const out: string[] = [];

  for (let at = 0; at < text.length; at += 7) out.push(...split(text.slice(at, at + 7)));

  expect(out.map((raw) => (JSON.parse(raw) /* each raw object here has an n */ as { n: number }).n)).toStrictEqual([
    1, 2,
  ]);
});

it("ignores text between objects", () => {
  expect(jsonObjectSplitter()('banner\n{"n":1}\n')).toStrictEqual(['{"n":1}']);
});

it("prints the invocation headline plus exceptions and warn or error logs", () => {
  const lines = summarizeTailEvent({
    event: { request: { method: "POST", url: "https://api.acme.test/v1/x" }, response: { status: 500 } },
    eventTimestamp: Date.UTC(2026, 0, 1, 12, 0, 0, 5),
    exceptions: [{ message: "boom", name: "TypeError" }],
    logs: [
      { level: "log", message: ['{"level":30,"msg":"--> POST /v1/x"}'] },
      { level: "log", message: ['{"level":50,"msg":"db failed"}'] },
      { level: "warn", message: ["slow"] },
    ],
    outcome: "exception",
    scriptName: "acme-gateway-prod",
    wallTime: 42,
  });

  expect(lines).toStrictEqual([
    "12:00:00.005 acme-gateway-prod exception 500 POST https://api.acme.test/v1/x wall=42ms",
    "  ! TypeError: boom",
    '  error {"level":50,"msg":"db failed"}',
    "  warn slow",
  ]);
});

it("labels cron and queue invocations", () => {
  expect(summarizeTailEvent({ event: { cron: "*/5 * * * *" }, outcome: "ok" })[0]).toContain("cron */5 * * * *");
  expect(summarizeTailEvent({ event: { batchSize: 3, queue: "acme-q" }, outcome: "ok" })[0]).toContain(
    "queue acme-q x3",
  );
});
