import type { AiSearchInstanceConfig } from "../schema/bindings.ts";

type Flag = [string, string | number | boolean | undefined];

/** The `wrangler` arguments that create `config`'s instance: the subcommand, the name and each flag that is set. */
export function aiSearchCreateArgs(config: AiSearchInstanceConfig): string[] {
  const flags: Flag[] = [
    ["--type", config.dataSource.type],
    ["--source", config.dataSource.source],
    ["--embedding-model", config.embeddingModel],
    ["--generation-model", config.generationModel],
    ["--chunk-size", config.chunkSize],
    ["--chunk-overlap", config.chunkOverlap],
    ["--hybrid-search", config.hybridSearch],
    ["--reranking", config.reranking],
    ["--reranking-model", config.rerankingModel],
    ["--max-num-results", config.maxNumResults],
    ["--score-threshold", config.matchThreshold],
  ];

  const set = flags.flatMap(([flag, value]) => (value === undefined ? [] : [flag, String(value)]));

  return ["ai-search", "create", config.instanceName, ...set];
}
