import { describe, expect, expectTypeOf, it } from "vitest";

import { INFRA_SEALED_KEYS, INFRA_VAR_KEYS } from "./infra-keys.constants.ts";
import type { InfraSealedKey, InfraVarKey } from "./infra-keys.constants.ts";

describe("INFRA_VAR_KEYS and INFRA_SEALED_KEYS", () => {
  it("split the infra keys into plain vars and sealed credentials", () => {
    expect([...INFRA_VAR_KEYS]).toStrictEqual([
      "CF_ACCOUNT_ID",
      "CF_ZONE_ID",
      "R2_ACCESS_KEY_ID",
      "R2_BUCKET_NAME",
      "R2_ENDPOINT",
      "TURNSTILE_SITE_KEY",
    ]);
    expect([...INFRA_SEALED_KEYS]).toStrictEqual(["CF_API_TOKEN", "R2_SECRET_ACCESS_KEY", "TURNSTILE_SECRET_KEY"]);
  });

  it("are each sorted and free of duplicates, so the lists stay diffable", () => {
    expect([...INFRA_VAR_KEYS]).toStrictEqual([...new Set(INFRA_VAR_KEYS)].toSorted());
    expect([...INFRA_SEALED_KEYS]).toStrictEqual([...new Set(INFRA_SEALED_KEYS)].toSorted());
  });

  it("are disjoint: a sealed key never lands in a var", () => {
    const sealed: readonly string[] = INFRA_SEALED_KEYS;

    expect(INFRA_VAR_KEYS.filter((key) => sealed.includes(key))).toStrictEqual([]);
  });
});

describe("infra key shapes", () => {
  it("use UPPER_SNAKE_CASE, the shape wrangler vars and secrets take", () => {
    const keys: readonly string[] = [...INFRA_VAR_KEYS, ...INFRA_SEALED_KEYS];

    expect(keys.filter((key) => !/^[A-Z][A-Z0-9_]*$/.test(key))).toStrictEqual([]);
  });

  it("narrow to literal unions, not string", () => {
    expectTypeOf<InfraVarKey>().toEqualTypeOf<(typeof INFRA_VAR_KEYS)[number]>();
    expectTypeOf<"CF_API_TOKEN">().not.toExtend<InfraVarKey>();
    expectTypeOf<"CF_API_TOKEN">().toExtend<InfraSealedKey>();
    expectTypeOf<string>().not.toExtend<InfraVarKey>();
  });
});
