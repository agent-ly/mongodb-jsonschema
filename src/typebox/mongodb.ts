import { Kind, TypeBuilder, TSchema, TUnsafe } from "@sinclair/typebox";
import { TypeSystem } from "@sinclair/typebox/system";
import { Decimal128, Long, ObjectId, Timestamp } from "bson";

export interface SchemaOptions {
  title?: string;
  description?: string;
  [key: string]: unknown;
}

export interface StringOptions {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

export interface TString extends TSchema {
  [Kind]: "String";
  static: string;
}

export interface NumericOptions<N extends number | bigint> {
  multipleOf?: N;
  minimum?: N;
  exclusiveMinimum?: boolean;
  maximum?: N;
  exclusiveMaximum?: boolean;
}

export interface TNumber extends TSchema {
  [Kind]: "Number";
  static: number;
}

export interface TBigInt extends TSchema {
  [Kind]: "BigInt";
  static: bigint;
}

TypeSystem.Type<Long, NumericOptions<bigint>>(
  "Long",
  (options, value) =>
    value instanceof Long &&
    (options.minimum === undefined ||
      (options.exclusiveMinimum
        ? value.greaterThan(Long.fromBigInt(options.minimum))
        : value.greaterThanOrEqual(Long.fromBigInt(options.minimum)))) &&
    (options.maximum === undefined ||
      (options.exclusiveMaximum
        ? value.lessThan(Long.fromBigInt(options.maximum))
        : value.lessThanOrEqual(Long.fromBigInt(options.maximum))))
);
TypeSystem.Type<Decimal128>(
  "Decimal",
  (_, value) => value instanceof Decimal128
);
TypeSystem.Type<number | string | Date>(
  "Date",
  (_, value) =>
    typeof value === "number" ||
    typeof value === "string" ||
    value instanceof Date
);
TypeSystem.Type<number | string | Timestamp>(
  "Timestamp",
  (_, value) =>
    typeof value === "number" ||
    typeof value === "string" ||
    value instanceof Timestamp
);
TypeSystem.Type<string | ObjectId>("ObjectId", (_, value) =>
  typeof value === "string"
    ? ObjectId.isValid(value)
    : value instanceof ObjectId
);
TypeSystem.Type<Buffer>("BinData", (_, value) => value instanceof Buffer);

export class MongoDBTypeBuilder extends TypeBuilder {
  String(options?: StringOptions): TString {
    return this.Create({
      ...options,
      [Kind]: "String",
      type: "string",
    });
  }
  Number(options?: NumericOptions<number>): TNumber {
    return this.Create({
      ...options,
      [Kind]: "Number",
      type: "number",
    });
  }

  Int(options?: NumericOptions<number>): TNumber {
    return this.Create({
      ...options,
      [Kind]: "Number",
      bsonType: "int",
    });
  }
  BigInt(options?: NumericOptions<bigint>): TBigInt {
    return this.Create({
      ...options,
      [Kind]: "BigInt",
      bsonType: "long",
    });
  }
  Double(options?: NumericOptions<number>): TNumber {
    return this.Create({
      ...options,
      [Kind]: "Number",
      bsonType: "double",
    });
  }
  Long(options?: NumericOptions<bigint>): TUnsafe<Long> {
    return this.Create({
      ...options,
      [Kind]: "Long",
      bsonType: "long",
    });
  }
  Decimal(): TUnsafe<Decimal128> {
    return this.Create({
      [Kind]: "Decimal",
      bsonType: "decimal",
    });
  }
  Date(): TUnsafe<number | string | Date> {
    return this.Create({
      [Kind]: "Date",
      bsonType: "date",
    });
  }
  Timestamp(): TUnsafe<number | string | Timestamp> {
    return this.Create({
      [Kind]: "Timestamp",
      bsonType: "timestamp",
    });
  }
  ObjectId(): TUnsafe<string | ObjectId> {
    return this.Create({
      [Kind]: "ObjectId",
      bsonType: "objectId",
    });
  }
  BinData(): TUnsafe<Buffer> {
    return this.Create({
      [Kind]: "BinData",
      bsonType: "binData",
    });
  }
}

export const MongoType = new MongoDBTypeBuilder();
