import type { RedirectRule } from "../operations/redirect-rule.ts";
import { LOCALE_EXPRESSION_MAX } from "./locale-expression-max.constants.ts";
import { localeHeld } from "./locale-held.ts";
import { localeReadRecord } from "./locale-read-record.ts";
import { localeWorkerHost } from "./locale-worker-host.ts";
import type { LocaleWorker } from "./locale-worker.ts";

type LocaleInput = {
  dirs: readonly string[];
  productRoot: string;
  workers: readonly LocaleWorker[];
};

function appRules(dir: string, input: LocaleInput): RedirectRule[] {
  const app = input.workers.find((worker) => worker.dir === dir);

  if (app === undefined) throw new Error(`${dir}: no cloudflare.config.ts deploys this dir`);

  const held = localeHeld(localeWorkerHost(app), app, input.workers);

  return localeReadRecord(input.productRoot, dir).map((rule) => {
    const expression = `${held} and (${rule.expression})`;

    if (expression.length > LOCALE_EXPRESSION_MAX) {
      const size = `${expression.length} characters; Cloudflare takes ${LOCALE_EXPRESSION_MAX}`;

      throw new Error(`${dir}: rule "${rule.description}" is ${size}`);
    }

    return { ...rule, enabled: true, expression };
  });
}

/** Each listed app's rules, held to its host and off the paths the other Workers claim there. */
export function localeRules(input: LocaleInput): RedirectRule[] {
  return input.dirs.flatMap((dir) => appRules(dir, input));
}
