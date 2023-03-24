export const JSONTypes = [
  "null",
  "boolean",
  "number",
  "string",
  "array",
  "object",
] as const;

export type JSONType = string | typeof JSONTypes[number];

export const BSONTypes = [
  "null",
  "bool",
  "string",
  "array",
  "object",
  "int",
  "double",
  "long",
  "decimal",
  "date",
  "timestamp",
  "objectId",
  "binData",
] as const;

export type BSONType = string | typeof BSONTypes[number];

export interface MetadataKeywords {
  title?: string;
  description?: string;
}

export interface LogicalKeywords {
  allOf?: JSONSchema[];
  anyOf?: JSONSchema[];
  oneOf?: JSONSchema[];
  not?: JSONSchema;
  enum?: unknown[];
}

export interface TypeKeywords {
  type?: JSONType | JSONType[];
  bsonType?: BSONType | BSONType[];
}

export interface NumericKeywords {
  multipleOf?: number | bigint;
  minimum?: number | bigint;
  exclusiveMinimum?: boolean;
  maximum?: number | bigint;
  exclusiveMaximum?: boolean;
}

export interface StringKeywords {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

export type ScalarKeywords = NumericKeywords & StringKeywords;

export interface ArrayKeywords {
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  items?: JSONSchema | JSONSchema[];
  additionalItems?: boolean | JSONSchema;
}

export interface ObjectKeywords {
  minProperties?: number;
  maxProperties?: number;
  required?: string[];
  properties?: Record<string, JSONSchema>;
  patternProperties?: Record<string, JSONSchema>;
  additionalProperties?: boolean | JSONSchema;
  dependencies?: Record<string, JSONSchema | string[]>;
}

export type JSONSchema = MetadataKeywords &
  LogicalKeywords &
  TypeKeywords &
  ScalarKeywords &
  ArrayKeywords &
  ObjectKeywords;
