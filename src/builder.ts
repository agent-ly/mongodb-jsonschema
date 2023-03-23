import { Decimal128, Long, ObjectId, Timestamp, Binary } from "mongodb";

import type {
  ArrayKeywords,
  BSONType,
  JSONSchema,
  JSONType,
  NumericKeywords,
  ObjectKeywords,
  StringKeywords,
} from "./json_schema.ts";
import type { UnionToIntersect } from "./util.ts";
import { type StringFormat, StringFormats } from "./string_formats.ts";

export type InferType<T> = T extends Builder<infer U> ? U : never;
type AnyBuilder = Builder<unknown>;
type AllOfBuilder<U extends AnyBuilder[], T = unknown> = Builder<
  T & UnionToIntersect<InferType<U[number]>>
>;
type AnyOfOrOneOfBuilder<U extends AnyBuilder[], T = unknown> = Builder<
  T & InferType<U[number]>
>;
type NotBuilder<U extends AnyBuilder, T> = Builder<
  T extends InferType<U> ? never : T
>;
type EnumBuilder<U extends Record<string, unknown>, T> = Builder<
  T & U[keyof U]
>;
export interface NumericOptions<N extends number | bigint = number>
  extends NumericKeywords {
  multipleOf?: N;
  minimum?: N;
  maximum?: N;
}
export interface StringOptions extends Omit<StringKeywords, "pattern"> {
  format?: StringFormat;
  pattern?: string | RegExp;
}
export interface ArrayOptions
  extends Omit<ArrayKeywords, "items" | "additionalItems"> {
  additionalItems?: boolean | AnyBuilder;
}
type ArrayBuilder<U extends AnyBuilder | AnyBuilder[], T> = Builder<
  U extends AnyBuilder[] ? T & InferType<U[number]>[] : T & InferType<U>[]
>;
export interface ObjectOptions
  extends Omit<
    ObjectKeywords,
    "properties" | "patternProperties" | "additionalProperties" | "dependencies"
  > {
  patternProperties?: Record<string, AnyBuilder>;
  additionalProperties?: boolean | AnyBuilder;
  dependencies?: Record<string, AnyBuilder | string[]>;
}
/*type OptionalPropertyKeys<T extends Record<string, AnyBuilder>> = {
  [K in keyof T]: undefined extends InferType<T[K]> ? K : never;
}[keyof T];
type RequiredPropertyKeys<T extends Record<string, AnyBuilder>> = keyof Omit<
  T,
  OptionalPropertyKeys<T>
>;
type ReduceProperties<
  T extends Record<string, AnyBuilder>,
  R extends Record<keyof T, unknown>
> = Evaluate<
  Required<Pick<R, RequiredPropertyKeys<T>>> &
    Partial<Pick<R, OptionalPropertyKeys<T>>>
>;*/
type ObjectBuilder<U extends Record<string, AnyBuilder>, T> = Builder<
  T & { [K in keyof U]: InferType<U[K]> }
>;

export class Builder<T> {
  protected declare __type__: T;

  #schema: JSONSchema = {};

  optional(): Builder<T | undefined> {
    return this;
  }

  nullable(): Builder<T | null> {
    let typeOrBsonType = this.#schema.type || this.#schema.bsonType;
    if (!typeOrBsonType)
      throw new Error("A type must be specified before calling nullable()");
    typeOrBsonType =
      typeOrBsonType instanceof Array
        ? [...typeOrBsonType, "null"]
        : [typeOrBsonType, "null"];
    if (this.#schema.type) this.#schema.type = typeOrBsonType;
    else if (this.#schema.bsonType) this.#schema.bsonType = typeOrBsonType;
    return this as Builder<T | null>;
  }

  title(title: string) {
    this.#schema.title = title;
    return this;
  }

  description(description: string) {
    this.#schema.description = description;
    return this;
  }

  allOf<U extends AnyBuilder[]>(builders: U): AllOfBuilder<U, T> {
    this.#schema.allOf = builders.map((builder) => builder.#schema);
    return this as any;
  }

  anyOf<U extends AnyBuilder[]>(builders: U): AnyOfOrOneOfBuilder<U, T> {
    this.#schema.anyOf = builders.map((builder) => builder.#schema);
    return this as any;
  }

  oneOf<U extends AnyBuilder[]>(builders: U): AnyOfOrOneOfBuilder<U, T> {
    this.#schema.oneOf = builders.map((builder) => builder.#schema);
    return this as any;
  }

  not<U extends AnyBuilder>(builder: U): NotBuilder<U, T> {
    this.#schema.not = builder.#schema;
    return this as any;
  }

  enum<U extends Record<string, unknown>>(enums: U): EnumBuilder<U, T> {
    this.#schema.enum = [...Object.values(enums)];
    return this as any;
  }

  type(type: JSONType | JSONType[]) {
    this.#schema.type = type;
    return this;
  }

  bsonType(type: BSONType | BSONType[]) {
    this.#schema.bsonType = type;
    return this;
  }

  multipleOf(multipleOf: number | bigint) {
    this.#schema.multipleOf = multipleOf;
    return this;
  }

  minimum(minimum: number | bigint = 0, exclusive?: boolean) {
    this.#schema.minimum = minimum;
    if (exclusive !== undefined) this.#schema.exclusiveMinimum = exclusive;
    return this;
  }

  maximum(maximum: number | bigint, exclusive?: boolean) {
    this.#schema.maximum = maximum;
    if (exclusive !== undefined) this.#schema.exclusiveMaximum = exclusive;
    return this;
  }

  minLength(minLength = 0) {
    this.#schema.minLength = minLength;
    return this;
  }

  maxLength(maxLength = 0) {
    this.#schema.maxLength = maxLength;
    return this;
  }

  pattern(pattern: string | RegExp) {
    if (pattern instanceof RegExp) pattern = pattern.source;
    this.#schema.pattern = pattern;
    return this;
  }

  minItems(minItems = 0) {
    this.#schema.minItems = minItems;
    return this;
  }

  maxItems(maxItems: number) {
    this.#schema.maxItems = maxItems;
    return this;
  }

  uniqueItems(uniqueItems: boolean) {
    this.#schema.uniqueItems = uniqueItems;
    return this;
  }

  items<U extends AnyBuilder | AnyBuilder[]>(
    builderOrBuilders: U
  ): ArrayBuilder<U, T> {
    this.#schema.items =
      builderOrBuilders instanceof Array
        ? builderOrBuilders.map((builder) => builder.#schema)
        : builderOrBuilders.#schema;
    return this as any;
  }

  additionalItems(booleanOrBuilder: boolean | AnyBuilder) {
    this.#schema.additionalItems =
      typeof booleanOrBuilder === "boolean"
        ? booleanOrBuilder
        : booleanOrBuilder.#schema;
    return this;
  }

  minProperties(minProperties = 0) {
    this.#schema.minProperties = minProperties;
    return this;
  }

  maxProperties(maxProperties: number) {
    this.#schema.maxProperties = maxProperties;
    return this;
  }

  required(required: string[] = []) {
    this.#schema.required = required;
    return this;
  }

  properties<U extends Record<string, AnyBuilder>>(
    properties: U
  ): ObjectBuilder<U, T> {
    this.#schema.properties = {};
    for (const [key, builder] of Object.entries(properties))
      this.#schema.properties[key] = builder.#schema;
    return this as any;
  }

  patternProperties(patternProperties: Record<string, AnyBuilder>) {
    this.#schema.patternProperties = {};
    for (const [key, builder] of Object.entries(patternProperties))
      this.#schema.patternProperties[key] = builder.#schema;
    return this;
  }

  additionalProperties(booleanOrBuilder: boolean | AnyBuilder) {
    this.#schema.additionalProperties =
      typeof booleanOrBuilder === "boolean"
        ? booleanOrBuilder
        : booleanOrBuilder.#schema;
    return this;
  }

  dependencies(dependencies: Record<string, AnyBuilder | string[]>) {
    this.#schema.dependencies = {};
    for (const [key, value] of Object.entries(dependencies)) {
      this.#schema.dependencies[key] =
        value instanceof Array ? value : value.#schema;
    }
    return this;
  }

  getSchema() {
    return this.#schema;
  }
}

const buildType = <T>(type?: JSONType, bsonType?: BSONType) => {
  const builder = new Builder<T>();
  if (type) builder.type(type);
  else if (bsonType) builder.bsonType(bsonType);
  return builder;
};

const buildScalar = <T, N extends bigint | number = number>(
  type?: "boolean" | "string" | "number",
  bsonType?: "bool" | "string" | "int" | "long" | "double" | "decimal",
  options?: StringOptions | NumericOptions<N>
) => {
  const builder = buildType<T>(type, bsonType);
  if (type === "string" || bsonType === "string") {
    options = options as StringOptions;
    if (options?.minLength !== undefined) builder.minLength(options.minLength);
    if (options?.maxLength !== undefined) builder.maxLength(options.maxLength);
    if (options?.format && options.format in StringFormats)
      options.pattern = StringFormats[options.format];
    if (options?.pattern) builder.pattern(options.pattern);
  } else if (
    type === "number" ||
    bsonType === "int" ||
    bsonType === "long" ||
    bsonType === "double" ||
    bsonType === "decimal"
  ) {
    options = options as NumericOptions<N>;
    if (options?.multipleOf !== undefined)
      builder.multipleOf(options.multipleOf);
    if (options?.minimum !== undefined)
      builder.minimum(options.minimum, options.exclusiveMinimum);
    if (options?.maximum !== undefined)
      builder.maximum(options.maximum, options.exclusiveMaximum);
  }
  return builder;
};

export const Type = {
  allOf: <U extends AnyBuilder[]>(builders: U) => new Builder().allOf(builders),
  anyOf: <U extends AnyBuilder[]>(builders: U) => new Builder().anyOf(builders),
  oneOf: <U extends AnyBuilder[]>(builders: U) => new Builder().oneOf(builders),
  not: <T, U extends AnyBuilder>(builder: U) => new Builder<T>().not(builder),
  enum: <T extends Record<string, unknown>>(enums: T) =>
    new Builder().enum(enums),

  any: () => buildType<any>(),
  null: () => buildType<null>("null"),
  boolean: () => buildType<boolean>("boolean"),
  number: <T extends number = number>(options?: NumericOptions<number>) =>
    buildScalar<T>("number", undefined, options),
  string: <T extends string = string>(options?: StringOptions) =>
    buildScalar<T>("string", undefined, options),
  array: <T extends undefined | AnyBuilder | AnyBuilder[]>(
    items?: T,
    options?: ArrayOptions
  ): T extends AnyBuilder | AnyBuilder[]
    ? ArrayBuilder<T, unknown>
    : Builder<unknown[]> => {
    const builder = new Builder<unknown[]>().type("array");
    if (options?.minItems !== undefined) builder.minItems(options.minItems);
    if (options?.maxItems !== undefined) builder.maxItems(options.maxItems);
    if (options?.uniqueItems) builder.uniqueItems(options.uniqueItems);
    if (items) builder.items(items);
    if (options?.additionalItems)
      builder.additionalItems(options.additionalItems);
    return builder as any;
  },
  object: <T extends undefined | Record<string, AnyBuilder>>(
    properties?: T,
    options?: ObjectOptions
  ): T extends Record<string, AnyBuilder>
    ? ObjectBuilder<T, unknown>
    : Builder<Record<string, unknown>> => {
    const builder = new Builder<Record<string, unknown>>().type("object");
    if (options?.minProperties !== undefined)
      builder.minProperties(options.minProperties);
    if (options?.maxProperties !== undefined)
      builder.maxProperties(options.maxProperties);
    if (options?.required) builder.required(options.required);
    if (properties) builder.properties(properties);
    if (options?.patternProperties)
      builder.patternProperties(options.patternProperties!);
    if (options?.additionalProperties)
      builder.additionalProperties(options.additionalProperties);
    if (options?.dependencies) builder.dependencies(options.dependencies);
    return builder as any;
  },

  bool: () => buildType<boolean>(undefined, "bool"),
  int: <T extends number = number>(options?: NumericOptions<number>) =>
    buildScalar<T>(undefined, "int", options),
  bigint: <T extends bigint = bigint>(options?: NumericOptions<bigint>) =>
    buildScalar<T, bigint>(undefined, "long", options),
  double: (options?: NumericOptions<number>) =>
    buildScalar<number>(undefined, "double", options),
  long: (options?: NumericOptions<bigint>) =>
    buildScalar<Long, bigint>(undefined, "long", options),
  decimal: (options?: NumericOptions<bigint>) =>
    buildScalar<Decimal128, bigint>(undefined, "decimal", options),
  date: () => buildType<Date>(undefined, "date"),
  timestamp: () => buildType<Timestamp>(undefined, "timestamp"),
  objectId: () => buildType<ObjectId>(undefined, "objectId"),
  binData: () => buildType<Binary>(undefined, "binData"),
} as const;
