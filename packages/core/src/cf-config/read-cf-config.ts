import { pathToFileURL } from "node:url";

import { convertToWranglerConfig, resolveAndParseConfig } from "@cloudflare/config";

import type { InfraScope } from "../schema/infra.ts";
import type { CfConfig } from "./cf-config.ts";
import { jsonObjectSchema } from "./json-object-schema.ts";

type ConfigModule = { default?: Parameters<typeof resolveAndParseConfig>[0] };

/**
 * The Worker a `cloudflare.config.ts` declares for `scope`, parsed by Cloudflare's schema and converted to a
 * Wrangler config. Bun imports the TypeScript itself, so no Node process loads it. A config that throws, has no
 * default export or fails the schema fails naming the file.
 */
export async function readCfConfig(file: string, scope: InfraScope): Promise<CfConfig> {
  try {
    const loaded = await (import(
      pathToFileURL(file).href
    ) /* a cloudflare.config.ts module */ as Promise<ConfigModule>);

    if (loaded.default === undefined) throw new Error("does not have a default export");

    const result = await resolveAndParseConfig(loaded.default, { isPreview: false, mode: scope });

    if (!result.success) {
      const issues = result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);

      throw new Error(`is not a valid Cloudflare config:\n${issues.join("\n")}`);
    }

    if (result.data.worker === undefined) throw new Error("declares no worker");

    const wrangler = jsonObjectSchema().parse(convertToWranglerConfig(result.data));

    return { worker: result.data.worker, wrangler };
  } catch (error) {
    throw new Error(`${file}: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
  }
}
