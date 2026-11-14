import { describe, expect, it } from "vitest";

import type { EmailRoutingAction, EmailRoutingConfigInput } from "../schema/email-routing.ts";
import { parseZoneConfig } from "../schema/zone.ts";
import type { ZoneConfig } from "../schema/zone.ts";
import { fakeClient, writes } from "../shared/__fixtures__/fake-client.ts";
import type { Answer } from "../shared/__fixtures__/fake-client.ts";
import { getEmailRoutingState, setEmailRouting, verifyEmailRouting } from "./email-addresses.ts";
import type { CfEmailRule } from "./email-rules.ts";

const RULES_PATH = "/zones/zid/email/routing/rules";
const CATCH_ALL_PATH = `${RULES_PATH}/catch_all`;

const HELLO_BODY: Omit<CfEmailRule, "id"> = {
  actions: [{ type: "worker", value: ["example-prod"] }],
  enabled: true,
  matchers: [{ field: "to", type: "literal", value: "hello@example.com" }],
  name: "hello inbox",
};

const HELLO_RULE = {
  action: { type: "worker" as const, worker: "example-prod" },
  match: { to: "hello@example.com", type: "literal" as const },
  name: "hello inbox",
};

const LIVE_CONTACT: CfEmailRule = {
  actions: [{ type: "forward", value: ["team@example.org"] }],
  enabled: true,
  id: "live-contact",
  matchers: [{ field: "to", type: "literal", value: "contact@example.com" }],
  name: "contact",
};

function liveHello(name: string): CfEmailRule {
  return { ...HELLO_BODY, id: "live-hello", name };
}

function config(emailRouting: EmailRoutingConfigInput): ZoneConfig {
  return parseZoneConfig({ domain: "example.com", emailRouting, zoneId: "zid" });
}

function answer(rules: CfEmailRule[], catchAll?: { actions: EmailRoutingAction[] | object[] }): Answer {
  return ({ method, path }) => {
    if (method !== "GET") return { id: "new" };

    if (path !== CATCH_ALL_PATH) return rules;

    if (catchAll === undefined) throw new Error("no catch-all");

    return catchAll;
  };
}

describe("setEmailRouting creates", () => {
  it("POSTs a missing declared rule and deletes nothing", async () => {
    const { calls, client } = fakeClient(answer([LIVE_CONTACT]));

    await setEmailRouting(client, config({ rules: [HELLO_RULE] }));

    expect(writes(calls)).toStrictEqual([{ body: HELLO_BODY, method: "POST", path: RULES_PATH }]);
  });
});

describe("setEmailRouting updates", () => {
  it("PUTs an existing rule whose name changed", async () => {
    const { calls, client } = fakeClient(answer([liveHello("old name")]));

    await setEmailRouting(client, config({ rules: [HELLO_RULE] }));

    expect(writes(calls)).toStrictEqual([{ body: HELLO_BODY, method: "PUT", path: `${RULES_PATH}/live-hello` }]);
  });

  it("sends nothing for a rule that is already live", async () => {
    const { calls, client } = fakeClient(answer([liveHello("hello inbox")]));

    await setEmailRouting(client, config({ rules: [HELLO_RULE] }));

    expect(writes(calls)).toHaveLength(0);
  });
});

describe("setEmailRouting catch-all", () => {
  it("PUTs the catch-all when declared", async () => {
    const { calls, client } = fakeClient(answer([]));

    await setEmailRouting(client, config({ catchAll: { type: "worker", worker: "example-prod" } }));

    expect(writes(calls)).toStrictEqual([
      {
        body: {
          actions: [{ type: "worker", value: ["example-prod"] }],
          enabled: true,
          matchers: [{ type: "all" }],
          name: "infra catch-all",
        },
        method: "PUT",
        path: CATCH_ALL_PATH,
      },
    ]);
  });

  it("leaves the catch-all alone when not declared", async () => {
    const { calls, client } = fakeClient(answer([]));

    await setEmailRouting(client, config({}));

    expect(writes(calls)).toHaveLength(0);
  });
});

describe("verifyEmailRouting", () => {
  it("reports declared rules missing from live", async () => {
    const { client } = fakeClient(answer([]));

    const result = await verifyEmailRouting(client, config({ rules: [HELLO_RULE] }));

    expect(result).toStrictEqual({ catchAll: null, declared: 1, live: 0, missing: ["hello inbox"] });
  });

  it("reports nothing missing and the live catch-all when all match", async () => {
    const { client } = fakeClient(answer([liveHello("hello inbox")], { actions: [{ type: "drop" }] }));

    const result = await verifyEmailRouting(client, config({ rules: [HELLO_RULE] }));

    expect(result).toStrictEqual({ catchAll: { type: "drop" }, declared: 1, live: 1, missing: [] });
  });
});

describe("getEmailRoutingState", () => {
  it("skips live rules infra cannot model", async () => {
    const odd: CfEmailRule = { actions: [], enabled: true, id: "odd", matchers: [] };
    const { client } = fakeClient(answer([odd, LIVE_CONTACT]));

    const state = await getEmailRoutingState(client);

    expect(state.rules).toStrictEqual([
      { action: { to: "team@example.org", type: "forward" }, match: { to: "contact@example.com", type: "literal" } },
    ]);
  });
});
