/** What `verifyMicrosoftConfig` found. */
export type MicrosoftVerifyResult = {
  oauth: {
    appName: string;
    env: string;
    exists: boolean;
    redirectUris: string[];
    secretCount: number;
    signInAudience: string;
  }[];
};
