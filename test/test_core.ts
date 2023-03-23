import { ObjectId } from "bson";

import { B, InferType, validate } from "../src/core/mod.ts";

const User = B.object({
  _id: B.objectId(),
  name: B.string(),
});

type User = InferType<typeof User>;

const UserSchema = User.getSchema();

console.log(UserSchema);

const user: User = {
  _id: new ObjectId(),
  name: "John Doe",
};

console.log(validate(User.getSchema(), user));
