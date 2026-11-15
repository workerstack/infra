import { expect, it } from "vitest";

import { formatTable } from "./format-table.ts";

it("aligns the columns under the heading and puts a note under its row", () => {
  const rows = [{ cells: ["DB", "web-prod", "applied"] }, { cells: ["CACHE", "web-cache", "skipped"], note: "why" }];

  expect(formatTable("apps/web", ["BINDING", "DATABASE", "STATUS"], rows)).toBe(
    [
      "apps/web",
      "  BINDING  DATABASE   STATUS",
      "  DB       web-prod   applied",
      "  CACHE    web-cache  skipped",
      "    ↳ why",
    ].join("\n"),
  );
});
