import { join } from "node:path";

import { createCfKit } from "@workerstack/infra";

import { config } from "./config.ts";

export const kit = /* @__PURE__ */ createCfKit({
  config,
  ratelimitIds: /* @__PURE__ */ join(import.meta.dirname, "ratelimit-ids.json"),
});
