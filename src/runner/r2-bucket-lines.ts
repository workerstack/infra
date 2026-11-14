import type { R2BucketVerification } from "./r2-bucket-verification.ts";

function corsLines(bucket: R2BucketVerification): string[] {
  if (bucket.cors.length === 0) return ["        CORS: (none)"];

  const lines = [`        CORS (${bucket.cors.length} rule${bucket.cors.length > 1 ? "s" : ""}):`];

  for (const rule of bucket.cors) {
    lines.push(`          Origins: ${rule.allowed.origins.join(", ")}`);
    lines.push(`          Methods: ${rule.allowed.methods.join(", ")}`);

    if (rule.allowed.headers !== undefined && rule.allowed.headers.length > 0)
      lines.push(`          Headers: ${rule.allowed.headers.join(", ")}`);

    if (rule.maxAgeSeconds !== undefined) lines.push(`          MaxAge: ${rule.maxAgeSeconds}s`);
  }

  return lines;
}

/** One bucket's report lines: its heading, `locationLine`, the CORS rules and the custom domains. */
export function r2BucketLines(bucket: R2BucketVerification, locationLine: string): string[] {
  const domains = bucket.customDomains.map(
    (domain) =>
      `        Domain: ${domain.domain} (enabled=${domain.enabled}, ownership=${domain.ownership}, ssl=${domain.ssl})`,
  );

  return [`      ${bucket.binding} (${bucket.bucketName}):`, locationLine, ...corsLines(bucket), ...domains];
}
