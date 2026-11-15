/** The bundler options of a Worker package's `wrangler.config.ts` that `infra gen` maps to Wrangler keys. */
export type BundlerSettings = {
  assetsDirectory?: string | undefined;
  minify?: boolean | undefined;
  uploadSourceMaps?: boolean | undefined;
};
