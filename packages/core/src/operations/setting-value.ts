import type { SecurityHeaderValue } from "./security-header-value.ts";

/** A zone setting's value: a scalar string, or the structured `security_header` object. */
export type SettingValue = SecurityHeaderValue | string;
