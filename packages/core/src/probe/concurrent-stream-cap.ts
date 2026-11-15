import type { Http2Setting } from "./http2-setting.ts";
import { SETTING_MAX_CONCURRENT_STREAMS } from "./http2.constants.ts";
import { CHROME_MAX_CONCURRENT_STREAMS } from "./probe.constants.ts";

/** What the server's stream limit means for a browser: the lower of it and Chrome's own cap. */
export function concurrentStreamCap(settings: readonly Http2Setting[]): string {
  const setting = settings.find((entry) => entry.id === SETTING_MAX_CONCURRENT_STREAMS);

  if (setting === undefined) {
    return (
      "server omitted SETTINGS_MAX_CONCURRENT_STREAMS (RFC default unlimited; " +
      `browsers still assume ~100 before SETTINGS). Chrome cap ${CHROME_MAX_CONCURRENT_STREAMS}.`
    );
  }

  const cap = Math.min(setting.value, CHROME_MAX_CONCURRENT_STREAMS);

  return `Browser cap on this host = min(${setting.value}, Chrome ${CHROME_MAX_CONCURRENT_STREAMS}) = ${cap}.`;
}
