// What `defineConfig` of `@workerstack/database/migrate` takes: one D1 database, wrangler finding it by its
// binding in the generated config of the Worker that owns the migrations.
const OWNER = "../api";

function environment(name: string) {
  return {
    name,
    provider: {
      databaseName: "DB",
      type: "d1",
      wranglerConfig: `${OWNER}/.cloudflare/wrangler.${name}.json`,
    },
  };
}

export default {
  databases: {
    main: {
      environments: { dev: environment("dev"), prod: environment("prod") },
      migrationsDir: "./migrations",
    },
  },
};
