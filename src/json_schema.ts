export const JSONTypes = [
  "null",
  "boolean",
  "string",
  "number",
  "object",
  "array",
] as const;

export type JSONType = string | typeof JSONTypes[number];

export const BSONTypes = [
  "null",
  "bool",
  "string",
  "object",
  "array",
  "double",
  "int",
  "long",
  "date",
  "binData",
  "objectId",
  "timestamp",
] as const;

export type BSONType = string | typeof BSONTypes[number];

interface MetadataKeywords {
  title?: string;
  description?: string;
}

interface LogicalKeywords {
  allOf?: JSONSchema[];
  anyOf?: JSONSchema[];
  oneOf?: JSONSchema[];
  not?: JSONSchema;
  enum?: unknown[];
}

interface TypeKeywords {
  type?: JSONType | JSONType[];
  bsonType?: BSONType | BSONType[];
}

interface ScalarKeywords {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  minimum?: number;
  exclusiveMinimum?: boolean;
  maximum?: number;
  exclusiveMaximum?: boolean;
  multipleOf?: number;
}

interface ArrayKeywords {
  uniqueItems?: boolean;
  minItems?: number;
  maxItems?: number;
  items?: JSONSchema | JSONSchema[];
  additionalItems?: boolean | JSONSchema;
}

interface ObjectKeywords {
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
