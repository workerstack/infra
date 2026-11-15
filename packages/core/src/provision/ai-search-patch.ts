import type { AiSearchCreateBody } from "../api/ai-search.ts";
import type { AiSearchInstanceConfig } from "../schema/bindings.ts";

/** The update body for `config`, leaving out what it does not set: the validator rejects an explicit undefined. */
export function aiSearchPatch(config: AiSearchInstanceConfig): Partial<Omit<AiSearchCreateBody, "name">> {
  const patch: Partial<Omit<AiSearchCreateBody, "name">> = {
    data_source: config.dataSource,
    embedding_model: config.embeddingModel,
  };

  if (config.chunkOverlap !== undefined) patch.chunk_overlap = config.chunkOverlap;

  if (config.chunkSize !== undefined) patch.chunk_size = config.chunkSize;

  if (config.generationModel !== undefined) patch.generation_model = config.generationModel;

  if (config.hybridSearch !== undefined) patch.hybrid_search = config.hybridSearch;

  if (config.matchThreshold !== undefined) patch.match_threshold = config.matchThreshold;

  if (config.maxNumResults !== undefined) patch.max_num_results = config.maxNumResults;

  if (config.reranking !== undefined) patch.reranking = config.reranking;

  if (config.rerankingModel !== undefined) patch.reranking_model = config.rerankingModel;

  return patch;
}
