import type { CfClient } from "../api/client.ts";

export type CfR2CustomDomainDetail = {
  domain: string;
  enabled: boolean;
  status: { ownership: string; ssl: string };
};

/** A bucket's custom domain detail, or undefined when the request fails. */
export async function getR2CustomDomain(
  client: CfClient,
  accountId: string,
  target: { bucketName: string; domain: string },
): Promise<CfR2CustomDomainDetail | undefined> {
  const { bucketName, domain } = target;

  try {
    return await client.request<CfR2CustomDomainDetail>(
      "GET",
      `/accounts/${accountId}/r2/buckets/${bucketName}/domains/custom/${domain}`,
    );
  } catch {
    return undefined;
  }
}
