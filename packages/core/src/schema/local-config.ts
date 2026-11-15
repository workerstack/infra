/**
 * The product's local stack: the host that stands in for its zone's apex (`example.localhost` for
 * `example.com`, one name under `.localhost`, which resolves to loopback), and the Worker vars that
 * name the local origin, computed from the origin the stack's edge bound (`http://example.localhost`,
 * or with the port it fell back to); no `vars`, no URL vars. No port is configured anywhere.
 */
export type LocalConfig = {
  /**
   * The Vite packages `infra loc` runs in their own `vite dev`, as dirs relative to the product root (`web`). A
   * package on Cloudflare's Vite plugin that is not listed is left out of the stack.
   */
  apps?: readonly string[];
  host: string;
  vars?: (origin: URL) => Record<string, string>;
};
