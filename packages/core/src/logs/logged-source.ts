/** The error our loggers put on `source.err`. */
type LoggedError = {
  cause?: { message?: string | undefined } | undefined;
  errorKey?: string | undefined;
  message?: string | undefined;
  name?: string | undefined;
  stack?: string | undefined;
};

/** A logged source that is an object: our logger's pino-numeric level and thrown error. */
export type LoggedSource = { err?: LoggedError | undefined; level?: number | undefined };
