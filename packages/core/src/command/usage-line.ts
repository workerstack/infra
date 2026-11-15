/** The usage line of a command: `usage: infra <name> [name|--all] <flags>`. */
export function usageLine(name: string, usageFlags?: string): string {
  return `usage: infra ${name} [name|--all]${usageFlags === undefined ? "" : ` ${usageFlags}`}`;
}
