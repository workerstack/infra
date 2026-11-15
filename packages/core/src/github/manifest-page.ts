function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

/** The page that posts the manifest to GitHub as soon as it loads; the button is there without scripts. */
export function manifestPage(input: { action: string; manifest: string }): string {
  return [
    '<!doctype html><html><head><meta charset="utf-8"><title>Create the GitHub App</title></head><body>',
    `<form id="manifest" method="post" action="${escapeHtml(input.action)}">`,
    `<input type="hidden" name="manifest" value="${escapeHtml(input.manifest)}">`,
    "<button>Create the GitHub App</button></form>",
    '<script>document.getElementById("manifest").submit()</script>',
    "</body></html>",
  ].join("\n");
}
