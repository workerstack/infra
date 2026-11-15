import type { CfClient } from "../api/client.ts";
import { ACCESS_ZERO_TRUST_MESSAGE } from "./access-zero-trust-message.constants.ts";
import type { CfAccessOrganization } from "./cf-access-types.ts";

function organizationPath(accountId: string): string {
  return `/accounts/${accountId}/access/organizations`;
}

/** Find or verify the CF Access organization (team domain). Throws if Zero Trust not enabled. */
export async function findOrCreateAccessOrganization(
  client: CfClient,
  accountId: string,
): Promise<CfAccessOrganization> {
  try {
    const result = await client.request<CfAccessOrganization | null>("GET", organizationPath(accountId));

    if (result === null) throw new Error(ACCESS_ZERO_TRUST_MESSAGE);

    return result;
  } catch (error) {
    if (error instanceof Error && error.message === ACCESS_ZERO_TRUST_MESSAGE) throw error;

    throw new Error(ACCESS_ZERO_TRUST_MESSAGE, { cause: error });
  }
}

/** Read the CF Access organization. Returns undefined if Zero Trust not enabled or on any CF error. */
export async function getAccessOrganization(
  client: CfClient,
  accountId: string,
): Promise<CfAccessOrganization | undefined> {
  try {
    const result = await client.request<CfAccessOrganization | null>("GET", organizationPath(accountId));

    return result ?? undefined;
  } catch {
    return undefined;
  }
}
