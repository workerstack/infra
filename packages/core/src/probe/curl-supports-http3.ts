import { CURL_HTTP3 } from "./probe-patterns.constants.ts";

/** Whether `curl -V` says this curl speaks HTTP/3. */
export function curlSupportsHttp3(versionOutput: string): boolean {
  return CURL_HTTP3.test(versionOutput);
}
