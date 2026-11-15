/** The raw option values of `infra logs-tail`: a string or a list of strings per flag. */
type TailValues = {
  header?: string[] | undefined;
  help?: boolean | undefined;
  ip?: string[] | undefined;
  method?: string[] | undefined;
  minutes: string;
  "sampling-rate"?: string[] | undefined;
  scope: string;
  search?: string[] | undefined;
  status?: string[] | undefined;
};

/** What parsing `infra logs-tail`'s arguments gives: the Worker selectors and the flag values. */
export type TailOptions = { positionals: string[]; values: TailValues };
