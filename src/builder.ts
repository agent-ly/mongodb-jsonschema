import { Binary, Decimal128, Long, ObjectId, Timestamp } from "mongodb";

import type { JSONSchema } from "./jsonschema.ts";
import type { ReduceProperties, UnionToIntersection } from "./util.ts";

export type AnyNumber = number | bigint;
export type AnyMap = Record<string, unknown>;
export type AnyBuilder = Builder<unknown>;
export type AnyBuilderMap = Record<string, AnyBuilder>;
export type InferType<T> = T extends Builder<infer U> ? U : never;
export type LoosenType<T extends AnyMap> = ReduceProperties<T, T>;
export type InferUnionType<TBuilders extends AnyBuilder[]> = InferType<
  TBuilders[number]
>;
export type InferIntersectionType<TBuilders extends AnyBuilder[]> =
  UnionToIntersection<InferUnionType<TBuilders>>;
export type InferNotType<T, TBuilder extends AnyBuilder> = Exclude<
  T,
  InferType<TBuilder>
>;
export type InferEnumType<TEnums extends AnyMap> = TEnums[keyof TEnums];
export type InferArrayType<TItems extends AnyBuilder | AnyBuilder[]> =
  TItems extends AnyBuilder[]
    ? InferType<TItems[number]>[]
    : InferType<TItems>[];
type ReduceArrayType<
  T,
  TItems extends AnyBuilder | AnyBuilder[]
> = T extends unknown[] ? InferArrayType<TItems> : T | InferArrayType<TItems>;
export type InferObjectType<TProperties extends AnyBuilderMap> =
  {} extends TProperties
    ? { [key: string]: unknown }
    : { [K in keyof TProperties]: InferType<TProperties[K]> };
type ReduceObjectType<T, TProperties extends AnyBuilderMap> = T extends AnyMap
  ? InferObjectType<TProperties>
  : T | InferObjectType<TProperties>;
export class Builder<T> {
  protected declare __type__: T;

  #schema: JSONSchema;

  constructor() {
    this.#schema = {};
  }

  // Configuration

  optional(): Builder<T | undefined> {
    return this;
  }

  nullable(): Builder<T | null> {
    let typeOrBsonType = this.#schema.type || this.#schema.bsonType;
    if (!typeOrBsonType)
      throw new Error("A type must be specified before calling nullable()");
    if (
      (typeof typeOrBsonType === "string" && typeOrBsonType === "null") ||
      typeOrBsonType.includes("null")
    )
      throw new Error("Cannot call nullable() on an already nullable type");
    typeOrBsonType =
      typeOrBsonType instanceof Array
        ? [...typeOrBsonType, "null"]
        : [typeOrBsonType, "null"];
    if (this.#schema.type) this.#schema.type = typeOrBsonType;
    else if (this.#schema.bsonType) this.#schema.bsonType = typeOrBsonType;
    return this;
  }

  // Metadata

  title(title: string): this {
    this.#schema.title = title;
    return this;
  }

  description(description: string): this {
    this.#schema.description = description;
    return this;
  }

  // Logical

  allOf<TBuilders extends AnyBuilder[]>(
    ...builders: TBuilders
  ): Builder<T & InferIntersectionType<TBuilders>> {
    this.#schema.allOf = builders.map((builder) => builder.#schema);
    return this as any;
  }

  anyOf<TBuilders extends AnyBuilder[]>(
    ...builders: TBuilders
  ): Builder<T | InferUnionType<TBuilders>> {
    this.#schema.anyOf = builders.map((builder) => builder.#schema);
    return this as any;
  }

  oneOf<TBuilders extends AnyBuilder[]>(
    ...builders: TBuilders
  ): Builder<T | InferUnionType<TBuilders>> {
    this.#schema.oneOf = builders.map((builder) => builder.#schema);
    return this as any;
  }

  not<TBuilder extends AnyBuilder>(
    builder: TBuilder
  ): Builder<InferNotType<T, TBuilder>> {
    this.#schema.not = builder.#schema;
    return this as any;
  }

  enum<TEnums extends AnyMap>(enums: TEnums): Builder<InferEnumType<TEnums>> {
    this.#schema.enum = Object.keys(enums);
    return this as any;
  }

  // Types

  type(type: JSONSchema["type"]): this {
    this.#schema.type = type;
    return this;
  }

  bsonType(bsonType: JSONSchema["bsonType"]): this {
    this.#schema.bsonType = bsonType;
    return this;
  }

  // Number

  multipleOf(multipleOf: AnyNumber): this {
    this.#schema.multipleOf = multipleOf;
    return this;
  }

  minimum(minimum: AnyNumber, exclusive?: boolean): this {
    this.#schema.minimum = minimum;
    if (exclusive !== undefined) this.#schema.exclusiveMinimum = exclusive;
    return this;
  }

  maximum(maximum: AnyNumber, exclusive?: boolean): this {
    this.#schema.maximum = maximum;
    if (exclusive !== undefined) this.#schema.exclusiveMaximum = exclusive;
    return this;
  }

  // String

  minLength(minLength: number): this {
    this.#schema.minLength = minLength;
    return this;
  }

  maxLength(maxLength: number): this {
    this.#schema.maxLength = maxLength;
    return this;
  }

  pattern(pattern: string | RegExp): this {
    this.#schema.pattern = pattern instanceof RegExp ? pattern.source : pattern;
    return this;
  }

  // Array

  minItems(minItems: number): this {
    this.#schema.minItems = minItems;
    return this;
  }

  maxItems(maxItems: number): this {
    this.#schema.maxItems = maxItems;
    return this;
  }

  uniqueItems(uniqueItems: boolean): this {
    this.#schema.uniqueItems = uniqueItems;
    return this;
  }

  additionalItems(additionalItems: boolean | AnyBuilder): this {
    this.#schema.additionalItems =
      typeof additionalItems === "boolean"
        ? additionalItems
        : additionalItems.#schema;
    return this;
  }

  items<TItems extends AnyBuilder | AnyBuilder[]>(
    items: TItems
  ): Builder<ReduceArrayType<T, TItems>> {
    this.#schema.items = Array.isArray(items)
      ? items.map((item) => item.#schema)
      : items.#schema;
    return this as any;
  }

  // Object

  minProperties(minProperties: number): this {
    this.#schema.minProperties = minProperties;
    return this;
  }

  maxProperties(maxProperties: number): this {
    this.#schema.maxProperties = maxProperties;
    return this;
  }

  required(required: string[]): this {
    this.#schema.required = required;
    return this;
  }

  properties<TProperties extends AnyBuilderMap>(
    properties: TProperties
  ): Builder<ReduceObjectType<T, TProperties>> {
    if (properties) {
      this.#schema.properties = {};
      for (const [key, value] of Object.entries(properties)) {
        this.#schema.properties[key] = value.#schema;
      }
    }
    return this as any;
  }

  patternProperties(patternProperties: AnyBuilderMap): this {
    this.#schema.patternProperties = {};
    for (const [key, value] of Object.entries(patternProperties)) {
      this.#schema.patternProperties[key] = value.#schema;
    }
    return this;
  }

  additionalProperties(additionalProperties: boolean | AnyBuilder): this {
    this.#schema.additionalProperties =
      typeof additionalProperties === "boolean"
        ? additionalProperties
        : additionalProperties.#schema;
    return this;
  }

  dependencies(dependencies: Record<string, string[] | AnyBuilder>): this {
    this.#schema.dependencies = {};
    for (const [key, value] of Object.entries(dependencies)) {
      this.#schema.dependencies[key] =
        value instanceof Builder ? value.#schema : value;
    }
    return this;
  }

  // Public

  getSchema(): JSONSchema {
    return this.#schema;
  }
}
export interface TypeOptions {
  type?: string;
  bsonType?: string;
}
export interface StringOptions {
  minLength?: number;
  maxLength?: number;
  format?: string;
  pattern?: string | RegExp;
}
export interface NumericOptions<N extends AnyNumber> {
  multipleOf?: N;
  minimum?: N;
  exclusiveMinimum?: boolean;
  maximum?: N;
  exclusiveMaximum?: boolean;
}
export interface ArrayOptions {
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  additionalItems?: boolean | AnyBuilder;
}
export interface ObjectOptions {
  minProperties?: number;
  maxProperties?: number;
  required?: string[];
  patternProperties?: AnyBuilderMap;
  additionalProperties?: boolean | AnyBuilder;
  dependencies?: Record<string, string[] | AnyBuilder>;
}
export const buildType = <T>(options?: TypeOptions) => {
  const builder = new Builder<T>();
  if (options?.type) builder.type(options.type);
  else if (options?.bsonType) builder.bsonType(options.bsonType);
  return builder;
};
export const buildScalar = <T, N extends AnyNumber>(
  options?: TypeOptions & StringOptions & NumericOptions<N>
) => {
  const builder = buildType<T>(options);
  if (options?.minLength) builder.minLength(options.minLength);
  if (options?.maxLength) builder.maxLength(options.maxLength);
  if (options?.format) options.pattern = options.format;
  if (options?.pattern) builder.pattern(options.pattern);
  if (options?.multipleOf) builder.multipleOf(options.multipleOf);
  if (options?.minimum)
    builder.minimum(options.minimum, options.exclusiveMinimum);
  if (options?.maximum)
    builder.maximum(options.maximum, options.exclusiveMaximum);
  return builder;
};
export const Build = {
  builder: <T>() => new Builder<T>(),

  allOf: <TBuilders extends AnyBuilder[]>(...allOf: TBuilders) =>
    new Builder<InferIntersectionType<TBuilders>>().allOf(...allOf),
  anyOf: <TBuilders extends AnyBuilder[]>(...anyOf: TBuilders) =>
    new Builder<InferUnionType<TBuilders>>().anyOf(...anyOf),
  oneOf: <TBuilders extends AnyBuilder[]>(...oneOf: TBuilders) =>
    new Builder<InferUnionType<TBuilders>>().oneOf(...oneOf),
  not: <T, TBuilder extends AnyBuilder>(not: TBuilder) =>
    new Builder<InferNotType<T, TBuilder>>().not(not),
  enum: <T extends AnyMap>(enums: T) =>
    new Builder<InferEnumType<T>>().enum(enums),
  type: <T>(type: string) => buildType<T>({ type }),
  null: () => buildType<null>({ type: "null" }),
  boolean: () => buildType<boolean>({ type: "boolean" }),
  number: <T extends number = number>(options?: NumericOptions<number>) =>
    buildScalar<T, number>({ type: "number", ...options }),
  string: <T extends string = string>(options?: StringOptions) =>
    buildScalar<T, never>({ type: "string", ...options }),
  array<TItems extends AnyBuilder | AnyBuilder[] = AnyBuilder>(
    items?: TItems,
    options?: ArrayOptions
  ) {
    const builder = new Builder<InferArrayType<TItems>>().type("array");
    if (options?.minItems) builder.minItems(options.minItems);
    if (options?.maxItems) builder.maxItems(options.maxItems);
    if (options?.uniqueItems) builder.uniqueItems(options.uniqueItems);
    if (items) builder.items(items);
    if (options?.additionalItems)
      builder.additionalItems(options.additionalItems);
    return builder;
  },
  object<TProperties extends AnyBuilderMap = AnyBuilderMap>(
    properties?: TProperties,
    options?: ObjectOptions
  ) {
    const builder = new Builder<InferObjectType<TProperties>>().type("object");
    if (options?.minProperties) builder.minProperties(options.minProperties);
    if (options?.maxProperties) builder.maxProperties(options.maxProperties);
    if (options?.required) builder.required(options.required);
    if (properties) builder.properties(properties);
    if (options?.patternProperties)
      builder.patternProperties(options.patternProperties);
    if (options?.additionalProperties)
      builder.additionalProperties(options.additionalProperties);
    if (options?.dependencies) builder.dependencies(options.dependencies);
    return builder;
  },

  bsonType: <T>(bsonType: string) => buildType<T>({ bsonType }),
  bool: () => buildType<boolean>({ bsonType: "bool" }),
  double: <T extends number = number>(options?: NumericOptions<number>) =>
    buildScalar<T, number>({ bsonType: "double", ...options }),
  int: <T extends number>(options?: NumericOptions<number>) =>
    buildScalar<T, number>({ bsonType: "int", ...options }),
  bigint: <T extends bigint>(options?: NumericOptions<bigint>) =>
    buildScalar<T, bigint>({ bsonType: "long", ...options }),
  long: (options?: NumericOptions<bigint>) =>
    buildScalar<Long, bigint>({ bsonType: "long", ...options }),
  decimal: (options?: NumericOptions<bigint>) =>
    buildScalar<Decimal128, bigint>({ bsonType: "decimal", ...options }),
  date: () => buildType<Date>({ bsonType: "date" }),
  timestamp: () => buildType<Timestamp>({ bsonType: "timestamp" }),
  objectId: () => buildType<ObjectId>({ bsonType: "objectId" }),
  binary: () => buildType<Binary>({ bsonType: "binData" }),
};
