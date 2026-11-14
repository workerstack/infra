/** One quoted chunk of a TXT value: CF wraps TXT in quotes and splits long values. */
export const TXT_CHUNK: RegExp = /"([^"]*)"/g;
