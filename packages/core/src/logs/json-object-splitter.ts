type SplitState = { buffer: string; depth: number; escaped: boolean; inString: boolean };

function readStringChar(state: SplitState, ch: string): void {
  if (state.escaped) state.escaped = false;
  else if (ch === "\\") state.escaped = true;
  else if (ch === '"') state.inString = false;
}

// Reads one character of an object; true when it closed the top-level object.
function advance(state: SplitState, ch: string): boolean {
  if (state.inString) {
    readStringChar(state, ch);

    return false;
  }

  if (ch === '"') {
    state.inString = true;
  } else if (ch === "{") {
    state.depth += 1;
  } else if (ch === "}") {
    state.depth -= 1;

    return state.depth === 0;
  }

  return false;
}

/**
 * `wrangler tail --format json` writes pretty-printed objects back to back. Feed the returned function raw
 * chunks; the complete top-level objects come out as strings, whatever the chunk boundaries.
 */
export function jsonObjectSplitter(): (chunk: string) => string[] {
  const state: SplitState = { buffer: "", depth: 0, escaped: false, inString: false };

  return (chunk) => {
    const out: string[] = [];

    for (const ch of chunk) {
      if (state.depth === 0 && ch !== "{") continue;

      state.buffer += ch;

      if (advance(state, ch)) {
        out.push(state.buffer);
        state.buffer = "";
      }
    }

    return out;
  };
}
