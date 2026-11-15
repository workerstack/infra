/** The raw option values of `infra logs-query`. */
type QueryValues = {
  errors?: boolean | undefined;
  filter?: string[] | undefined;
  from?: string | undefined;
  "group-by"?: string | undefined;
  help?: boolean | undefined;
  limit: string;
  minutes: string;
  needle?: string | undefined;
  scope: string;
  to?: string | undefined;
  view: string;
};

/** What parsing `infra logs-query`'s arguments gives: the Worker selectors and the flag values. */
export type QueryOptions = { positionals: string[]; values: QueryValues };
