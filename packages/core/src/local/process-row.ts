/**
 * One process of a snapshot. `group` is the process group on posix and the pid itself on win32, which has none;
 * `start` is /proc clock ticks on linux and epoch ms elsewhere; `cmdline` is space-joined on every platform.
 */
export type ProcessRow = { cmdline: string; group: number; parent: number; pid: number; start: number };
