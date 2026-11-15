/** Read and write for the owner alone: the secrets file holds values. */
export const SECRETS_FILE_MODE: number = 0o600;

/** The prefix of the temp dir that holds the secrets file. */
export const SECRETS_DIR_PREFIX = "infra-deploy-";

/** The secrets file's name. */
export const SECRETS_FILE_NAME = "secrets.json";
