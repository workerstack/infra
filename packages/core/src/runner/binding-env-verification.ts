import type { BindingVerification } from "./binding-verification.ts";

/** The bindings verified for one env name. */
export type BindingEnvVerification = {
  bindings: BindingVerification[];
  env: string;
};
