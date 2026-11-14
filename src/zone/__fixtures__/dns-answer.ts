import type { CfDnsRecord } from "../dns-types.ts";
import type { Answer } from "../../shared/__fixtures__/fake-client.ts";

/** Lists `live` records for the DNS list call and acknowledges every write. */
export function dnsAnswer(live: CfDnsRecord[]): Answer {
  return ({ method }) => (method === "GET" ? live : { id: "new_id" });
}
