import type { Answer } from "../../shared/__fixtures__/fake-client.ts";
import { zoneAnswer } from "./zone-answer.ts";

/** An answer for a whole get: the zone reads of `zoneAnswer`, plus an empty DNS list and an active DNSSEC. */
export function flowAnswer(): Answer {
  const zone = zoneAnswer();

  return (call) => {
    if (call.path.includes("/dns_records")) return [];

    if (call.path.endsWith("/dnssec")) return { status: "active" };

    return zone(call);
  };
}
