/** One Access application as the verify read it; `drift` names the fields that differ from the config. */
export type AccessApplicationVerification = {
  allowedIdps: string[];
  drift: string[];
  exists: boolean;
  id?: string;
  name: string;
  policies: Array<{ decision: string; id: string; name: string }>;
  selfHostedDomains: string[];
  sessionDuration: string;
};
