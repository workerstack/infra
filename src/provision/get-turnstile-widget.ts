import type { CfClient } from "../api/client.ts";
import type { CfTurnstileWidget } from "./find-or-create-turnstile.ts";

/** A widget by site key, secret included in the result; the caller never puts it in a config edit. */
export async function getTurnstileWidget(
  client: CfClient,
  accountId: string,
  sitekey: string,
): Promise<CfTurnstileWidget | undefined> {
  try {
    return await client.request<CfTurnstileWidget>("GET", `/accounts/${accountId}/challenges/widgets/${sitekey}`);
  } catch {
    return undefined;
  }
}
