import { defineWranglerConfig } from "wrangler/experimental-config";

export default defineWranglerConfig({ assetsDirectory: "./assets", minify: true, uploadSourceMaps: true });
