import * as z from "zod";

type LocaleRecord = {
  rules: {
    description: string;
    expression: string;
    preserveQueryString: boolean;
    statusCode: number;
    targetExpression: string;
  }[];
};

// The rules of an app's record; its `edge` is the framework's own (its probe reads it).
export function localeRecordSchema(): z.ZodType<LocaleRecord> {
  return z.object({
    rules: z.array(
      z.object({
        description: z.string(),
        expression: z.string(),
        preserveQueryString: z.boolean(),
        statusCode: z.number(),
        targetExpression: z.string(),
      }),
    ),
  });
}
