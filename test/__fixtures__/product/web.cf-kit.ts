import { join } from "node:path";

import { createCfKit } from "../../../src/cf-kit/create-cf-kit.ts";
import config from "./infra.config.ts";

export const kit = createCfKit({
  config,
  migrations: { DB: { database: "main", dir: join(import.meta.dirname, "db/migrations"), owner: "web-api" } },
  ratelimitIds: join(import.meta.dirname, "ratelimit-ids.json"),
});
