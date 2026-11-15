import { describe, expect, it } from "vitest";

import { errorMessages, readEnvelope } from "./cf-envelope.ts";

function respond(body: string): Response {
  return new Response(body);
}

describe("readEnvelope", () => {
  it("parses a successful envelope with its result", async () => {
    expect(await readEnvelope(respond('{"errors":[],"result":{"id":"a"},"success":true}'))).toStrictEqual({
      errors: [],
      result: { id: "a" },
      success: true,
    });
  });

  it("defaults the errors to none", async () => {
    expect(await readEnvelope(respond('{"success":true}'))).toStrictEqual({ errors: [], success: true });
  });

  it("throws for a body that is not an envelope", async () => {
    await expect(readEnvelope(respond('{"result":1}'))).rejects.toThrow("success");
  });
});

describe("errorMessages", () => {
  it("joins the messages with a comma", () => {
    const errors = [{ message: "one" }, { message: "two" }];

    expect(errorMessages({ errors, success: false })).toBe("one, two");
  });
});
