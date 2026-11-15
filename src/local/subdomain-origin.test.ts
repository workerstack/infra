import { expect, it } from "vitest";

import { subdomainOrigin } from "./subdomain-origin.ts";

it("puts the label before the host and keeps the port", () => {
  expect(subdomainOrigin(new URL("http://example.localhost"), "api")).toBe("http://api.example.localhost");
  expect(subdomainOrigin(new URL("http://example.localhost:8123/app"), "api")).toBe(
    "http://api.example.localhost:8123",
  );
});
