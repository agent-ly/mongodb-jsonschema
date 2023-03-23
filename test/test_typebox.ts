import { Static, Type } from "@sinclair/typebox";
import { TypeCompiler } from "@sinclair/typebox/compiler";

import { MongoType } from "../src/typebox/mongodb.ts";
import { ObjectId } from "bson";

const User = Type.Object({
  _id: MongoType.ObjectId(),
  name: MongoType.String(),
});

const UserSchema = Type.Strict(User);

console.log(UserSchema);

type User = Static<typeof User>;

const user: User = {
  _id: new ObjectId(),
  name: "John Doe",
};

const checker = TypeCompiler.Compile(User);

console.log(checker.Check(user));
