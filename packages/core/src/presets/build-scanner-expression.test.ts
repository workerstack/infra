import { describe, expect, it } from "vitest";

import { buildScannerExpression } from "./build-scanner-expression.ts";
import { SCANNER_PATHS } from "./scanner-paths.ts";

describe("buildScannerExpression", () => {
  it("joins one contains clause per path with or", () => {
    expect(buildScannerExpression(["/a", "/b"])).toBe(
      '(http.request.uri.path contains "/a") or (http.request.uri.path contains "/b")',
    );
  });

  it("holds every scanner path, each starting with a slash", () => {
    const expression = buildScannerExpression(SCANNER_PATHS);

    expect(SCANNER_PATHS.every((path) => path.startsWith("/") && expression.includes(`"${path}"`))).toBe(true);
  });
});
