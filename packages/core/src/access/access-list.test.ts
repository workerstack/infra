import { describe, expect, it } from "vitest";

import { fakeClient } from "../shared/__fixtures__/fake-client.ts";
import { accessList } from "./access-list.ts";

describe("accessList", () => {
  it("returns an array result as it is", async () => {
    const { calls, client } = fakeClient(() => [{ id: "a" }]);

    expect(await accessList(client, "/accounts/acc/access/apps")).toStrictEqual([{ id: "a" }]);
    expect(calls[0]).toMatchObject({ method: "GET", path: "/accounts/acc/access/apps" });
  });

  it("returns the items of a `{ result }` object", async () => {
    const { client } = fakeClient(() => ({ result: [{ id: "b" }] }));

    expect(await accessList(client, "/x")).toStrictEqual([{ id: "b" }]);
  });
});
