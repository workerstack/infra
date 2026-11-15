/** What `verifyAppleConfig` found. */
export type AppleVerifyResult = {
  jwksReachable: boolean;
  oauth: {
    env: string;
    keyId: string;
    keyValid: boolean;
    redirectOrigins: string[];
    serviceId: string;
    teamId: string;
  }[];
};
