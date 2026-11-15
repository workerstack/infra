import { expect, test } from "vitest";

import { fakeDeployIo } from "./__fixtures__/fake-deploy-io.ts";
import { fakeTarget } from "./__fixtures__/fake-target.ts";
import { deploy } from "./deploy.ts";

const REDIRECTS = ["web locale", "web www"];

test("a prod Worker the zone lists writes the redirect rules before cf deploys", async () => {
  const printedAtDeploy: string[] = [];

  const { io, out } = fakeDeployIo({
    onSpawn: () => {
      printedAtDeploy.push(...out);

      return 0;
    },
    redirects: REDIRECTS,
  });

  await deploy({ prune: false, scope: "prod", targets: [fakeTarget(["api"])] }, io);

  expect(printedAtDeploy).toStrictEqual(["apps/web: redirect rules web locale, web www"]);
});

test.each([
  ["a dev deploy", "dev", ["api"]],
  ["a Worker the zone does not list", "prod", ["other"]],
  ["a zone that lists no Worker", "prod", []],
] as const)("%s writes no redirect rules", async (_name, scope, locale) => {
  const { io, out } = fakeDeployIo({ redirects: REDIRECTS });

  await deploy({ prune: false, scope, targets: [fakeTarget([...locale])] }, io);

  expect(out).toStrictEqual([]);
});
