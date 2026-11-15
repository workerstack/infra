import { curlSupportsHttp3 } from "./curl-supports-http3.ts";
import { firstHttpStatusLine } from "./first-http-status-line.ts";
import type { Http3Result } from "./http3-result.ts";
import { CURL_HTTP3_UNKNOWN } from "./probe-patterns.constants.ts";
import type { ProbeTarget } from "./probe-target.ts";
import { probeUrl } from "./probe-url.ts";
import { CURL_MAX_TIME_SEC } from "./probe.constants.ts";
import type { SpawnText } from "./spawn-text.ts";

const NO_HTTP3: Http3Result = { kind: "skipped", reason: "curl built without HTTP/3" };

async function curlVersion(spawnText: SpawnText): Promise<Http3Result | undefined> {
  try {
    const version = await spawnText(["curl", "-V"]);

    if (version.exitCode !== 0) return { kind: "skipped", reason: "curl not found" };

    return curlSupportsHttp3(`${version.stdout}\n${version.stderr}`) ? undefined : NO_HTTP3;
  } catch (error) {
    return { kind: "skipped", reason: `curl not runnable (${error instanceof Error ? error.message : String(error)})` };
  }
}

/** HEAD over HTTP/3 through the system `curl`: its status line, or why it was skipped or failed. */
export async function probeHttp3Curl(target: ProbeTarget, spawnText: SpawnText): Promise<Http3Result> {
  const skipped = await curlVersion(spawnText);

  if (skipped !== undefined) return skipped;

  const result = await spawnText(["curl", "-sI", "--http3", "--max-time", String(CURL_MAX_TIME_SEC), probeUrl(target)]);

  if (CURL_HTTP3_UNKNOWN.test(`${result.stdout}\n${result.stderr}`)) return NO_HTTP3;

  const statusLine = firstHttpStatusLine(result.stdout);

  if (statusLine !== null) return { kind: "ok", statusLine };

  return {
    kind: "error",
    message:
      [result.stderr.trim(), result.stdout.trim()].find((text) => text !== "") ??
      `curl --http3 exit ${result.exitCode}`,
  };
}
