import { expect, it } from "vitest";

import { observabilityDrift } from "./observability-drift.ts";

it("ignores server defaults the config does not set", () => {
  const desired = { enabled: true, traces: { enabled: true, head_sampling_rate: 1 } };

  const live = {
    enabled: true,
    logs: { enabled: true, persist: true },
    traces: { enabled: true, head_sampling_rate: 1, persist: true },
  };

  expect(observabilityDrift(desired, live)).toStrictEqual([]);
});

it("reports each mismatched or missing leaf by path", () => {
  const desired = { enabled: true, traces: { enabled: true, head_sampling_rate: 1 } };
  const live = { enabled: true, traces: { enabled: false } };

  expect(observabilityDrift(desired, live)).toStrictEqual([
    "observability.traces.enabled: live false ≠ true",
    "observability.traces.head_sampling_rate: live null ≠ 1",
  ]);
});
