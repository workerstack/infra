/** The `fetch` shape the API modules take, so a test passes a fake. */
export type CfFetch = (url: string, init: RequestInit) => Promise<Response>;
