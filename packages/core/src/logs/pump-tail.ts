import { jsonObjectSplitter } from "./json-object-splitter.ts";
import { parseTailEvent } from "./parse-tail-event.ts";
import { summarizeTailEvent } from "./summarize-tail-event.ts";
import type { TailChild } from "./tail-child.ts";
import type { TailSink } from "./tail-sink.ts";

async function pumpEvents(child: TailChild, sink: TailSink): Promise<void> {
  const split = jsonObjectSplitter();

  for await (const chunk of child.stdout) {
    for (const raw of split(chunk)) {
      const event = parseTailEvent(raw);

      sink.dump(JSON.stringify(event));

      for (const line of summarizeTailEvent(event)) sink.stdout(line);
    }
  }
}

async function pumpErrors(child: TailChild, script: string, sink: TailSink): Promise<void> {
  let text = "";

  for await (const chunk of child.stderr) text += chunk;

  if (text.trim() !== "") sink.stderr(`[${script}] ${text.trim()}`);
}

/** Reads a tail's output until it ends: events to the dump and a summary, stderr as one prefixed line. */
export async function pumpTail(child: TailChild, script: string, sink: TailSink): Promise<number> {
  const [, , code] = await Promise.all([pumpEvents(child, sink), pumpErrors(child, script, sink), child.exited]);

  return code;
}
