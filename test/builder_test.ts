import { Type, InferType } from "../src/mod.ts";

const User = Type.object({
  _id: Type.string(),
  name: Type.string(),
  age: Type.number(),
  email: Type.string().nullable(),
  createdAt: Type.date(),
  updatedAt: Type.date(),
});

type User = InferType<typeof User>;
