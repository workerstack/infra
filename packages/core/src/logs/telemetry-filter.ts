/** One telemetry filter: a key, an operation and a typed value. */
export type TelemetryFilter = {
  key: string;
  operation: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "includes";
  type: "number" | "string";
  value: number | string;
};
