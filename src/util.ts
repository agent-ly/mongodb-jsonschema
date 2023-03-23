/*export type TupleToIntersect<T extends unknown[]> = T extends [infer I]
  ? I
  : T extends [infer I, ...infer R]
  ? I & TupleToIntersect<R>
  : T;
export type TupleToUnion<T extends unknown[]> = T[number];*/
export type UnionToIntersect<U> = (
  U extends unknown ? (arg: U) => 0 : never
) extends (arg: infer I) => 0
  ? I
  : never;
/*export type UnionLast<U> = UnionToIntersect<
  U extends unknown ? (x: U) => 0 : never
> extends (x: infer L) => 0
  ? L
  : never;
export type UnionToTuple<U, L = UnionLast<U>> = [U] extends [never]
  ? []
  : [...UnionToTuple<Exclude<U, L>>, L];

export type Assert<T, E> = T extends E ? T : never;
export type Evaluate<T> = T extends infer O
  ? {
      [K in keyof O]: O[K];
    }
  : never;
export type Ensure<T> = T extends infer U ? U : never;*/
