/** Where the manifest form posts: the user's app settings, or the org's when `org` is set. */
export function manifestFormUrl(input: { org?: string | undefined; state: string; webBase: string }): string {
  const owner = input.org === undefined ? "" : `/organizations/${encodeURIComponent(input.org)}`;

  return `${input.webBase}${owner}/settings/apps/new?state=${encodeURIComponent(input.state)}`;
}
