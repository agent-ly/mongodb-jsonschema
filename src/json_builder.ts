import { Binary, Decimal128, Long, ObjectId, Timestamp } from "mongodb";

import type { JSONSchema, JSONType, BSONType } from "./jsonschema.ts";
import type { Flatten, ReduceProperties, UnionToIntersection } from "./util.ts";

export type AnyNumber = number | bigint;
export type AnyMap = Record<string, unknown>;
export type AnyBuilder = Builder<unknown, {}>;
export type AnyBuilderMap = Record<string, AnyBuilder>;
export type InferType<T> = T extends Builder<infer U> ? U : never;
export type InferJSON<T> = T extends Builder<unknown, infer U> ? U : never;
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
export type UpdateBuilderSchema<
  TSchema extends JSONSchema,
  TUpdate extends JSONSchema
> = Flatten<Pick<TSchema, Exclude<keyof TSchema, keyof TUpdate>> & TUpdate>;
export class Builder<T, TSchema extends JSONSchema = {}> {
  protected declare __type__: T;
  protected declare __schema__: TSchema;

  #schema: JSONSchema;

  constructor() {
    this.#schema = {};
  }

  // Configuration

  optional(): Builder<T | undefined, TSchema> {
    return this;
  }

  nullable(): Builder<
    T | null,
    UpdateBuilderSchema<
      TSchema,
      TSchema extends { type: infer JType extends JSONType | JSONType[] }
        ? {
            type: JType extends JSONType[]
              ? [...JType, "null"]
              : [JType, "null"];
          }
        : TSchema extends {
            bsonType: infer BType extends BSONType | BSONType[];
          }
        ? {
            bsonType: BType extends BSONType[]
              ? [...BType, "null"]
              : [BType, "null"];
          }
        : never
    >
  > {
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
    return this as any;
  }

  // Metadata

  title<TTitle extends string = string>(
    title: TTitle
  ): Builder<T, UpdateBuilderSchema<TSchema, { title: TTitle }>> {
    this.#schema.title = title;
    return this as any;
  }

  description<TDescription extends string = string>(
    description: TDescription
  ): Builder<T, UpdateBuilderSchema<TSchema, { description: TDescription }>> {
    this.#schema.description = description;
    return this as any;
  }

  // Logical

  allOf<TBuilders extends AnyBuilder[]>(
    ...builders: TBuilders
  ): Builder<
    T & InferIntersectionType<TBuilders>,
    UpdateBuilderSchema<TSchema, { allOf: InferJSON<TBuilders[number]>[] }>
  > {
    this.#schema.allOf = builders.map((builder) => builder.#schema);
    return this as any;
  }

  anyOf<TBuilders extends AnyBuilder[]>(
    ...builders: TBuilders
  ): Builder<
    T | InferUnionType<TBuilders>,
    UpdateBuilderSchema<TSchema, { anyOf: InferJSON<TBuilders[number]>[] }>
  > {
    this.#schema.anyOf = builders.map((builder) => builder.#schema);
    return this as any;
  }

  oneOf<TBuilders extends AnyBuilder[]>(
    ...builders: TBuilders
  ): Builder<
    T | InferUnionType<TBuilders>,
    UpdateBuilderSchema<TSchema, { oneOf: InferJSON<TBuilders[number]>[] }>
  > {
    this.#schema.oneOf = builders.map((builder) => builder.#schema);
    return this as any;
  }

  not<TBuilder extends AnyBuilder>(
    builder: TBuilder
  ): Builder<
    InferNotType<T, TBuilder>,
    {
      not: InferJSON<TBuilder>;
    }
  > {
    this.#schema.not = builder.#schema;
    return this as any;
  }

  enum<TEnums extends AnyMap>(
    enums: TEnums
  ): Builder<
    InferEnumType<TEnums>,
    UpdateBuilderSchema<
      TSchema,
      {
        enum: TEnums[keyof TEnums][];
      }
    >
  > {
    this.#schema.enum = Object.keys(enums);
    return this as any;
  }

  // Types

  type<TType extends JSONSchema["type"]>(
    type: TType
  ): Builder<T, UpdateBuilderSchema<TSchema, { type: TType }>> {
    this.#schema.type = type;
    return this as any;
  }

  bsonType<TType extends JSONSchema["bsonType"]>(
    bsonType: TType
  ): Builder<T, UpdateBuilderSchema<TSchema, { bsonType: TType }>> {
    this.#schema.bsonType = bsonType;
    return this as any;
  }

  // Number

  multipleOf<TNum extends AnyNumber>(
    multipleOf: TNum
  ): Builder<T, UpdateBuilderSchema<TSchema, { multipleOf: TNum }>> {
    this.#schema.multipleOf = multipleOf;
    return this as any;
  }

  minimum<TNum extends AnyNumber, TBool extends undefined | boolean>(
    minimum: TNum,
    exclusive?: TBool
  ): TBool extends undefined
    ? Builder<T, UpdateBuilderSchema<TSchema, { minimum: TNum }>>
    : Builder<
        T,
        UpdateBuilderSchema<TSchema, { minimum: TNum; exclusiveMinimum: TBool }>
      > {
    this.#schema.minimum = minimum;
    if (exclusive !== undefined) this.#schema.exclusiveMinimum = exclusive;
    return this as any;
  }

  maximum<TNum extends AnyNumber, TBool extends undefined | boolean>(
    maximum: TNum,
    exclusive?: TBool
  ): TBool extends undefined
    ? Builder<T, UpdateBuilderSchema<TSchema, { maximum: TNum }>>
    : Builder<
        T,
        UpdateBuilderSchema<TSchema, { maximum: TNum; exclusiveMaximum: TBool }>
      > {
    this.#schema.maximum = maximum;
    if (exclusive !== undefined) this.#schema.exclusiveMaximum = exclusive;
    return this as any;
  }

  // String

  minLength<TLen extends number>(
    minLength: TLen
  ): Builder<T, UpdateBuilderSchema<TSchema, { minLength: TLen }>> {
    this.#schema.minLength = minLength;
    return this as any;
  }

  maxLength<TLen extends number>(
    maxLength: TLen
  ): Builder<T, UpdateBuilderSchema<TSchema, { maxLength: TLen }>> {
    this.#schema.maxLength = maxLength;
    return this as any;
  }

  pattern<TPattern extends string | RegExp>(
    pattern: TPattern
  ): Builder<
    T,
    UpdateBuilderSchema<
      TSchema,
      {
        pattern: TPattern extends RegExp ? string : TPattern;
      }
    >
  > {
    this.#schema.pattern = pattern instanceof RegExp ? pattern.source : pattern;
    return this as any;
  }

  // Array

  minItems<TLen extends number>(
    minItems: TLen
  ): Builder<T, UpdateBuilderSchema<TSchema, { minItems: TLen }>> {
    this.#schema.minItems = minItems;
    return this as any;
  }

  maxItems<TLen extends number>(
    maxItems: TLen
  ): Builder<T, UpdateBuilderSchema<TSchema, { maxItems: TLen }>> {
    this.#schema.maxItems = maxItems;
    return this as any;
  }

  uniqueItems<TBool extends boolean>(
    uniqueItems: TBool
  ): Builder<T, UpdateBuilderSchema<TSchema, { uniqueItems: TBool }>> {
    this.#schema.uniqueItems = uniqueItems;
    return this as any;
  }

  additionalItems<TVal extends boolean | AnyBuilder>(
    additionalItems: TVal
  ): Builder<
    T,
    UpdateBuilderSchema<
      TSchema,
      {
        additionalItems: TVal extends boolean ? TVal : InferJSON<TVal>;
      }
    >
  > {
    this.#schema.additionalItems =
      typeof additionalItems === "boolean"
        ? additionalItems
        : additionalItems.#schema;
    return this as any;
  }

  items<TItems extends AnyBuilder | AnyBuilder[]>(
    items: TItems
  ): Builder<
    ReduceArrayType<T, TItems>,
    {
      items: TItems extends AnyBuilder[]
        ? [InferJSON<TItems[number]>]
        : InferJSON<TItems>;
    }
  > {
    this.#schema.items = Array.isArray(items)
      ? items.map((item) => item.#schema)
      : items.#schema;
    return this as any;
  }

  // Object

  minProperties<TLen extends number>(
    minProperties: TLen
  ): Builder<T, UpdateBuilderSchema<TSchema, { minProperties: TLen }>> {
    this.#schema.minProperties = minProperties;
    return this as any;
  }

  maxProperties<TLen extends number>(
    maxProperties: TLen
  ): Builder<T, UpdateBuilderSchema<TSchema, { maxProperties: TLen }>> {
    this.#schema.maxProperties = maxProperties;
    return this as any;
  }

  required<TKeys extends string[]>(
    required: TKeys
  ): Builder<T, UpdateBuilderSchema<TSchema, { required: TKeys }>> {
    this.#schema.required = required;
    return this as any;
  }

  properties<TProperties extends AnyBuilderMap>(
    properties: TProperties
  ): Builder<
    ReduceObjectType<T, TProperties>,
    UpdateBuilderSchema<
      TSchema,
      {
        properties: {
          [key in keyof TProperties]: InferJSON<TProperties[key]>;
        };
      }
    >
  > {
    if (properties) {
      this.#schema.properties = {};
      for (const [key, value] of Object.entries(properties)) {
        this.#schema.properties[key] = value.#schema;
      }
    }
    return this as any;
  }

  patternProperties<TProperties extends AnyBuilderMap>(
    patternProperties: TProperties
  ): Builder<
    ReduceObjectType<T, TProperties>,
    UpdateBuilderSchema<
      TSchema,
      {
        patternProperties: {
          [key in keyof TProperties]: InferJSON<TProperties[key]>;
        };
      }
    >
  > {
    this.#schema.patternProperties = {};
    for (const [key, value] of Object.entries(patternProperties)) {
      this.#schema.patternProperties[key] = value.#schema;
    }
    return this as any;
  }

  additionalProperties<TVal extends boolean | AnyBuilder>(
    additionalProperties: TVal
  ): Builder<
    T,
    UpdateBuilderSchema<
      TSchema,
      {
        additionalProperties: TVal extends boolean ? TVal : InferJSON<TVal>;
      }
    >
  > {
    this.#schema.additionalProperties =
      typeof additionalProperties === "boolean"
        ? additionalProperties
        : additionalProperties.#schema;
    return this as any;
  }

  dependencies<TDependencies extends Record<string, AnyBuilder | string[]>>(
    dependencies: TDependencies
  ): Builder<
    T,
    UpdateBuilderSchema<
      TSchema,
      {
        dependencies: {
          [K in keyof TDependencies]: TDependencies[K] extends AnyBuilder
            ? InferJSON<TDependencies[K]>
            : TDependencies[K] extends string[]
            ? TDependencies[K]
            : never;
        };
      }
    >
  > {
    this.#schema.dependencies = {};
    for (const [key, value] of Object.entries(dependencies)) {
      this.#schema.dependencies[key] =
        value instanceof Builder ? value.#schema : value;
    }
    return this as any;
  }

  // Public

  getSchema(): TSchema {
    return this.#schema as TSchema;
  }
}
export const JSONBuilder = {
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
  type: <T, TType extends JSONSchema["type"] = string>(type: TType) =>
    new Builder<T>().type(type),
  null: () => new Builder<null>().type("null"),
  boolean: () => new Builder<boolean>().type("boolean"),
  number: <T extends number = number>() => new Builder<T>().type("number"),
  string: <T extends string = string>() => new Builder<T>().type("string"),
  array: () => new Builder<unknown[]>().type("array"),
  object: () => new Builder<Record<string, unknown>>().type("object"),

  bsonType: <T, TType extends JSONSchema["bsonType"] = string>(
    bsonType: TType
  ) => new Builder<T>().bsonType(bsonType),
  bool: () => new Builder<boolean>().bsonType("bool"),
  double: <T extends number = number>() => new Builder<T>().bsonType("double"),
  int: <T extends number = number>() => new Builder<T>().bsonType("int"),
  bigint: <T extends bigint = bigint>() => new Builder<T>().bsonType("long"),
  long: () => new Builder<Long>().bsonType("long"),
  decimal: () => new Builder<Decimal128>().bsonType("decimal"),
  date: () => new Builder<Date>().bsonType("date"),
  timestamp: () => new Builder<Timestamp>().bsonType("timestamp"),
  objectId: () => new Builder<ObjectId>().bsonType("objectId"),
  binary: () => new Builder<Binary>().bsonType("binData"),
};
