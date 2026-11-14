import { describe, expect, it } from "vitest";

import { runInOrder } from "./run-in-order.ts";

describe("runInOrder", () => {
  it("finishes each item before it starts the next", async () => {
    const events: string[] = [];

    await runInOrder(["a", "b", "c"], async (item) => {
      events.push(`start ${item}`);
      await Promise.resolve();
      events.push(`end ${item}`);
    });

    expect(events).toStrictEqual(["start a", "end a", "start b", "end b", "start c", "end c"]);
  });

  it("does nothing for an empty list", async () => {
    await runInOrder([], () => Promise.reject(new Error("must not run")));

    expect(true).toBe(true);
  });
});
