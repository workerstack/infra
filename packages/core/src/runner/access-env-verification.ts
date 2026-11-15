import type { AccessApplicationVerification } from "./access-application-verification.ts";

/** One scope's Access state: organization, Google IdP, service token and applications. */
export type AccessEnvVerification = {
  applications: AccessApplicationVerification[];
  env: string;
  googleIdp: { clientIdMatches: boolean; exists: boolean; id?: string };
  organization: { authDomain?: string; exists: boolean };
  serviceToken: {
    clientIdMatches: boolean;
    configHasStub: boolean;
    exists: boolean;
    id?: string;
    name: string;
  };
};
