/** An app registration found or created; `clientSecret` is set only when a new one was asked for. */
export type CreatedApp = { appId: string; clientSecret: string | undefined; objectId: string };
