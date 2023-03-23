import { ObjectId } from "bson";

import { Schema, InferType, validate } from "../src/core/mod.ts";

const User = Schema.Object({
  _id: Schema.ObjectId(),
  name: Schema.Str(),
  age: Schema.Number(),
});

type User = InferType<typeof User>;

const UserSchema = User.getSchema();

console.log(UserSchema);

const user: User = {
  _id: new ObjectId(),
  name: "John Doe",
  age: 42,
};

console.log(validate(User.getSchema(), user));
