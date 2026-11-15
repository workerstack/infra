/** A fetch that cannot reach anything. */
export function rejectingFetch(): Promise<Response> {
  return Promise.reject(new Error("offline"));
}
