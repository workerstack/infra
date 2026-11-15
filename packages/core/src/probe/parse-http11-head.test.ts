import { expect, it } from "vitest";

import { parseHttp11Head } from "./parse-http11-head.ts";

it("reads the status line, alt-svc and headers", () => {
  const raw = [
    "HTTP/1.1 404 Not Found",
    "Date: Mon, 24 Aug 2026 12:26:30 GMT",
    "Content-Type: application/json",
    'alt-svc: h3=":443"; ma=86400',
    "",
    "{}",
  ].join("\r\n");

  const parsed = parseHttp11Head(raw);

  expect(parsed.statusLine).toBe("HTTP/1.1 404 Not Found");
  expect(parsed.altSvc).toBe('h3=":443"; ma=86400');
  expect(parsed.headers["content-type"]).toBe("application/json");
});

it("has no alt-svc when the server sent none", () => {
  expect(parseHttp11Head("HTTP/1.1 200 OK\r\n\r\n").altSvc).toBeNull();
});

it("rejects a reply that is not HTTP", () => {
  expect(() => parseHttp11Head("garbage")).toThrow("No HTTP status line");
});
