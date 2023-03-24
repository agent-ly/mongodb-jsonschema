import { Build, InferType, LoosenType } from "../src/mod.ts";

const builder = Build.object({
  _id: Build.string(),
  name: Build.string(),
  age: Build.number().nullable(),
  email: Build.string().nullable(),
  bio: Build.string().nullable(),
  tags: Build.array(Build.string()),
  metadata: Build.object(),
});

type User = InferType<typeof builder>;
type NewUser = LoosenType<User>;

console.dir(builder.getSchema(), { depth: 10 });
