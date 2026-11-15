// `defineInfraConfig` types `bindings` as `Record<string, EnvBindings> & <the literal bindings>`; that index
// signature would make every name a plain string, so it is dropped to keep the names.
/** `T` without its string index signature, so only the declared keys remain. */
type WithoutIndex<T> = { [K in keyof T as string extends K ? never : K]: T[K] };

/** The binding sets of every scope in `B`, as one union. */
type BindingsUnion<B> = WithoutIndex<B>[keyof WithoutIndex<B>];

/** The names under field `F` in each member of `U`, or `never` where `F` is absent. */
type FieldNames<U, F extends string> = U extends unknown
  ? F extends keyof U
    ? keyof NonNullable<U[F]> & string
    : never
  : never;

/**
 * The names bindings `B` declare for kind `F` in any scope: a binding only some scopes have (`ai_search`) is still
 * nameable, and asking for it in a scope that lacks it fails generation with the scope named.
 */
export type NamesIn<B, F extends string> = FieldNames<BindingsUnion<B>, F>;
