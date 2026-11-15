/** A literal of strings and nested objects, as `infra gen` writes one into a `.ts` file. */
type TsObject = { readonly [key: string]: string | TsObject };

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

function keyOf(key: string): string {
  return IDENTIFIER.test(key) ? key : JSON.stringify(key);
}

/** An object as a TypeScript literal: each key sorted and on its own line, so `fmt` keeps it as written. */
export function renderTsValue(value: TsObject, indent = ""): string {
  const inner = `${indent}  `;

  const lines = Object.entries(value)
    .toSorted(([a], [b]) => a.localeCompare(b))
    .map(([key, item]) => {
      const text = item instanceof Object ? renderTsValue(item, inner) : JSON.stringify(item);

      return `${inner}${keyOf(key)}: ${text},`;
    });

  return `{\n${lines.join("\n")}\n${indent}}`;
}
