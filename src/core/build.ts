import type { Decimal128, Long, ObjectId, Timestamp } from "bson";

import type { TupleToIntersect, TupleToUnion } from "./util.ts";
import type { BSONType, JSONSchema, JSONType } from "./json_schema.ts";

export type InferType<T> = T extends Builder<infer U> ? U : never;

type AnyBuilder = Builder<unknown>;
type AllOfBuilder<U extends AnyBuilder[], T = unknown> = Builder<
  T & InferType<TupleToIntersect<U>>
>;
type AnyOfOrOneOfBuilder<U extends AnyBuilder[], T = unknown> = Builder<
  T & InferType<TupleToUnion<U>>
>;
type NotBuilder<U extends AnyBuilder, T> = Builder<
  T extends InferType<U> ? never : T
>;
type EnumBuilder<
  U extends Record<string, string | number> = {},
  T = unknown
> = Builder<T & U[keyof U]>;
type ArrayBuilder<
  U extends AnyBuilder | AnyBuilder[] = [],
  T = unknown
> = Builder<
  U extends AnyBuilder[] ? T & InferType<U[number]>[] : T & InferType<U>[]
>;
type ObjectBuilder<
  U extends Record<string, AnyBuilder> = {},
  T = unknown
> = Builder<T & { [K in keyof U]: InferType<U[K]> }>;

export class Builder<T> {
  protected declare __type__: T;

  #schema: JSONSchema = {};

  undefinable(): Builder<T | undefined> {
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

  enum<U extends Record<string, string | number>>(
    enumMap: U
  ): EnumBuilder<U, T> {
    this.#schema.enum = [...Object.values(enumMap)];
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

  minLength(minLength = 0) {
    this.#schema.minLength = minLength;
    return this;
  }

  maxLength(maxLength = 0) {
    this.#schema.maxLength = maxLength;
    return this;
  }

  pattern(pattern: string) {
    this.#schema.pattern = pattern;
    return this;
  }

  multipleOf(multipleOf: number) {
    this.#schema.multipleOf = multipleOf;
    return this;
  }

  minimum(minimum = 0, exclusive = false) {
    this.#schema.minimum = minimum;
    if (exclusive !== undefined) this.#schema.exclusiveMinimum = exclusive;
    return this;
  }

  maximum(maximum: number, exclusive = false) {
    this.#schema.maximum = maximum;
    if (exclusive !== undefined) this.#schema.exclusiveMaximum = exclusive;
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

export type BuilderFunctions = {
  any: <T>() => Builder<T>;
  allOf: <U extends AnyBuilder[]>(builders: U) => AllOfBuilder<U>;
  anyOf: <U extends AnyBuilder[]>(builders: U) => AnyOfOrOneOfBuilder<U>;
  oneOf: <U extends AnyBuilder[]>(builders: U) => AnyOfOrOneOfBuilder<U>;
  enum: <T extends Record<string, string | number> = {}>(
    enums: T
  ) => EnumBuilder<T>;
  null: () => Builder<null>;
  string: <T extends string = string>() => Builder<T>;
  number: <T extends number = number>() => Builder<T>;
  array(): Builder<unknown[]>;
  array<T extends AnyBuilder | AnyBuilder[]>(
    builderOrBuilders: T
  ): ArrayBuilder<T>;
  object(): Builder<Record<string, unknown>>;
  object<U extends Record<string, AnyBuilder>>(properties: U): ObjectBuilder<U>;

  int: <T extends number = number>() => Builder<T>;
  bigint: () => Builder<bigint>;
  double: () => Builder<number>;
  long: () => Builder<Long>;
  decimal: () => Builder<Decimal128>;
  date: () => Builder<Date>;
  timestamp: () => Builder<Timestamp>;
  objectId: () => Builder<ObjectId>;
  binData: () => Builder<Buffer>;
};

export const B: BuilderFunctions = {
  any: () => new Builder(),
  allOf: (builders) => new Builder().allOf(builders),
  anyOf: (builders) => new Builder().anyOf(builders),
  oneOf: (builders) => new Builder().oneOf(builders),
  enum: (enums) => new Builder().enum(enums),
  null: () => new Builder<null>().type("null"),
  string: <T extends string = string>() => new Builder<T>().type("string"),
  number: <T extends number = number>() => new Builder<T>().type("number"),
  array: <T extends AnyBuilder | AnyBuilder[]>(builderOrBuilders?: T) => {
    return builderOrBuilders
      ? new Builder().type("array").items(builderOrBuilders)
      : new Builder<unknown[]>().type("array");
  },
  object: <U extends Record<string, AnyBuilder>>(properties?: U) => {
    return properties
      ? new Builder().type("object").properties(properties)
      : new Builder<Record<string, unknown>>().type("object");
  },

  int: <T extends number = number>() => new Builder<T>().bsonType("int"),
  bigint: () => new Builder<bigint>().bsonType("long"),
  double: () => new Builder<number>().bsonType("double"),
  long: () => new Builder<Long>().bsonType("long"),
  decimal: () => new Builder<Decimal128>().bsonType("decimal"),
  date: () => new Builder<Date>().bsonType("date"),
  timestamp: () => new Builder<Timestamp>().bsonType("timestamp"),
  objectId: () => new Builder<ObjectId>().bsonType("objectId"),
  binData: () => new Builder<Buffer>().bsonType("binData"),
};
