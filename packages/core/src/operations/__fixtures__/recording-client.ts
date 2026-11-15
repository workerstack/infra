import type { CfClient } from "../../api/client.ts";
import { fakeClient } from "../../shared/__fixtures__/fake-client.ts";
import { parseZoneConfig } from "../../schema/zone.ts";
import type { ZoneConfigInput } from "../../schema/zone.ts";

export type Recorded = { body?: object | undefined; method: string; path: string };

export type RecordingClient = { calls: Recorded[]; client: CfClient };

/** The result a fake zone gives a request; a throw is how it fails one. */
export type Answer = (method: string, path: string) => object | string | null;

/** A `CfClient` for zone `zid` that records every request and answers with `answer`. */
export function recordingClient(answer: Answer = () => ({})): RecordingClient {
  const { calls, client } = fakeClient((call) => answer(call.method, call.path) as object);

  return { calls, client };
}

type Held = Record<string, object[]>;

/** A zone holding `rulesets` by phase: its list is `rs_<phase>` ids, and each detail returns its rules. */
export function zoneHolding(rulesets: Held): Answer {
  return (method, path) => {
    if (method !== "GET") return {};

    if (path === "/zones/zid/rulesets") {
      return Object.keys(rulesets).map((phase) => ({ id: `rs_${phase}`, phase }));
    }

    const phase = path.replace("/zones/zid/rulesets/rs_", "");

    return { id: `rs_${phase}`, rules: rulesets[phase] ?? [] };
  };
}

/** A zone config for `zid` with defaults for anything `input` leaves out. */
export function zoneConfig(input: Partial<ZoneConfigInput> = {}): ReturnType<typeof parseZoneConfig> {
  return parseZoneConfig({ domain: "example.com", zoneId: "zid", ...input });
}

/** The `rules` a recorded ruleset write sent. */
export function rulesOf<T extends object = object>(call: Recorded | undefined): T[] {
  const body = call?.body as /* a ruleset write */ { rules: T[] } | undefined;

  return body?.rules ?? [];
}
