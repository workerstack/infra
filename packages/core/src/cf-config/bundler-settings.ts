/** The bundler options of a Worker package's `wrangler.config.ts` that `infra gen` maps to Wrangler keys. */
export type BundlerSettings = {
  /** The directory of static assets to serve, relative to the package. */
  assetsDirectory?: string | undefined;
  /** Whether to minify the Worker bundle. */
  minify?: boolean | undefined;
  /** Whether to upload source maps so stack traces show the original code. */
  uploadSourceMaps?: boolean | undefined;
};
