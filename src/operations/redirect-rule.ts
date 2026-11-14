/** One edge redirect rule, as the zone config states it or infra builds it. */
export type RedirectRule = {
  description: string;
  enabled: boolean;
  expression: string;
  preserveQueryString: boolean;
  statusCode: number;
  targetExpression: string;
};
