import { describe, expect, it } from "vitest";

import { hstsPreloadSubmissionUrl } from "./hsts-preload-submission-url.ts";

describe("hstsPreloadSubmissionUrl", () => {
  it("returns the submission form URL for the exact domain", () => {
    expect(hstsPreloadSubmissionUrl("example.com")).toBe("https://hstspreload.org/?domain=example.com");
  });

  it("URL-encodes unusual characters in the domain", () => {
    expect(hstsPreloadSubmissionUrl("a&b.test")).toBe("https://hstspreload.org/?domain=a%26b.test");
  });
});
