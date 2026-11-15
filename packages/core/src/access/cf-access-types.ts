export type CfAccessOrganization = {
  auth_domain: string;
  name: string;
};

export type CfAccessIdP = {
  config: { client_id: string; client_secret?: string };
  id: string;
  name: string;
  type: string;
};

export type CfAccessServiceTokenResult = {
  client_id: string;
  client_secret?: string | undefined;
  id: string;
  name: string;
};

export type CfAccessApp = {
  allowed_idps: string[];
  aud: string;
  id: string;
  name: string;
  self_hosted_domains: string[];
  session_duration: string;
};

export type CfAccessPolicy = {
  decision?: string;
  id: string;
  name?: string;
};
