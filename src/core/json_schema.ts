export const JSONTypes = [
  "null",
  "boolean",
  "string",
  "number",
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
  multipleOf?: number;
  minimum?: number;
  exclusiveMinimum?: boolean;
  maximum?: number;
  exclusiveMaximum?: boolean;
}

interface ArrayKeywords {
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
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
