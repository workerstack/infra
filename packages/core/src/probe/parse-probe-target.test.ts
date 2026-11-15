import { expect, it } from "vitest";

import { parseProbeTarget } from "./parse-probe-target.ts";

it("requires a non-empty host", () => {
  expect(() => parseProbeTarget("")).toThrow("Host is required");
  expect(() => parseProbeTarget("   ")).toThrow("Host is required");
  expect(() => parseProbeTarget("///")).toThrow("Host is required");
});

it("parses host, host:port and pasted https URLs", () => {
  expect(parseProbeTarget("api.example.com")).toStrictEqual({ host: "api.example.com", port: 443 });
  expect(parseProbeTarget("api.example.com:8443")).toStrictEqual({ host: "api.example.com", port: 8443 });
  expect(parseProbeTarget("https://api.example.com/")).toStrictEqual({ host: "api.example.com", port: 443 });
  expect(parseProbeTarget("https://api.example.com:8443/v1")).toStrictEqual({ host: "api.example.com", port: 8443 });
});

it("still uses 443 for http URLs, since this is a TLS probe", () => {
  expect(parseProbeTarget("http://api.example.com/path")).toStrictEqual({ host: "api.example.com", port: 443 });
});

it("parses bracketed IPv6", () => {
  expect(parseProbeTarget("[::1]")).toStrictEqual({ host: "::1", port: 443 });
  expect(parseProbeTarget("[::1]:8443")).toStrictEqual({ host: "::1", port: 8443 });
});

it("rejects junk, another scheme and a port out of range", () => {
  expect(() => parseProbeTarget("not a host")).toThrow("Invalid host");
  expect(() => parseProbeTarget("ftp://api.example.com")).toThrow("Unsupported protocol");
  expect(() => parseProbeTarget("api.example.com:99999")).toThrow("Invalid port");
  expect(() => parseProbeTarget("api.example.com:0")).toThrow("Invalid port");
});
