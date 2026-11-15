import type { R2BucketVerification } from "./r2-bucket-verification.ts";

/** The R2 buckets verified for one env name. */
export type R2EnvVerification = {
  buckets: R2BucketVerification[];
  env: string;
};
