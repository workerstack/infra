/** The zone's HSTS settings as they are live. */
export type HstsLiveState = {
  enabled: boolean;
  includeSubDomains: boolean;
  maxAge: number;
  nosniff: boolean;
  preload: boolean;
};
