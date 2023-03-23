import { Decimal128, Long, ObjectId, Timestamp } from "bson";

import type { BSONType, JSONType, JSONSchema } from "./json_schema.ts";

type TypeValidatorFn = (data: unknown) => boolean;

interface KeywordValidatorFn {
  (value: any, data: any): boolean;
  (value: any, data: any, schema: JSONSchema): boolean;
}

const JSONTypeValidators: Record<string, TypeValidatorFn> = {
  null: (data: unknown): data is null => data === null,
  boolean: (data: unknown): data is boolean => typeof data === "boolean",
  string: (data: unknown): data is string => typeof data === "string",
  number: (data: unknown): data is number => typeof data === "number",
  array: (data: unknown): data is unknown[] => Array.isArray(data),
  object: (data: unknown): data is Record<string, unknown> =>
    typeof data === "object" && data !== null,
};

const BSONTypeValidators: Record<string, TypeValidatorFn> = {
  null: JSONTypeValidators.null,
  bool: JSONTypeValidators.boolean,
  string: JSONTypeValidators.string,
  object: JSONTypeValidators.object,
  array: JSONTypeValidators.array,

  int: (data: unknown): data is number =>
    typeof data === "number" && Number.isInteger(data),
  double: (data: unknown): data is number =>
    typeof data === "number" && !Number.isInteger(data),
  long: (data: unknown): data is bigint =>
    typeof data === "bigint" || data instanceof Long,
  decimal: (data: unknown): data is Decimal128 => data instanceof Decimal128,
  date: (data: unknown): data is Date => data instanceof Date,
  timestamp: (data: unknown): data is Timestamp => data instanceof Timestamp,
  objectId: (data: unknown): data is ObjectId => data instanceof ObjectId,
  binData: (data: unknown): data is Buffer => data instanceof Buffer,
};

const LogicalKeywordValidators: Record<string, KeywordValidatorFn> = {
  allOf: (value: JSONSchema[], data: unknown) =>
    value.every((schema) => validate(schema, data)),
  anyOf: (value: JSONSchema[], data: unknown) =>
    value.some((schema) => validate(schema, data)),
  oneOf: (value: JSONSchema[], data: unknown) =>
    value.filter((schema) => validate(schema, data)).length === 1,
  not: (value: JSONSchema, data: unknown) => !validate(value, data),
  enum: (value: unknown[], data: unknown) => value.includes(data),
};

const TypeKeywordValidators: Record<string, KeywordValidatorFn> = {
  type: (value: string, data: unknown) => {
    const validator = JSONTypeValidators[value as JSONType];
    return validator ? validator(data) : true;
  },
  bsonType: (value: string, data: unknown) => {
    const validator = BSONTypeValidators[value as BSONType];
    return validator ? validator(data) : true;
  },
};

const ScalarKeywordValidators: Record<string, KeywordValidatorFn> = {
  minLength: (value: number, data: string) => data.length >= value,
  maxLength: (value: number, data: string) => data.length <= value,
  pattern: (value: string, data: string) => new RegExp(value).test(data),
  multipleOf: <T extends number | bigint = number>(value: T, data: T) =>
    data % value === 0,
  minimum: <T extends number | bigint = number>(
    value: T,
    data: T,
    schema?: JSONSchema
  ) => (schema!.exclusiveMinimum ? data > value : data >= value),
  maximum: <T extends number | bigint = number>(
    value: T,
    data: T,
    schema?: JSONSchema
  ) => (schema!.exclusiveMaximum ? data < value : data <= value),
};

const ArrayKeywordValidators: Record<string, KeywordValidatorFn> = {
  minItems: (value: number, data: unknown[]) => data.length >= value,
  maxItems: (value: number, data: unknown[]) => data.length <= value,
  uniqueItems: (value: boolean, data: unknown[]) =>
    value && new Set(data).size === data.length,
  items: (value: JSONSchema | JSONSchema[], data: unknown[]) =>
    data.every((item, index) =>
      validate(value instanceof Array ? value[index] : value, item)
    ),
  additionalItems: (
    value: boolean | JSONSchema,
    data: unknown[],
    schema?: JSONSchema
  ) =>
    typeof value === "boolean"
      ? value
      : schema!.items
      ? data
          .slice(Array.isArray(schema!.items) ? schema!.items.length : 1)
          .every((item) => validate(value, item))
      : true,
};

function getPropertiesContext(
  data: Record<string, unknown>,
  properties?: Record<string, JSONSchema>,
  patternProperties?: Record<string, JSONSchema>
) {
  const propertyKeys = properties ? Object.keys(data) : [];
  const otherKeys = Object.keys(data).filter(
    (key) => !propertyKeys.includes(key)
  );
  if (otherKeys.length > 0) {
    const patternKeys: { key: string; schema: JSONSchema }[] = [];
    const matchedKeys: string[] = [];
    const patterns = patternProperties
      ? Object.entries(patternProperties).map(([pattern, schema]) => ({
          pattern: new RegExp(pattern),
          schema,
        }))
      : [];
    for (const key of otherKeys) {
      for (const { pattern, schema } of patterns) {
        if (pattern.test(key)) {
          patternKeys.push({ key, schema });
          matchedKeys.push(key);
          break;
        }
      }
    }
    if (matchedKeys.length < otherKeys.length) {
      const additionalKeys = otherKeys.filter(
        (key) => !matchedKeys.includes(key)
      );
      return { additionalKeys };
    }
    return { patternKeys };
  }
  return {};
}

function validateProperty(
  key: string,
  data: Record<string, unknown>,
  schema: JSONSchema
) {
  try {
    validate(schema, data[key]);
    return true;
  } catch (error) {
    if (error instanceof ValidationError) {
      error.key = key;
      error.path = error.path ? `${key}.${error.path}` : key;
    }
    throw error;
  }
}

const ObjectKeywordValidators: Record<string, KeywordValidatorFn> = {
  minProperties: (value: number, data: Record<string, unknown>) =>
    Object.keys(data).length >= value,
  maxProperties: (value: number, data: Record<string, unknown>) =>
    Object.keys(data).length <= value,
  required: (value: string[], data: Record<string, unknown>) =>
    value.every((key) => data[key] !== undefined),
  properties: (
    value: Record<string, JSONSchema>,
    data: Record<string, unknown>
  ) =>
    Object.entries(value)
      .filter(([key]) => data[key] !== undefined)
      .every(([key, schema]) => validateProperty(key, data, schema)),
  patternProperties: (
    value: Record<string, JSONSchema>,
    data: Record<string, unknown>,
    schema?: JSONSchema
  ) => {
    const { patternKeys } = getPropertiesContext(
      data,
      schema?.properties,
      value
    );
    if (!patternKeys) return true;
    return patternKeys.every(({ key, schema }) =>
      validateProperty(key, data, schema)
    );
  },
  additionalProperties: (
    value: boolean | JSONSchema,
    data: Record<string, unknown>,
    schema?: JSONSchema
  ) => {
    const { additionalKeys } = getPropertiesContext(
      data,
      schema?.properties,
      schema?.patternProperties
    );
    if (!additionalKeys) return true;
    if (typeof value === "boolean") return value;
    return additionalKeys.every((key) => validateProperty(key, data, value));
  },
  dependencies: (
    value: Record<string, string[] | JSONSchema>,
    data: Record<string, unknown>
  ) =>
    Object.entries(value).every(([initKey, initDep]) =>
      data[initKey] !== undefined
        ? Array.isArray(initDep)
          ? initDep.every((depKey) => data[depKey] !== undefined)
          : validate(initDep, data)
        : true
    ),
};

function validateLogical(schema: JSONSchema, data: unknown) {
  schema.allOf && LogicalKeywordValidators.allOf(schema.allOf, data);
  schema.anyOf && LogicalKeywordValidators.anyOf(schema.anyOf, data);
  schema.oneOf && LogicalKeywordValidators.oneOf(schema.oneOf, data);
  schema.not && LogicalKeywordValidators.not(schema.not, data);
  if (schema.enum && !LogicalKeywordValidators.enum(schema.enum, data))
    throw new ValidationError(`Value "${data}" is not defined in enum.`, data);
}

function validateType(schema: JSONSchema, data: unknown) {
  if (schema.type && !TypeKeywordValidators.type(schema.type, data))
    throw new ValidationError(`Invalid type, expected ${schema.type}.`, data);
  if (schema.bsonType && !TypeKeywordValidators.bsonType(schema.bsonType, data))
    throw new ValidationError(
      `Invalid BSON type, expected ${schema.bsonType}.`,
      data
    );
}

function validateScalar(schema: JSONSchema, data: unknown) {
  if (typeof data === "string") {
    if (
      schema.minLength !== undefined &&
      schema.minLength >= 0 &&
      !ScalarKeywordValidators.minLength(schema.minLength, data)
    )
      throw new ValidationError(
        `String "${data}" is less than the minimum length of ${schema.minLength}`,
        data
      );
    if (
      schema.maxLength !== undefined &&
      schema.maxLength >= 0 &&
      !ScalarKeywordValidators.maxLength(schema.maxLength, data)
    )
      throw new ValidationError(
        `String "${data}" exceeds the maximum length of ${schema.maxLength}`,
        data
      );
    if (
      schema.pattern &&
      !ScalarKeywordValidators.pattern(schema.pattern, data)
    )
      throw new ValidationError(
        `String "${data}" does not match the pattern ${schema.pattern}`,
        data
      );
  } else if (typeof data === "number") {
    if (
      schema.multipleOf !== undefined &&
      schema.multipleOf > 0 &&
      !ScalarKeywordValidators.multipleOf(schema.multipleOf, data)
    )
      throw new ValidationError(
        `Number ${data} is not a multiple of ${schema.multipleOf}.`,
        data
      );
    if (
      schema.minimum !== undefined &&
      !ScalarKeywordValidators.minimum(schema.minimum, data)
    )
      throw new ValidationError(
        `Number ${data} is less than the minimum value of ${schema.minimum}.`,
        data
      );
    if (
      schema.maximum !== undefined &&
      !ScalarKeywordValidators.maximum(schema.maximum, data)
    )
      throw new ValidationError(
        `Number ${data} is exceeds the maximum value of ${schema.maximum}.`,
        data
      );
  }
  return true;
}

function validateArray(schema: JSONSchema, data: unknown) {
  if (data instanceof Array) {
    if (
      schema.minItems !== undefined &&
      schema.minItems >= 0 &&
      !ArrayKeywordValidators.minItems(schema.minItems, data)
    )
      throw new ValidationError(
        `Array item count ${data} is less than the minimum count of ${schema.minItems}.`,
        data
      );
    if (
      schema.maxItems !== undefined &&
      schema.maxItems >= 0 &&
      !ArrayKeywordValidators.maxItems(schema.maxItems, data)
    )
      throw new ValidationError(
        `Array item count ${data} exceeds the maximum count of ${schema.maxItems}.`,
        data
      );
    if (
      schema.uniqueItems !== undefined &&
      !ArrayKeywordValidators.uniqueItems(schema.uniqueItems, data)
    )
      throw new ValidationError("Array items are not unique.", data);

    schema.items && !ArrayKeywordValidators.items(schema.items, data);

    if (
      schema.additionalItems !== undefined &&
      !ArrayKeywordValidators.additionalItems(
        schema.additionalItems,
        data,
        schema
      )
    )
      throw new ValidationError("Additional items are not allowed.", data);
  }
}

function validateObject(schema: JSONSchema, data: unknown) {
  if (typeof data === "object" && data !== null) {
    if (
      schema.minProperties !== undefined &&
      schema.minProperties >= 0 &&
      !ObjectKeywordValidators.minProperties(schema.minProperties, data)
    )
      throw new ValidationError(
        `Object property count ${data} is less than the minimum count of ${schema.minProperties}.`,
        data
      );
    if (
      schema.maxProperties !== undefined &&
      schema.maxProperties >= 0 &&
      !ObjectKeywordValidators.maxProperties(schema.maxProperties, data)
    )
      throw new ValidationError(
        `Object property count ${data} exceeds the maximum count of ${schema.maxProperties}.`,
        data
      );
    if (
      schema.required &&
      !ObjectKeywordValidators.required(schema.required, data)
    )
      throw new ValidationError("Object is missing required properties.", data);

    schema.properties &&
      ObjectKeywordValidators.properties(schema.properties, data);

    schema.patternProperties &&
      !ObjectKeywordValidators.patternProperties(
        schema.patternProperties,
        data,
        schema
      );

    if (
      schema.additionalProperties !== undefined &&
      !ObjectKeywordValidators.additionalProperties(
        schema.additionalProperties,
        data,
        schema
      )
    )
      throw new ValidationError("Additional properties are not allowed.", data);

    schema.dependencies &&
      ObjectKeywordValidators.dependencies(schema.dependencies, data);
  }
  return true;
}

function hasValidationKeys(schema: JSONSchema) {
  const keys = Object.keys(schema);
  return (
    keys.filter((key) => key !== "title" && key !== "description").length > 0
  );
}

export function validate(schema: JSONSchema, data: unknown): true {
  if (hasValidationKeys(schema)) {
    validateLogical(schema, data);
    validateType(schema, data);
    validateScalar(schema, data);
    validateArray(schema, data);
    validateObject(schema, data);
  }
  return true;
}

export function safeValidate(
  schema: JSONSchema,
  data: unknown
):
  | {
      valid: true;
    }
  | {
      valid: false;
      error: ValidationError;
    } {
  try {
    validate(schema, data);
    return { valid: true };
  } catch (error) {
    if (error instanceof ValidationError) {
      return { valid: false, error };
    }
    throw error;
  }
}

export class ValidationError extends Error {
  cause: unknown;
  key?: string;
  path?: string;
  constructor(message: string, data: unknown) {
    super(message);
    this.name = "ValidationError";
    this.cause = data;
  }
}
