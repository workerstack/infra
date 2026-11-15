import { expect, it } from "vitest";

import { declaredSecrets } from "./declared-secrets.ts";

it("lists the required secrets a converted config declares", () => {
  expect(declaredSecrets({ name: "web-api-prod", secrets: { required: ["API_KEY", "TOKEN"] } })).toStrictEqual([
    "API_KEY",
    "TOKEN",
  ]);
});

it("lists none when the config declares no secrets or a malformed list", () => {
  expect(declaredSecrets({ name: "web-api-prod" })).toStrictEqual([]);
  expect(declaredSecrets({ secrets: { required: "API_KEY" } })).toStrictEqual([]);
});
