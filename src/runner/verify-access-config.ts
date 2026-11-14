import type { CfClient } from "../api/client.ts";
import type { CloudflareAccessEnv } from "../schema/cloudflare-env.ts";
import type { InfraScope } from "../schema/infra.ts";
import { runInOrder } from "../shared/run-in-order.ts";
import { scopedEntries } from "../shared/scoped-entries.ts";
import type { AccessApplicationVerification } from "./access-application-verification.ts";
import type { AccessEnvVerification } from "./access-env-verification.ts";
import { verifyAccessApplication } from "./verify-access-application.ts";
import { verifyAccessScope } from "./verify-access-scope.ts";

async function verifyApplications(
  client: CfClient,
  accountId: string,
  target: { config: CloudflareAccessEnv; googleIdPId: string | undefined },
): Promise<AccessApplicationVerification[]> {
  const applications: AccessApplicationVerification[] = [];

  await runInOrder(Object.values(target.config.applications ?? {}), async (config) => {
    applications.push(await verifyAccessApplication(client, accountId, { config, googleIdPId: target.googleIdPId }));
  });

  return applications;
}

/** Verifies each scope's Access organization, Google IdP, service token and applications against the config. */
export async function verifyAccessConfig(
  client: CfClient,
  accountId: string,
  access: Partial<Record<InfraScope, CloudflareAccessEnv>>,
): Promise<AccessEnvVerification[]> {
  const results: AccessEnvVerification[] = [];

  await runInOrder(scopedEntries(access), async ([scope, config]) => {
    const { googleIdPId, googleIdp, organization, serviceToken } = await verifyAccessScope(client, accountId, {
      config,
      scope,
    });

    const applications = await verifyApplications(client, accountId, { config, googleIdPId });

    results.push({ applications, env: scope, googleIdp, organization, serviceToken });
  });

  return results;
}
