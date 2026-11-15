import { describe, expect, it } from "vitest";

import { hstspreloadFailure } from "./hsts-preload-failure.ts";

describe("hstspreloadFailure", () => {
  it("names the check and the status of the response", () => {
    const error = hstspreloadFailure("status", new Response("", { status: 503, statusText: "Unavailable" }));

    expect(error.message).toBe("hstspreload.org status check failed: 503 Unavailable");
  });
});
