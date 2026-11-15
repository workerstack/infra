import { describe, expect, it } from "vitest";

import { recordingClient, rulesOf, zoneHolding } from "./__fixtures__/recording-client.ts";
import type { Recorded } from "./__fixtures__/recording-client.ts";
import { redirectRuleBody } from "./redirect-rule-body.ts";
import type { RedirectRule } from "./redirect-rule.ts";
import { setRedirectRules } from "./set-redirect-rules.ts";

const PHASE = "http_request_dynamic_redirect";
const PUT_PATH = `/zones/zid/rulesets/rs_${PHASE}`;

function redirect(description: string, more: Partial<RedirectRule> = {}): RedirectRule {
  return {
    description,
    enabled: true,
    expression: `http.request.cookies["locale"][0] eq "${description}"`,
    preserveQueryString: true,
    statusCode: 302,
    targetExpression: `concat("/${description}", http.request.uri.path)`,
    ...more,
  };
}

// A zone whose redirect phase holds `held`, or has none; the writes it received are returned.
async function writes(held: object[] | undefined, rules: RedirectRule[]): Promise<Recorded[]> {
  const { calls, client } = recordingClient(
    zoneHolding(held === undefined ? {} : { [PHASE]: held, http_request_transform: [] }),
  );

  await setRedirectRules(client, rules);

  return calls.filter((call) => call.method !== "GET");
}

describe("setRedirectRules rewriting a phase", () => {
  it("replaces the phase with exactly the given rules, in order, a stale one gone", async () => {
    const sent = await writes([redirectRuleBody(redirect("fr"))], [redirect("www"), redirect("hr")]);

    expect(sent).toStrictEqual([
      {
        body: { rules: [redirectRuleBody(redirect("www")), redirectRuleBody(redirect("hr"))] },
        method: "PUT",
        path: PUT_PATH,
      },
    ]);
  });

  it("writes a disabled rule disabled", async () => {
    const [call] = await writes([], [redirect("old", { enabled: false })]);

    expect(rulesOf(call)).toStrictEqual([{ ...redirectRuleBody(redirect("old")), enabled: false }]);
  });

  it("sends the same body on a second run", async () => {
    const rules = [redirect("a"), redirect("b")];
    const first = await writes([], rules);

    expect(await writes(rulesOf(first[0]), rules)).toStrictEqual(first);
  });
});

describe("setRedirectRules with no phase or no rules", () => {
  it("clears an existing phase on no rules", async () => {
    expect(await writes([redirectRuleBody(redirect("hand-made"))], [])).toStrictEqual([
      { body: { rules: [] }, method: "PUT", path: PUT_PATH },
    ]);
  });

  it("writes nothing when there is no phase and no rules", async () => {
    expect(await writes(undefined, [])).toStrictEqual([]);
  });

  it("creates the phase when the zone has none", async () => {
    expect(await writes(undefined, [redirect("a")])).toStrictEqual([
      {
        body: { kind: "zone", name: "zone", phase: PHASE, rules: [redirectRuleBody(redirect("a"))] },
        method: "POST",
        path: "/zones/zid/rulesets",
      },
    ]);
  });
});
