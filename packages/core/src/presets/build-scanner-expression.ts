/** One CF expression that matches a request whose path contains any of `paths`. */
export function buildScannerExpression(paths: readonly string[]): string {
  return paths.map((path) => `(http.request.uri.path contains "${path}")`).join(" or ");
}
