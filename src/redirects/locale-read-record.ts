import fs from "node:fs";
import path from "node:path";

import type { RedirectRule } from "../operations/redirect-rule.ts";
import { localeRecordSchema } from "./locale-record-schema.ts";
import { LOCALE_RECORD } from "./locale-record.constants.ts";

type AppRule = Omit<RedirectRule, "enabled">;

/** The rules of the app at `dir` under `productRoot`, as its framework build wrote them. */
export function localeReadRecord(productRoot: string, dir: string): AppRule[] {
  const file = path.join(dir, LOCALE_RECORD);
  const full = path.join(productRoot, file);

  if (!fs.existsSync(full)) throw new Error(`${file} is missing: build the app and commit it`);

  const parsed = localeRecordSchema().safeParse(JSON.parse(fs.readFileSync(full, "utf8")));

  if (!parsed.success) throw new Error(`${file} is not the framework's record: ${parsed.error.issues[0]?.message}`);

  return parsed.data.rules;
}
