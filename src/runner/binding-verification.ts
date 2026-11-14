/** One declared binding and whether its resource exists. */
export type BindingVerification = {
  binding: string;
  exists: boolean;
  name: string;
  /** A caveat shown when Cloudflare has no API to verify the resource (such as Analytics Engine datasets). */
  note?: string;
  readReplicas?: string | undefined;
  type: string;
};
