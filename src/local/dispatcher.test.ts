import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";
import * as z from "zod";

import dispatcher from "./dispatcher.worker.ts";
import { WORKER_HEADER } from "./local.constants.ts";
import { writeDispatcher } from "./write-dispatcher.ts";

const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { force: true, recursive: true });
});

const ENV = {
  TARGETS: JSON.stringify({ "web-api-local": "WORKER_0" }),
  WORKER_0: { fetch: (request: Request) => Promise.resolve(new Response(`api ${new URL(request.url).pathname}`)) },
};

function asking(worker?: string): Request {
  return new Request("http://example.localhost/api/x", {
    headers: worker === undefined ? {} : { [WORKER_HEADER]: worker },
  });
}

describe("the dispatcher Worker", () => {
  it("hands a request to the Worker its header names", async () => {
    const reply = await dispatcher.fetch(asking("web-api-local"), ENV);

    await expect(reply.text()).resolves.toBe("api /api/x");
  });

  it("answers 404 listing its Workers with no header or an unknown name", async () => {
    const none = await dispatcher.fetch(asking(), ENV);
    const unknown = await dispatcher.fetch(asking("site-local"), ENV);

    expect(none.status).toBe(404);
    await expect(none.text()).resolves.toBe(`no ${WORKER_HEADER} header; its Workers: web-api-local\n`);
    await expect(unknown.text()).resolves.toBe(
      `${WORKER_HEADER}: site-local is not in the stack; its Workers: web-api-local\n`,
    );
  });
});

describe("writeDispatcher", () => {
  it("binds each Worker by name and runs the dispatcher module beside it", () => {
    const root = mkdtempSync(join(tmpdir(), "loc-dispatcher-"));

    roots.push(root);

    const config = z
      .object({ main: z.string() })
      .loose()
      .parse(JSON.parse(readFileSync(writeDispatcher(root, ["a-local", "b-local"]), "utf8")));

    expect(config).toMatchObject({
      services: [
        { binding: "WORKER_0", service: "a-local" },
        { binding: "WORKER_1", service: "b-local" },
      ],
      vars: { TARGETS: JSON.stringify({ "a-local": "WORKER_0", "b-local": "WORKER_1" }) },
    });
    expect(existsSync(config.main)).toBe(true);
  });
});
