import { existsSync, readFileSync } from "node:fs";

import type { PlannedFile } from "./planned-file.ts";

/** Fails naming each planned file with a header whose file on disk lacks it: hand-written, so not gen's to touch. */
export function refuseHandWritten(planned: readonly PlannedFile[], shown: (file: string) => string): void {
  const refused = planned.filter(
    ({ file, header }) => header !== undefined && existsSync(file) && !readFileSync(file, "utf8").startsWith(header),
  );

  if (refused.length > 0) {
    throw new Error(
      refused.map(({ file }) => `${shown(file)} is hand-written; delete it so infra gen writes it`).join("\n"),
    );
  }
}
