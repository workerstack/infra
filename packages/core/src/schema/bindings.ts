import type { Unstable_Config } from "wrangler";

/** Wrangler's own config type, the source the binding value types below derive from. */
type WranglerConfig = Unstable_Config;

/** A Wrangler binding entry without its `binding` name, which the record key supplies. */
type OmitBinding<T> = Omit<T, "binding">;

/** A database binding's options, keyed by the name a Worker reads it as. */
type D1Binding = OmitBinding<WranglerConfig["d1_databases"][number]>;

/** A KV namespace binding's options, keyed by the name a Worker reads it as. */
type KVBinding = OmitBinding<WranglerConfig["kv_namespaces"][number]>;

/** An R2 bucket binding's Wrangler options, keyed by the name a Worker reads it as. */
type R2BindingBase = OmitBinding<WranglerConfig["r2_buckets"][number]>;

/** A queue producer binding's options, keyed by the name a Worker reads it as. */
type QueueProducerBinding = OmitBinding<NonNullable<WranglerConfig["queues"]["producers"]>[number]>;

/** An Analytics Engine dataset binding's options, keyed by the name a Worker reads it as. */
type AnalyticsEngineBinding = OmitBinding<WranglerConfig["analytics_engine_datasets"][number]>;

/**
 * Wrangler binding entry for an AI Search (AutoRAG) instance. Maps the worker
 * binding name to the provisioned instance name in the CF account.
 */
export type AiSearchBinding = {
  /** Worker env variable name (e.g. `"AI_SEARCH"`). */
  binding: string;
  /** CF AI Search instance name (must match a provisioned instance). */
  instance_name: string;
};

/**
 * Provisioning config for one CF AI Search instance. Keyed by instance name
 * in `EnvBindings.ai_search_instances`. infra reconciles these against the
 * CF account on `provision` — creates missing, patches changed, leaves extras.
 */
export type AiSearchInstanceConfig = {
  /** Embedding model used for vectorisation. Default `@cf/baai/bge-base-en-v1.5`. */
  embeddingModel: string;
  /** Optional generation model for `chatCompletions` queries. */
  generationModel?: string;
  /** Enable hybrid (vector + BM25) search. Improves recall on keyword-heavy queries. */
  hybridSearch?: boolean;
  /**
   * Trigger the initial crawl/index immediately after provisioning.
   * Default true — skip only if you want to start the crawl manually.
   */
  indexOnCreate?: boolean;
  /** Must match the `instance_name` in the corresponding `AiSearchBinding`. */
  instanceName: string;
  /** Token overlap between adjacent chunks. Reduces context loss at boundaries. */
  chunkOverlap?: number;
  /** Max tokens per chunk fed to the embedding model. */
  chunkSize?: number;
  /**
   * Data source. `web-crawler` indexes a public sitemap URL; `r2` indexes objects
   * in an R2 bucket (bucket name as source).
   */
  dataSource: {
    /** Public sitemap URL (web-crawler) or R2 bucket name (r2). */
    source: string;
    /** Where the instance reads from: a crawled sitemap or an R2 bucket. */
    type: "r2" | "web-crawler";
  };
  /** Max results returned per query. */
  maxNumResults?: number;
  /** Minimum cosine similarity threshold for a result to be included. */
  matchThreshold?: number;
  /** Enable cross-encoder reranking of initial retrieval results. */
  reranking?: boolean;
  /** Custom reranking model. Omit to use CF default. */
  rerankingModel?: string;
};

/**
 * R2 CORS rule — applied to the bucket via CF v4 API. Each rule permits one combination
 * of origins + methods; add multiple entries for read-vs-write or public-vs-internal splits.
 */
export type R2CorsRule = {
  /** Conditions that must all match for the rule to apply. */
  allowed: {
    /**
     * Request headers the browser is allowed to send in preflight.
     * e.g. `["Content-Type", "Authorization"]`.
     */
    headers?: string[];
    /** HTTP methods permitted on the bucket from `origins`. */
    methods: Array<"DELETE" | "GET" | "HEAD" | "POST" | "PUT">;
    /**
     * Allowed request origins. Use exact origins (`https://example.com`), not wildcards,
     * unless the bucket is genuinely public.
     */
    origins: string[];
  };
  /** Response headers the browser is allowed to read from the R2 response. */
  exposeHeaders?: string[];
  /** Seconds the browser may cache the preflight. Long TTL reduces OPTIONS overhead. */
  maxAgeSeconds?: number;
};

/**
 * R2 bucket provisioning config — applied via CF v4 API, not wrangler bindings. These
 * fields live alongside the wrangler binding so infra has the full picture per bucket.
 */
export type R2BucketConfig = {
  /** CORS rules evaluated in order. */
  cors?: R2CorsRule[];
  /**
   * Custom domains routed to this bucket (e.g. `cdn.example.com`). CF creates a managed
   * CNAME DNS record for each one — those records are skipped by `setDnsRecords`.
   */
  customDomains?: string[];
  /**
   * Preferred region at bucket creation time. CF PERMANENTLY PINS name→region on first
   * create; deleting and recreating a bucket with the same name ignores a new hint.
   * Only brand-new bucket names honor this. Values:
   * - `apac` Asia-Pacific, `eeur` Eastern EU, `enam` Eastern N. America,
   *   `oc` Oceania, `weur` Western EU, `wnam` Western N. America.
   */
  locationHint?: "apac" | "eeur" | "enam" | "oc" | "weur" | "wnam";
};

/** An R2 bucket binding with its provisioning config. */
type R2Binding = R2BucketConfig & R2BindingBase;

/**
 * Wrangler-compatible binding set for one scope. infra checks that each named resource
 * exists in the Cloudflare account. It does not create databases, KV namespaces or queues:
 * create those first and reference them by id or name here.
 */
export type EnvBindings = {
  /** AI Search (AutoRAG) wrangler bindings — worker env name → instance name. */
  ai_search?: Record<string, AiSearchBinding>;
  /**
   * AI Search instance provisioning definitions — keyed by instance name.
   * infra creates missing instances and patches changed config; never deletes.
   */
  ai_search_instances?: Record<string, AiSearchInstanceConfig>;
  /** Analytics Engine datasets — exist implicitly (auto-created on first write). */
  analytics_engine_datasets?: Record<string, AnalyticsEngineBinding>;
  /** SQL databases by the name a Worker reads them as. */
  d1_databases?: Record<string, D1Binding>;
  /** KV namespaces by the name a Worker reads them as, each with its namespace id. */
  kv_namespaces?: Record<string, KVBinding>;
  /** Queue producers (consumers are declared per-worker in its cloudflare.config.ts). */
  queues?: Record<string, QueueProducerBinding>;
  /** R2 buckets + per-bucket provisioning (CORS, custom domains, location). */
  r2_buckets?: Record<string, R2Binding>;
};
