function unescapeHtml(text: string): string {
  return text
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
}

/** The form a manifest page posts: its action and its `manifest` field. */
export async function readForm(pageUrl: string): Promise<{ action: string; manifest: string }> {
  const html = await (await fetch(pageUrl)).text();
  const action = /action="([^"]*)"/.exec(html)?.[1] ?? "";
  const manifest = /name="manifest" value="([^"]*)"/.exec(html)?.[1] ?? "";

  return { action: unescapeHtml(action), manifest: unescapeHtml(manifest) };
}

/** Does what the browser does: loads the page, posts its form, then follows GitHub's redirect to the callback. */
export async function followForm(pageUrl: string): Promise<Response> {
  const { action, manifest } = await readForm(pageUrl);
  const posted = await fetch(action, { body: new URLSearchParams({ manifest }), method: "POST", redirect: "manual" });

  return fetch(posted.headers.get("location") ?? "");
}
