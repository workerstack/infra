import * as z from "zod";

/**
 * Cloud Connector rule — routes matching requests to an S3-compatible bucket
 * (R2, S3, GCS, Azure) instead of origin. Evaluated BEFORE worker routes: a
 * matching CC rule means no worker runs for that path. Full-replace PUT —
 * array order IS evaluation order; first match wins.
 *
 * Pair with `disabledWorkerRoutes` ONLY when a catch-all worker route would
 * otherwise shadow the CC path.
 */
export function cloudConnectorRuleSchema(): z.ZodType<CloudConnectorRule, CloudConnectorRuleInput> {
  return z.object({
    /** Shown in CF dashboard and infra verify output. */
    description: z.string(),
    /** Soft-disable without removing from config. */
    enabled: z.boolean().default(true),
    /** Wirefilter match expression, e.g. `starts_with(http.request.uri.path, "/cdn/p/")`. */
    expression: z.string(),
    /**
     * Target bucket hostname. R2 REQUIRES a custom domain bound to the bucket
     * (e.g. `cdn.example.com`) — internal `{bucket}.{account-id}.r2.cloudflarestorage.com`
     * is rejected by CF ("forbidden to use the Origin Host (R2) override").
     * S3: `{bucket}.s3.{region}.amazonaws.com`. CF forwards the request path
     * as-is to this host — use a transform rule for path munging before CC.
     */
    host: z.string(),
    /** Cloud provider — determines how CF signs/routes the origin request. */
    provider: z.enum(["aws_s3", "cloudflare_r2", "gcp_storage", "azure_storage"]).default("cloudflare_r2"),
  });
}

/**
 * URL-rewrite rule on the `http_request_transform` phase. Runs BEFORE worker
 * dispatch AND Cloud Connector — `expression` sees the ORIGINAL path, every
 * downstream op sees the rewritten one.
 */
function transformRuleSchema(): z.ZodType<TransformRule, TransformRuleInput> {
  return z.object({
    /** Shown in CF dashboard and infra verify output. */
    description: z.string(),
    /** Soft-disable without removing. */
    enabled: z.boolean().default(true),
    /** Wirefilter match expression. */
    expression: z.string(),
    /**
     * Wirefilter expression producing the rewritten path, e.g.
     * `concat("/cdn/p", http.request.uri.path)`. Query string is preserved.
     */
    pathExpression: z.string(),
  });
}

export function transformConfigSchema(): z.ZodType<TransformConfig, TransformConfigInput> {
  return z.object({
    /** URL rewrite rules evaluated in order; first match wins. */
    urlRewrites: z.array(transformRuleSchema()).default([]),
  });
}

/**
 * Cloud Connector rule — routes matching requests to an S3-compatible bucket
 * (R2, S3, GCS, Azure) instead of origin. Evaluated BEFORE worker routes: a
 * matching CC rule means no worker runs for that path. Full-replace PUT —
 * array order IS evaluation order; first match wins.
 *
 * Pair with `disabledWorkerRoutes` ONLY when a catch-all worker route would
 * otherwise shadow the CC path.
 */
export type CloudConnectorRuleInput = {
  /** Shown in CF dashboard and infra verify output. */
  description: string;
  /** Soft-disable without removing from config. */
  enabled?: boolean | undefined;
  /** Wirefilter match expression, e.g. `starts_with(http.request.uri.path, "/cdn/p/")`. */
  expression: string;
  /**
   * Target bucket hostname. R2 REQUIRES a custom domain bound to the bucket
   * (e.g. `cdn.example.com`) — internal `{bucket}.{account-id}.r2.cloudflarestorage.com`
   * is rejected by CF ("forbidden to use the Origin Host (R2) override").
   * S3: `{bucket}.s3.{region}.amazonaws.com`. CF forwards the request path
   * as-is to this host — use a transform rule for path munging before CC.
   */
  host: string;
  /** Cloud provider — determines how CF signs/routes the origin request. */
  provider?: "aws_s3" | "cloudflare_r2" | "gcp_storage" | "azure_storage" | undefined;
};

/**
 * Cloud Connector rule — routes matching requests to an S3-compatible bucket
 * (R2, S3, GCS, Azure) instead of origin. Evaluated BEFORE worker routes: a
 * matching CC rule means no worker runs for that path. Full-replace PUT —
 * array order IS evaluation order; first match wins.
 *
 * Pair with `disabledWorkerRoutes` ONLY when a catch-all worker route would
 * otherwise shadow the CC path.
 */
export type CloudConnectorRule = {
  /** Shown in CF dashboard and infra verify output. */
  description: string;
  /** Soft-disable without removing from config. */
  enabled: boolean;
  /** Wirefilter match expression, e.g. `starts_with(http.request.uri.path, "/cdn/p/")`. */
  expression: string;
  /**
   * Target bucket hostname. R2 REQUIRES a custom domain bound to the bucket
   * (e.g. `cdn.example.com`) — internal `{bucket}.{account-id}.r2.cloudflarestorage.com`
   * is rejected by CF ("forbidden to use the Origin Host (R2) override").
   * S3: `{bucket}.s3.{region}.amazonaws.com`. CF forwards the request path
   * as-is to this host — use a transform rule for path munging before CC.
   */
  host: string;
  /** Cloud provider — determines how CF signs/routes the origin request. */
  provider: "aws_s3" | "cloudflare_r2" | "gcp_storage" | "azure_storage";
};

/**
 * URL-rewrite rule on the `http_request_transform` phase. Runs BEFORE worker
 * dispatch AND Cloud Connector — `expression` sees the ORIGINAL path, every
 * downstream op sees the rewritten one.
 */
export type TransformRuleInput = {
  /** Shown in CF dashboard and infra verify output. */
  description: string;
  /** Soft-disable without removing. */
  enabled?: boolean | undefined;
  /** Wirefilter match expression. */
  expression: string;
  /**
   * Wirefilter expression producing the rewritten path, e.g.
   * `concat("/cdn/p", http.request.uri.path)`. Query string is preserved.
   */
  pathExpression: string;
};

/**
 * URL-rewrite rule on the `http_request_transform` phase. Runs BEFORE worker
 * dispatch AND Cloud Connector — `expression` sees the ORIGINAL path, every
 * downstream op sees the rewritten one.
 */
export type TransformRule = {
  /** Shown in CF dashboard and infra verify output. */
  description: string;
  /** Soft-disable without removing. */
  enabled: boolean;
  /** Wirefilter match expression. */
  expression: string;
  /**
   * Wirefilter expression producing the rewritten path, e.g.
   * `concat("/cdn/p", http.request.uri.path)`. Query string is preserved.
   */
  pathExpression: string;
};

export type TransformConfigInput = {
  /** URL rewrite rules evaluated in order; first match wins. */
  urlRewrites?: TransformRuleInput[] | undefined;
};

export type TransformConfig = {
  /** URL rewrite rules evaluated in order; first match wins. */
  urlRewrites: TransformRule[];
};
