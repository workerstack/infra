/** What an app registration should look like; `withSecret` asks for a new client secret. */
export type AppInput = { appName: string; redirectUris: string[]; signInAudience: string; withSecret: boolean };
