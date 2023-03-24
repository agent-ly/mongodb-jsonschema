export type Evaluate<T> = T extends infer O
  ? {
      [K in keyof O]: O[K];
    }
  : never;
export type OptionalPropertyKeys<T extends Record<string, unknown>> = {
  [K in keyof T]: undefined extends T[K] ? K : never;
}[keyof T];
export type RequiredPropertyKeys<T extends Record<string, unknown>> =
  keyof Omit<T, OptionalPropertyKeys<T>>;
export type ReduceProperties<
  T extends Record<string, unknown>,
  R extends Record<keyof T, unknown>
> = Evaluate<
  Required<Pick<R, RequiredPropertyKeys<T>>> &
    Partial<Pick<R, OptionalPropertyKeys<T>>>
>;
export type UnionToIntersection<U> = (
  U extends unknown ? (_: U) => 0 : never
) extends (_: infer I) => 0
  ? I
  : never;
