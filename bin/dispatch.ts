import { readdir } from "node:fs/promises";
import { join } from "node:path";

import { USAGE_EXIT } from "../src/usage-exit.constants.ts";
import { ARGV_START, COMMAND_NAME } from "./dispatch.constants.ts";

type Command = { main: (args: readonly string[]) => Promise<number> };

function printToStderr(line: string): void {
  process.stderr.write(`${line}\n`);
}

async function listCommands(cliDir: string): Promise<string[]> {
  const files = await readdir(cliDir);

  return files
    .filter((file) => file.endsWith(".ts") && !file.endsWith(".test.ts"))
    .map((file) => file.slice(0, -".ts".length))
    .filter((name) => COMMAND_NAME.test(name))
    .toSorted();
}

export async function dispatch(
  args: readonly string[],
  cliDir: string,
  print: (line: string) => void = printToStderr,
): Promise<number> {
  const commands = await listCommands(cliDir);
  const [name, ...rest] = args;

  if (name === undefined) {
    print("usage: infra <command> [args]");
    print(`commands: ${commands.join(", ")}`);

    return USAGE_EXIT;
  }

  if (!commands.includes(name)) {
    print(`infra: unknown command "${name}"; commands: ${commands.join(", ")}`);

    return USAGE_EXIT;
  }

  const command: unknown = await import(join(cliDir, `${name}.ts`));

  return (command /* every cli/<name>.ts exports main */ as Command).main(rest);
}

/** The bin's whole job: run the named command from this package's `cli/` and set the exit code. */
export async function main(): Promise<void> {
  process.exitCode = await dispatch(process.argv.slice(ARGV_START), join(import.meta.dirname, "..", "cli"));
}
