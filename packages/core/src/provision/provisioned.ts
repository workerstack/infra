import type { ConfigEdit } from "./config-edit.ts";
import type { SecretWrite } from "./secret-write.ts";

/** What provisioning changed: config edits for ids, and secrets to write to the env. */
export type Provisioned = { edits: ConfigEdit[]; secrets: SecretWrite[] };
