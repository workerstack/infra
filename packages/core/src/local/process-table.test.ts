import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { membersOf } from "./members-of.ts";
import { parseOwnerPids } from "./parse-owner-pids.ts";
import { parsePs } from "./parse-ps.ts";
import { parseWin32 } from "./parse-win32.ts";
import { processOf } from "./process-of.ts";
import type { ProcessRow } from "./process-row.ts";
import { readProcessTable } from "./read-process-table.ts";

// The API under test, one export per file:
// ProcessRow = { pid, parent, group, start, cmdline }; group is the pgid on posix and the pid itself on win32;
// start is epoch ms on darwin and win32, /proc clock ticks on linux.
// parsePs(text): rows from `ps -axo pid=,ppid=,pgid=,lstart=,command=`; lstart is the fixed 24-char local-time form.
// parseWin32(json): rows from `Get-CimInstance Win32_Process | Select ProcessId,ParentProcessId,CreationDate,
// CommandLine | ConvertTo-Json`: an array, or one object for a single process.
// Windows PowerShell 5.1 emits CreationDate as "\/Date(<epoch ms>)\/" (the string "/Date(<ms>)/" once parsed);
// PowerShell 7 emits ISO 8601 ("2026-11-15T22:00:00+00:00"). Both are read. A null CommandLine is "".
// membersOf(rows, leader, platform): posix, the rows in the group; win32, the leader if alive and its descendants.
// parseOwnerPids(text): the distinct pids of `lsof -t` output or Get-NetTCPConnection's OwningProcess lines.
// readProcessTable() / processOf(pid): the live table or one row; on linux from /proc, cmdline NUL-joined to spaces.

const SUNDAY = new Date("Sun Nov 15 22:00:00 2026").getTime();
const NOON_MS = 1_763_244_000_000;

describe("parsePs", () => {
  it("reads a command with spaces and parens whole", () => {
    const line = "  412   400   399 Sun Nov 15 22:00:00 2026 node -e console.log((1 + 2)) --flag  x";

    expect(parsePs(line)).toStrictEqual([
      { cmdline: "node -e console.log((1 + 2)) --flag  x", group: 399, parent: 400, pid: 412, start: SUNDAY },
    ]);
  });

  it("reads every line, a space-padded day too", () => {
    const text = [
      "    1     0     1 Sun Nov  5 22:00:00 2026 /sbin/launchd",
      "   77     1    77 Sun Nov 15 22:00:00 2026 sh",
    ];

    expect(parsePs(`${text.join("\n")}\n`).map((row) => row.pid)).toStrictEqual([1, 77]);
  });

  it("is empty for empty output", () => {
    expect(parsePs("")).toStrictEqual([]);
    expect(parsePs("\n")).toStrictEqual([]);
  });
});

const WIN32_ROWS = [
  {
    CommandLine: 'node.exe "C:\\a b\\x.js" (1)',
    CreationDate: "/Date(1763244000000)/",
    ParentProcessId: 4,
    ProcessId: 100,
  },
  { CommandLine: null, CreationDate: "/Date(1763244001000)/", ParentProcessId: 100, ProcessId: 200 },
  { CommandLine: "sleep.exe 1000", CreationDate: "2025-11-15T22:00:02+00:00", ParentProcessId: 200, ProcessId: 300 },
];

describe("parseWin32", () => {
  const rows = WIN32_ROWS;
  const parsed = parseWin32(JSON.stringify(rows));

  it("is a row per process, each its own group, with its parent", () => {
    expect(parsed.map((row) => [row.pid, row.parent, row.group])).toStrictEqual([
      [100, 4, 100],
      [200, 100, 200],
      [300, 200, 300],
    ]);
  });

  it("reads the CIM date in both forms and a null CommandLine as empty", () => {
    expect(parsed.map((row) => row.start)).toStrictEqual([NOON_MS, NOON_MS + 1000, NOON_MS + 2000]);
    expect(parsed.find((row) => row.pid === 200)?.cmdline).toBe("");
  });

  it("keeps a command with spaces and parens whole", () => {
    expect(parsed.find((row) => row.pid === 100)?.cmdline).toBe('node.exe "C:\\a b\\x.js" (1)');
  });

  it("reads the single object PowerShell writes for one process", () => {
    expect(parseWin32(JSON.stringify(rows[0]))).toHaveLength(1);
  });

  it("is empty for empty output", () => {
    expect(parseWin32("")).toStrictEqual([]);
  });
});

function rowOf(fields: Partial<ProcessRow>): ProcessRow {
  return { cmdline: "", group: 0, parent: 0, pid: 0, start: 0, ...fields };
}

describe("membersOf", () => {
  const table = [
    rowOf({ group: 10, parent: 1, pid: 10, start: 5 }),
    rowOf({ group: 10, parent: 10, pid: 11, start: 6 }),
    rowOf({ group: 12, parent: 11, pid: 12, start: 7 }),
    rowOf({ group: 13, parent: 1, pid: 13, start: 8 }),
    rowOf({ group: 14, parent: 12, pid: 14, start: 3 }),
  ];

  it("is the rows of the group on posix", () => {
    expect(membersOf(table, 10, "linux").map((member) => member.pid)).toStrictEqual([10, 11]);
  });

  it("is the leader and its descendants on win32, past a child that started before its parent", () => {
    expect(membersOf(table, 10, "win32").map((member) => member.pid)).toStrictEqual([10, 11, 12]);
  });

  it("is the dead leader's children and theirs on win32, and survives a parent cycle", () => {
    expect(membersOf(table, 99, "win32")).toStrictEqual([]);
    expect(membersOf(table.slice(1), 10, "win32").map((member) => member.pid)).toStrictEqual([11, 12]);
    expect(
      membersOf(
        [rowOf({ group: 1, parent: 2, pid: 1, start: 1 }), rowOf({ group: 2, parent: 1, pid: 2, start: 1 })],
        1,
        "win32",
      ),
    ).toHaveLength(2);
  });
});

describe("parseOwnerPids", () => {
  it("reads lsof -t lines", () => {
    expect(parseOwnerPids("4021\n4022\n")).toStrictEqual([4021, 4022]);
  });

  it("reads Get-NetTCPConnection OwningProcess lines once each, past CRLF", () => {
    expect(parseOwnerPids("5120\r\n5120\r\n")).toStrictEqual([5120]);
  });

  it("is empty when nothing listens", () => {
    expect(parseOwnerPids("")).toStrictEqual([]);
  });
});

describe("the table on linux", () => {
  const stat = readFileSync("/proc/self/stat", "utf8").slice(
    readFileSync("/proc/self/stat", "utf8").lastIndexOf(")") + 2,
  );

  const [, parent, group] = stat.split(" ").map(Number);
  const cmdline = readFileSync("/proc/self/cmdline", "utf8").replace(/\0$/, "").split("\0").join(" ");

  it.runIf(process.platform === "linux")("lists this process with its group, parent and space-joined command", () => {
    expect(readProcessTable().find((row) => row.pid === process.pid)).toMatchObject({ cmdline, group, parent });
  });

  it.runIf(process.platform === "linux")("reads one process alone, and none once it is gone", () => {
    expect(processOf(process.pid)).toMatchObject({ cmdline, group, parent });
    expect(processOf(2 ** 22 + 1)).toBeUndefined();
  });
});
