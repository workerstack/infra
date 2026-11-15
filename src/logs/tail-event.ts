/** One `wrangler tail --format json` event: the fields a summary reads; the rest is kept in the dump. */
export type TailEvent = {
  event?:
    | {
        batchSize?: number | undefined;
        cron?: string | undefined;
        queue?: string | undefined;
        request?: { method?: string | undefined; url?: string | undefined } | undefined;
        response?: { status?: number | undefined } | undefined;
      }
    | undefined;
  eventTimestamp?: number | undefined;
  exceptions?: { message?: string | undefined; name?: string | undefined }[] | undefined;
  logs?: { level?: string | undefined; message?: unknown[] | undefined }[] | undefined;
  outcome?: string | undefined;
  scriptName?: string | undefined;
  wallTime?: number | undefined;
};
