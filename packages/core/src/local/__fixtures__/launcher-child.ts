import { stdoutLog } from "../../shared/stdout-log.ts";
import { runStack } from "../run-stack.ts";
import { FIXTURE_HOST, fixtureProduct } from "./launcher-fixture.ts";

// As a script: runs the fixture stack with `runStack`, as `infra loc` would, for a test that kills the launcher.
// Arguments: the product root and the mark.
const [productRoot, mark] = process.argv.slice(2);

if (productRoot === undefined || mark === undefined) throw new Error("usage: launcher-child.ts <root> <mark>");

await runStack(
  { ...fixtureProduct(productRoot, mark), host: FIXTURE_HOST, product: "fx", productRoot },
  new Promise(() => {}),
  stdoutLog,
);
