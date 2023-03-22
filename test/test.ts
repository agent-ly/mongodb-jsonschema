import { validate } from "../src/mod.ts";

const schema = {
  bsonType: "object",
  properties: {
    foo: {
      bsonType: "object",
      properties: {
        bar: {
          bsonType: "string",
        },
      },
    },
  },
};

console.log(
  validate(schema, {
    foo: {
      bar: 1,
    },
  })
);
