/** The parts of an Entra app registration the runners read. */
export type AppRegistration = {
  appId: string;
  displayName: string;
  id: string;
  passwordCredentials?: { displayName: string; endDateTime: string; keyId: string; secretText?: string }[];
  signInAudience: string;
  web?: { redirectUris: string[] };
};
