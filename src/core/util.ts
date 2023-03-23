export type TupleToIntersect<T extends unknown[]> = T extends [infer I]
  ? I
  : T extends [infer I, ...infer R]
  ? I & TupleToIntersect<R>
  : never;
export type TupleToUnion<T extends unknown[]> = {
  [K in keyof T]: T[K];
}[number];
