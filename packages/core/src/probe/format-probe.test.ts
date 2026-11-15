import { expect, it } from "vitest";

import { probeResult, settings } from "./__fixtures__/probe-result.ts";
import { formatProbe } from "./format-probe.ts";

it("marks MAX_CONCURRENT_STREAMS and reports the browser cap", () => {
  const text = formatProbe(probeResult());

  expect(text).toContain("tls=TLSv1.3  alpn=h2");
  expect(text).toContain("SETTINGS_MAX_CONCURRENT_STREAMS = 100  <<<");
  expect(text).toContain("SETTINGS_INITIAL_WINDOW_SIZE = 65536");
  expect(text).toContain("min(100, Chrome 256) = 100");
  expect(text).toContain("curl --http3: skipped (curl built without HTTP/3)");
  expect(text).toContain('alt-svc: h3=":443"; ma=86400');
});

it("says so when the server omitted MAX_CONCURRENT_STREAMS", () => {
  const text = formatProbe(probeResult({ http2: { kind: "ok", settings: settings([[4, 65_536]]) } }));

  expect(text).toContain("server omitted SETTINGS_MAX_CONCURRENT_STREAMS");
  expect(text).not.toContain("<<<");
});

it("shows each probe's error and no browser cap when HTTP/2 failed", () => {
  const text = formatProbe(
    probeResult({
      alpnAccepted: null,
      http11: { kind: "error", message: "read timeout after 5000ms" },
      http2: { kind: "error", message: "no server SETTINGS frame" },
      http3: { kind: "error", message: "timed out" },
      tlsVersion: null,
    }),
  );

  expect(text).toContain("tls=unknown  alpn=none");
  expect(text).toContain("error: read timeout after 5000ms");
  expect(text).toContain("error: no server SETTINGS frame");
  expect(text).toContain("curl --http3: error: timed out");
  expect(text).not.toContain("Browser cap");
});

it("shows alt-svc as none, an empty SETTINGS and an HTTP/3 status", () => {
  const text = formatProbe(
    probeResult({
      http11: { altSvc: null, kind: "ok", statusLine: "HTTP/1.1 200 OK" },
      http2: { kind: "ok", settings: [] },
      http3: { kind: "ok", statusLine: "HTTP/3 200" },
    }),
  );

  expect(text).toContain("alt-svc: (none)");
  expect(text).toContain("(server sent empty SETTINGS)");
  expect(text).toContain("curl --http3: HTTP/3 200");
});
