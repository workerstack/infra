/** One declared AI Search instance and its live status; `status` is undefined when it does not exist. */
export type AiSearchVerification = {
  embeddingModel: string;
  env: string;
  exists: boolean;
  instanceName: string;
  status: string | undefined;
};
