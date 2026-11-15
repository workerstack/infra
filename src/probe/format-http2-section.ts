import type { Http2Setting } from "./http2-setting.ts";
import { SETTING_MAX_CONCURRENT_STREAMS } from "./http2.constants.ts";
import type { ProbeResult } from "./probe-result.ts";

function settingLine(setting: Http2Setting): string {
  const mark = setting.id === SETTING_MAX_CONCURRENT_STREAMS ? "  <<<" : "";

  return `SETTINGS_${setting.name} = ${setting.value}${mark}`;
}

/** The HTTP/2 SETTINGS lines of the report; the stream limit is marked. */
export function formatHttp2Section({ http2 }: ProbeResult): string[] {
  const heading = "=== 3. HTTP/2 SETTINGS ===";

  if (http2.kind === "error") return [heading, `error: ${http2.message}`];

  return [
    heading,
    ...(http2.settings.length === 0 ? ["(server sent empty SETTINGS)"] : http2.settings.map(settingLine)),
  ];
}
