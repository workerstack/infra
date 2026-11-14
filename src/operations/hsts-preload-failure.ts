/** The error for a hstspreload.org check `name` that answered with a non-2xx `response`. */
export function hstspreloadFailure(name: string, response: Response): Error {
  return new Error(`hstspreload.org ${name} check failed: ${response.status} ${response.statusText}`);
}
