import type { HstsLiveState } from "../operations/hsts-live-state.ts";
import type { TransformRule } from "../operations/transform-rule.ts";
import type { CloudConnectorRule } from "../schema/edge-rules.ts";
import type { EmailRoutingVerifyResult } from "../zone/email-addresses.ts";
import type { DriftSplit } from "./drift-split.ts";
import type { ZoneRule } from "./zone-rule.ts";

/** What `verifyZoneConfig` read from the zone: live rules, settings and the drift of declared lists. */
export type ZoneVerifyResult = {
  cache: ZoneRule[];
  cloudConnectors: DriftSplit<CloudConnectorRule>;
  disabledWorkerRoutes: DriftSplit<string>;
  emailRouting: EmailRoutingVerifyResult;
  hsts: HstsLiveState;
  rateLimit: ZoneRule[];
  redirects: ZoneRule[];
  settings: Record<string, string>;
  transforms: DriftSplit<TransformRule>;
  waf: ZoneRule[];
};
