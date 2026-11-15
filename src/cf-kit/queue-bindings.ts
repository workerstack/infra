import { bindings, triggers } from "@cloudflare/config";

import type { InfraScope } from "../schema/infra.ts";
import type { CfKit } from "./cf-kit.ts";
import { each } from "./each.ts";
import type { KitContext } from "./kit-context.ts";
import { lookupBinding } from "./lookup-binding.ts";

type Queues = Pick<CfKit, "queue" | "queueConsumers">;

function queueName(input: { binding: string; context: KitContext; scope: InfraScope }): string {
  const { binding, context, scope } = input;
  const { queue } = lookupBinding({ config: context.config, kind: "queues", name: binding, scope });

  if (queue === undefined || queue === "")
    throw new Error(`infra ${scope} queues binding ${binding} has no queue name`);

  return queue;
}

/** Queue producers and consumers, named by the queue's binding in the scope's infra. */
export function queueBindings(context: KitContext): Queues {
  return {
    queue: (scope, ...names) =>
      each(names, (name) => bindings.queue({ name: queueName({ binding: name, context, scope }) })),
    queueConsumers: (scope, consumers) =>
      consumers.map(({ deadLetterQueue, queue, ...options }) =>
        triggers.queue({
          ...options,
          ...(deadLetterQueue !== undefined && {
            deadLetterQueue: queueName({ binding: deadLetterQueue, context, scope }),
          }),
          name: queueName({ binding: queue, context, scope }),
        }),
      ),
  };
}
