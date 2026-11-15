type Vars = { GREETING: string };

export default {
  fetch: (request: Request, env: Vars): Response =>
    Response.json({ greeting: env.GREETING, path: new URL(request.url).pathname }),
};
