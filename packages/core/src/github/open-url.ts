import { spawn } from "node:child_process";

function opener(url: string): [string, ...string[]] {
  if (process.platform === "darwin") return ["open", url];

  if (process.platform === "win32") return ["cmd", "/c", "start", "", url];

  return ["xdg-open", url];
}

/** Opens `url` in the default browser and does not wait; a missing opener is ignored, the URL is logged. */
export function openUrl(url: string): void {
  const [command, ...args] = opener(url);

  spawn(command, args, { detached: true, stdio: "ignore" })
    .on("error", () => {
      // a missing opener leaves the logged URL to open by hand
    })
    .unref();
}
