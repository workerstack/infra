/** What the fake GitHub saw and answers with. */
export type FakeGithub = {
  base: string;
  close: () => Promise<void>;
  conversions: string[];
  forms: { manifest: Record<string, unknown>; path: string }[];
};

/** The conversion a fake GitHub answers for `code1`. */
export const CONVERSION = {
  client_id: "Iv1.abc123",
  client_secret: "gh-client-secret-value-1234",
  id: 42,
  pem: "-----BEGIN RSA PRIVATE KEY-----",
  slug: "example-app",
  webhook_secret: "hook",
};

/** A local fake of github.com and api.github.com: the manifest form redirects with `code1`, which converts. */
export function fakeGithub(): FakeGithub {
  const forms: FakeGithub["forms"] = [];
  const conversions: string[] = [];

  const server = Bun.serve({
    fetch: async (request) => {
      const url = new URL(request.url);

      if (request.method === "POST" && url.pathname.endsWith("/settings/apps/new")) {
        const form = await request.formData();
        const manifest = JSON.parse(String(form.get("manifest"))) as Record<string, unknown>;
        const state = url.searchParams.get("state") ?? "";

        forms.push({ manifest, path: `${url.pathname}${url.search}` });

        return Response.redirect(`${String(manifest.redirect_url)}?code=code1&state=${state}`, 302);
      }

      if (request.method === "POST" && url.pathname.startsWith("/app-manifests/")) {
        conversions.push(`${url.pathname} ${request.headers.get("accept") ?? ""}`);

        if (url.pathname !== "/app-manifests/code1/conversions") return new Response("{}", { status: 404 });

        return Response.json(CONVERSION, { status: 201 });
      }

      return new Response("not found", { status: 404 });
    },
    hostname: "127.0.0.1",
    port: 0,
  });

  return {
    base: `http://127.0.0.1:${String(server.port)}`,
    close: () => server.stop(true),
    conversions,
    forms,
  };
}
