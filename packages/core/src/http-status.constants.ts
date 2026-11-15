/** HTTP status codes by their RFC 9110 reason phrase. */
export const HTTP_STATUS = {
  ACCEPTED: 202,
  BAD_REQUEST: 400,
  CREATED: 201,
  MOVED_PERMANENTLY: 301,
  NOT_FOUND: 404,
  OK: 200,
} as const;
