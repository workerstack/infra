import { ALLOCATE_RATELIMITS } from "./cf-kit.constants.ts";
import type { CfKit } from "./cf-kit.ts";

type Allocation = { allocating: () => boolean; toggle: Pick<CfKit, typeof ALLOCATE_RATELIMITS> };

/**
 * One kit's allocation switch: off, and on only while a run of its `ALLOCATE_RATELIMITS` method is pending. Gen
 * holds the kit object the Worker configs import (the default export of the product's `infra.config.ts`, one module
 * instance), so the switch reaches every limiter those configs build.
 */
export function ratelimitAllocation(): Allocation {
  let isOn = false;

  return {
    allocating: () => isOn,
    toggle: {
      async [ALLOCATE_RATELIMITS](run) {
        const wasOn = isOn;

        isOn = true;

        try {
          return await run();
        } finally {
          isOn = wasOn;
        }
      },
    },
  };
}
