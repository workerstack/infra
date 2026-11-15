// Each run of characters other than a-z and 0-9, and a dash at either end; used only with replaceAll.
const OTHER_CHARS = /[^a-z0-9]+/g;
const EDGE_DASH = /^-|-$/g;

/** The app's slug on GitHub: its name lowercased, each run of other characters one dash, trimmed. */
export function githubAppSlug(appName: string): string {
  return appName.toLowerCase().replaceAll(OTHER_CHARS, "-").replaceAll(EDGE_DASH, "");
}
