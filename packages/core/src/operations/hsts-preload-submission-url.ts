/** The manual submission form's URL, to print when `ssl.hsts.preload` is on but the status is `unknown`. */
export function hstsPreloadSubmissionUrl(domain: string): string {
  return `https://hstspreload.org/?domain=${encodeURIComponent(domain)}`;
}
