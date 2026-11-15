// A directory name, or a path ending in one, that the env file scan never enters.
export const ENV_SCAN_SKIP: RegExp = /(?:^|\/)(?:node_modules|\.git|\.worktrees)$/;
