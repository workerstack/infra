/** A JSON value: what `JSON.parse` yields and `stringifyJson` writes. */
export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };
