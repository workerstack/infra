/** One live Turnstile widget as the verify read it; `env` is the scope it is declared for. */
export type TurnstileVerification = {
  clearanceLevel: string;
  domains: string[];
  env: string;
  mode: string;
  name: string;
  sitekey: string;
};
