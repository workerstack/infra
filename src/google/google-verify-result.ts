/** What `verifyGoogleConfig` found. */
export type GoogleVerifyResult = {
  oauth: { authBaseUrl: string; clientIdValid: boolean; env: string; redirectOrigins: string[] }[];
  searchConsole?: { sitemaps: { lastSubmitted: string; path: string }[]; siteVerified: boolean };
};
