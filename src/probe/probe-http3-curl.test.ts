import { expect, it } from "vitest";

import { curlSupportsHttp3 } from "./curl-supports-http3.ts";
import { firstHttpStatusLine } from "./first-http-status-line.ts";
import { probeHttp3Curl } from "./probe-http3-curl.ts";
import { probeUrl } from "./probe-url.ts";
import type { SpawnText } from "./spawn-text.ts";

const TARGET = { host: "api.example.com", port: 443 };

it("detects HTTP3 from curl -V", () => {
  expect(curlSupportsHttp3("Features: alt-svc HTTP2 HTTP3 HTTPS-proxy")).toBe(true);
  expect(curlSupportsHttp3("Libraries: nghttp3")).toBe(true);
  expect(curlSupportsHttp3("Features: alt-svc HTTP2")).toBe(false);
});

it("picks the first HTTP status line from curl -sI", () => {
  expect(firstHttpStatusLine("HTTP/3 404\r\nserver: cloudflare\r\n")).toBe("HTTP/3 404");
  expect(firstHttpStatusLine("not http")).toBeNull();
});

it("builds the probe URL without a default :443 and brackets IPv6", () => {
  expect(probeUrl(TARGET)).toBe("https://api.example.com/");
  expect(probeUrl({ host: "api.example.com", port: 8443 })).toBe("https://api.example.com:8443/");
  expect(probeUrl({ host: "::1", port: 443 })).toBe("https://[::1]/");
});

function withoutHttp3(cmd: string[]): ReturnType<SpawnText> {
  return cmd[1] === "-V"
    ? Promise.resolve({ exitCode: 0, stderr: "", stdout: "Features: HTTP2\n" })
    : Promise.reject(new Error(`unexpected ${cmd.join(" ")}`));
}

function missing(): ReturnType<SpawnText> {
  return Promise.resolve({ exitCode: 127, stderr: "", stdout: "" });
}

function broken(): ReturnType<SpawnText> {
  return Promise.reject(new Error("spawn ENOENT"));
}

function timingOut(cmd: string[]): ReturnType<SpawnText> {
  return Promise.resolve(
    cmd[1] === "-V"
      ? { exitCode: 0, stderr: "", stdout: "HTTP3" }
      : { exitCode: 28, stderr: "timed out\n", stdout: "" },
  );
}

it("skips when curl has no HTTP/3", async () => {
  expect(await probeHttp3Curl(TARGET, withoutHttp3)).toStrictEqual({
    kind: "skipped",
    reason: "curl built without HTTP/3",
  });
});

it("skips when curl is missing or cannot run", async () => {
  expect(await probeHttp3Curl(TARGET, missing)).toStrictEqual({ kind: "skipped", reason: "curl not found" });
  expect(await probeHttp3Curl(TARGET, broken)).toStrictEqual({
    kind: "skipped",
    reason: "curl not runnable (spawn ENOENT)",
  });
});

it("returns the HTTP/3 status line from curl --http3", async () => {
  const commands: string[][] = [];

  function spawnText(cmd: string[]): ReturnType<SpawnText> {
    commands.push(cmd);

    return Promise.resolve({
      exitCode: 0,
      stderr: "",
      stdout: cmd[1] === "-V" ? "Features: HTTP3\n" : "HTTP/3 404\r\n",
    });
  }

  expect(await probeHttp3Curl(TARGET, spawnText)).toStrictEqual({ kind: "ok", statusLine: "HTTP/3 404" });
  expect(commands[1]).toStrictEqual(["curl", "-sI", "--http3", "--max-time", "10", "https://api.example.com/"]);
});

it("reports curl's own error when no status line came", async () => {
  expect(await probeHttp3Curl(TARGET, timingOut)).toStrictEqual({ kind: "error", message: "timed out" });
});
