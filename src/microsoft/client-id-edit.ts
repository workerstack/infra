import type { ConfigEdit } from "../provision/config-edit.ts";
import { escapePattern } from "../provision/escape-pattern.ts";

/** The edit that fills `clientId: "STUB"` in the block after `appName`; ids only. */
export function clientIdEdit(appName: string, clientId: string): ConfigEdit {
  return {
    pattern: new RegExp(`(appName: "${escapePattern(appName)}",[\\s\\S]*?)clientId: "STUB"`),
    replacement: `$1clientId: "${clientId}"`,
  };
}
