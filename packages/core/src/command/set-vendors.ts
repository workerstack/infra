import { indexNowHost } from "../index-now/index-now-host.ts";
import type { Product } from "../products.ts";
import type { Provisioned } from "../provision/provisioned.ts";
import { runInOrder } from "../shared/run-in-order.ts";
import { yandexHostUrl } from "../yandex/yandex-host-url.ts";
import type { SetDeps } from "./set-deps.ts";

// One vendor's apply: its heading and a run that collects any edits and secrets in `out`.
type VendorStep = { name: string; run: (out: Provisioned) => Promise<void> };

function collect(out: Provisioned, result: Provisioned): void {
  out.edits.push(...result.edits);
  out.secrets.push(...result.secrets);
}

function oauthSteps(deps: SetDeps, product: Product): VendorStep[] {
  const { apple, env, github, google, microsoft } = product.config;
  const { log } = deps;
  const steps: VendorStep[] = [];

  if (google !== undefined) steps.push({ name: "Google", run: () => deps.applyGoogle({ config: google, env, log }) });

  if (apple !== undefined) steps.push({ name: "Apple", run: () => deps.applyApple({ config: apple, env, log }) });

  if (microsoft !== undefined) {
    steps.push({
      name: "Microsoft",
      run: async (out) => {
        collect(out, await deps.applyMicrosoft({ config: microsoft, env, log }));
      },
    });
  }

  if (github !== undefined) {
    steps.push({
      name: "GitHub",
      run: async (out) => {
        collect(out, await deps.applyGithub({ config: github, env, log }));
      },
    });
  }

  return steps;
}

function sitemapSteps(deps: SetDeps, product: Product): VendorStep[] {
  const { config } = product;
  const { env, indexNow, yandex } = config;
  const { log } = deps;
  const steps: VendorStep[] = [];

  if (indexNow !== undefined) {
    steps.push({
      name: "IndexNow",
      run: () => deps.applyIndexNow({ config: indexNow, host: indexNowHost(config), log }),
    });
  }

  if (yandex !== undefined) {
    steps.push({
      name: "Yandex",
      run: () => deps.applyYandex({ config: yandex, env, hostUrl: yandexHostUrl(config), log }),
    });
  }

  return steps;
}

/**
 * Applies the Google, Apple, Microsoft, GitHub, IndexNow and Yandex config, in that order; the edits and secrets of
 * Microsoft and GitHub collect in `out`.
 */
export async function setVendors(deps: SetDeps, product: Product, out: Provisioned): Promise<void> {
  await runInOrder([...oauthSteps(deps, product), ...sitemapSteps(deps, product)], async (step) => {
    deps.log(`\n ${step.name}: ${product.name}`);
    await step.run(out);
    deps.log(` Done: ${step.name}`);
  });
}
